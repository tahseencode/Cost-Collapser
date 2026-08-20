import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { CONFIG } from './config.js';
import { adapterEngine } from './adapters/adapterEngine.js';
import { AdapterCompiler } from './adapters/compiler.js';
import { sentinelMonitor } from './sentinel/monitor.js';
import { costCalculator } from './sentinel/costCalculator.js';
import { approvalGate } from './agent/approvalGate.js';
import { wakeUpEngine } from './agent/wakeUpEngine.js';
import { autonomousAgent } from './agent/autonomousAgent.js';
import { browserAgent } from './agent/browserAgent.js';
import { storeRouter } from './mock-store/storeRouter.js';
import { MOCK_PRODUCTS } from './mock-store/storeData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Initialize Express App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Command Center Static Assets
app.use(express.static(path.join(projectRoot, 'public')));

// Mount Mock Store on same app for convenience
app.use(storeRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Track connected WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  // Send initial state upon connection
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    status: sentinelMonitor.getStatus(),
    history: sentinelMonitor.getRecentHistory().slice(0, 20),
    pendingGates: approvalGate.getPendingGates(),
    auditLog: approvalGate.getAuditLog().slice(0, 10),
    adapters: adapterEngine.getAllAdapters(),
    products: Object.values(MOCK_PRODUCTS)
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// Hook Sentinel Monitor Events to WebSocket Broadcasts
sentinelMonitor.on('check', (entry) => {
  broadcast({
    type: 'SENTINEL_CHECK',
    entry,
    metrics: costCalculator.getMetrics()
  });
});

sentinelMonitor.on('trigger_alert', (data) => {
  broadcast({
    type: 'AGENTIC_WAKE_UP',
    data,
    metrics: costCalculator.getMetrics()
  });
});

sentinelMonitor.on('status_change', (status) => {
  broadcast({
    type: 'MONITOR_STATUS',
    status: sentinelMonitor.getStatus()
  });
});

approvalGate.on('gate_created', (gate) => {
  broadcast({
    type: 'GATE_CREATED',
    gate
  });
});

approvalGate.on('gate_resolved', (gate) => {
  broadcast({
    type: 'GATE_RESOLVED',
    gate,
    auditLog: approvalGate.getAuditLog().slice(0, 10)
  });
});

browserAgent.on('action', (log) => {
  broadcast({
    type: 'BROWSER_ACTION',
    log,
    state: browserAgent.getState()
  });
});

browserAgent.on('navigation_complete', (state) => {
  broadcast({
    type: 'BROWSER_NAVIGATED',
    state
  });
});

// ================= REST API ROUTES =================


// 1. Status & Metrics API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: sentinelMonitor.getStatus(),
    adapters: adapterEngine.getAllAdapters(),
    pendingGates: approvalGate.getPendingGates(),
    metrics: costCalculator.getMetrics()
  });
});

// 2. Sentinel Controls
app.post('/api/monitor/start', (req, res) => {
  const { adapterId, intervalSec } = req.body;
  sentinelMonitor.start(adapterId, intervalSec);
  res.json({ success: true, status: sentinelMonitor.getStatus() });
});

app.post('/api/monitor/stop', (req, res) => {
  sentinelMonitor.stop();
  res.json({ success: true, status: sentinelMonitor.getStatus() });
});

app.post('/api/monitor/interval', (req, res) => {
  const { intervalSec } = req.body;
  sentinelMonitor.setIntervalSec(intervalSec);
  res.json({ success: true, intervalSec: sentinelMonitor.pollIntervalSec });
});

app.post('/api/monitor/select-adapter', (req, res) => {
  const { adapterId } = req.body;
  sentinelMonitor.setActiveAdapter(adapterId);
  res.json({ success: true, activeAdapterId: sentinelMonitor.activeAdapterId });
});

// 3. Adapter Management & Compilation
app.get('/api/adapters', (req, res) => {
  res.json({ success: true, adapters: adapterEngine.getAllAdapters() });
});

app.post('/api/adapters/register', (req, res) => {
  try {
    const adapter = adapterEngine.registerAdapter(req.body);
    broadcast({ type: 'ADAPTER_REGISTERED', adapter, adapters: adapterEngine.getAllAdapters() });
    res.json({ success: true, adapter });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/adapters/compile', (req, res) => {
  const { adapterId } = req.body;
  const adapter = adapterEngine.getAdapter(adapterId);
  if (!adapter) return res.status(404).json({ error: 'Adapter not found' });
  const script = AdapterCompiler.compileToScript(adapter);
  res.json({ success: true, script, adapter });
});

app.post('/api/adapters/test', async (req, res) => {
  const { adapterId } = req.body;
  const result = await adapterEngine.execute(adapterId || req.body);
  res.json(result);
});

// 4. Human-in-the-Loop Approval Gate API
app.get('/api/gate/pending', (req, res) => {
  res.json({ success: true, pendingGates: approvalGate.getPendingGates() });
});

app.get('/api/gate/audit', (req, res) => {
  res.json({ success: true, auditLog: approvalGate.getAuditLog() });
});

app.post('/api/gate/approve', async (req, res) => {
  try {
    const { gateId, operator, notes } = req.body;
    const result = await approvalGate.approveGate(gateId, operator, notes);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/gate/reject', async (req, res) => {
  try {
    const { gateId, operator, reason } = req.body;
    const result = await approvalGate.rejectGate(gateId, operator, reason);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Autonomous AI Agent Co-Pilot API
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const response = await autonomousAgent.chat(prompt);
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/agent/tools', (req, res) => {
  res.json({ success: true, tools: autonomousAgent.tools });
});


// 6. Live Browser AI Agent API (Layer 0 & Layer 1 Control)
app.get('/api/browser/state', (req, res) => {
  res.json({ success: true, state: browserAgent.getState() });
});

app.post('/api/browser/navigate', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const state = await browserAgent.navigate(url);
    res.json({ success: true, state });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/browser/inspect', async (req, res) => {
  try {
    const elements = await browserAgent.autoInspectDOM();
    res.json({ success: true, elements, state: browserAgent.getState() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/browser/compile', (req, res) => {
  try {
    const { adapterId, threshold } = req.body;
    const result = browserAgent.compileCurrentTargetToZeroToken(adapterId, threshold);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Hackathon Live Demo 1-Click Triggers

app.post('/api/demo/trigger-drop', (req, res) => {
  const targetProduct = MOCK_PRODUCTS['titan-carbide-drill-5000'];
  targetProduct.price = 39.99; // Drop below $50 threshold!
  targetProduct.priceHistory.push({ price: 39.99, timestamp: new Date().toISOString() });

  // Force immediate tick so judges see it instantly!
  sentinelMonitor.tick();

  res.json({
    success: true,
    message: '🚨 Triggered Flash Price Drop to $39.99 (below $50.00 threshold)! Sentinel is waking up AI Agent...',
    product: targetProduct
  });
});

app.post('/api/demo/reset', (req, res) => {
  const targetProduct = MOCK_PRODUCTS['titan-carbide-drill-5000'];
  targetProduct.price = targetProduct.initialPrice;
  costCalculator.reset();
  sentinelMonitor.lastTriggeredState = false;

  res.json({
    success: true,
    message: 'Reset demo state and cost metrics to standard baseline ($129.99)',
    product: targetProduct,
    metrics: costCalculator.getMetrics()
  });
});

// Start Servers
const PORT = CONFIG.PORT;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ COST COLLAPSER AI ENGINE ACTIVE`);
  console.log(`📡 Dashboard: http://localhost:${PORT}`);
  console.log(`🏪 Monitored Store: http://localhost:${PORT}/products/titan-carbide-drill-5000`);
  console.log(`======================================================\n`);

  // Start the background monitoring loop automatically
  sentinelMonitor.start('apex-industrial', CONFIG.POLL_INTERVAL_SEC);
});


// Also create separate port 4100 listener if desired
const mockApp = express();
mockApp.use(express.json());
mockApp.use(storeRouter);
mockApp.get('/', (req, res) => res.redirect('/products/titan-carbide-drill-5000'));
mockApp.listen(CONFIG.MOCK_STORE_PORT, () => {
  console.log(`🏪 Dedicated Target Store Bridge: http://localhost:${CONFIG.MOCK_STORE_PORT}`);
});
