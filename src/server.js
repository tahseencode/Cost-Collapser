import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
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
import { emailService } from './services/emailService.js';
import { storeRouter } from './mock-store/storeRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Initialize Express App
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Mock Store Endpoints
app.use(storeRouter);

// Serve Static Assets
app.use(express.static(path.join(projectRoot, 'public')));
app.use(express.static(projectRoot));

app.get('/', (req, res) => {
  const publicIndex = path.join(projectRoot, 'public', 'index.html');
  const rootIndex = path.join(projectRoot, 'index.html');
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  } else if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  res.setHeader('Content-Type', 'text/html');
  res.send('<!DOCTYPE html><html><head><title>Cost Collapser</title></head><body><h1>⚡ Cost Collapser Active</h1></body></html>');
});

export const server = http.createServer(app);

// Track connected WebSocket clients
let wss = null;
const clients = new Set();

// Only initialize WebSocket server in standalone Node.js server mode (not in Vercel Serverless)
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  try {
    wss = new WebSocketServer({ server });

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
        emailConfig: emailService.getConfig()
      }));

      ws.on('close', () => {
        clients.delete(ws);
      });
    });
  } catch (err) {
    console.warn('[WebSocket Init Notice]', err.message);
  }
}

function broadcast(payload) {
  if (!wss || clients.size === 0) return;
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

sentinelMonitor.on('trigger_alert', async (data) => {
  broadcast({
    type: 'AGENTIC_WAKE_UP',
    data,
    metrics: costCalculator.getMetrics()
  });

  // Automatically dispatch real-time Gmail Alert!
  try {
    const emailResult = await emailService.sendPriceAlertEmail({
      item: data.result?.item,
      price: data.result?.price,
      threshold: data.result?.threshold,
      currency: data.result?.currency,
      vendor: data.result?.vendor,
      summary: data.wakeEvent?.analysis?.executiveSummary,
      poNumber: data.gate?.gateId
    });

    broadcast({
      type: 'EMAIL_ALERT_SENT',
      emailResult
    });
  } catch (err) {
    console.error('[Gmail Alert Error]', err.message);
  }
});


sentinelMonitor.on('status_change', (status) => {
  broadcast({
    type: 'MONITOR_STATUS',
    status: sentinelMonitor.getStatus()
  });
});

sentinelMonitor.on('error', (err) => {
  console.error('[Sentinel Error]', err);
  broadcast({
    type: 'SENTINEL_ERROR',
    error: err
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

// ================= REST API ROUTES =================

// 1. Status & Metrics API (Supports automatic serverless initial tick)
app.get('/api/status', async (req, res) => {
  try {
    let recentCheck = sentinelMonitor.getRecentHistory()[0];
    if (!recentCheck || req.query.tick === 'true') {
      recentCheck = await sentinelMonitor.tick();
    }
    res.json({
      success: true,
      status: sentinelMonitor.getStatus(),
      latestCheck: recentCheck || null,
      adapters: adapterEngine.getAllAdapters(),
      pendingGates: approvalGate.getPendingGates(),
      auditLog: approvalGate.getAuditLog().slice(0, 10),
      metrics: costCalculator.getMetrics(),
      emailConfig: emailService.getConfig()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Serverless & Manual Check Tick API
app.get('/api/tick', async (req, res) => {
  try {
    const entry = await sentinelMonitor.tick();
    res.json({
      success: true,
      entry,
      status: sentinelMonitor.getStatus(),
      metrics: costCalculator.getMetrics(),
      pendingGates: approvalGate.getPendingGates(),
      auditLog: approvalGate.getAuditLog().slice(0, 10),
      adapters: adapterEngine.getAllAdapters()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Real-Time Monitor Controls
app.post('/api/monitor/start', (req, res) => {
  const { adapterId, intervalSec } = req.body;
  sentinelMonitor.start(adapterId || sentinelMonitor.activeAdapterId, intervalSec);
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
  const adapter = adapterEngine.getAdapter(adapterId);
  if (!adapter) {
    return res.status(404).json({ success: false, error: `Target "${adapterId}" not found` });
  }
  sentinelMonitor.setActiveAdapter(adapterId);
  // Trigger immediate tick for the newly selected target
  sentinelMonitor.tick();
  res.json({ success: true, activeAdapterId: adapterId, adapter });
});

app.post('/api/target/threshold', (req, res) => {
  const { adapterId, threshold } = req.body;
  const adapter = adapterEngine.getAdapter(adapterId || sentinelMonitor.activeAdapterId);
  if (!adapter) {
    return res.status(404).json({ success: false, error: 'Adapter not found' });
  }
  adapter.threshold = parseFloat(threshold);
  sentinelMonitor.tick();
  res.json({ success: true, adapterId: adapter.id, threshold: adapter.threshold });
});

// 3. Real Target Management (Add any URL on the Web)
app.get('/api/adapters', (req, res) => {
  res.json({ success: true, adapters: adapterEngine.getAllAdapters() });
});

app.post('/api/adapters/register', async (req, res) => {
  try {
    const { id, name, url, threshold, selectors } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    const adapterId = id || 'live-' + Date.now().toString(36);
    const adapterName = name || url.replace(/^https?:\/\//, '').split('/')[0];

    const registered = adapterEngine.registerAdapter({
      id: adapterId,
      name: adapterName,
      url,
      threshold: parseFloat(threshold || 50.0),
      selectors: selectors || {}
    });

    // Test the new target live
    const testResult = await adapterEngine.execute(registered);

    // Switch to this new live target
    sentinelMonitor.setActiveAdapter(registered.id);
    sentinelMonitor.tick();

    broadcast({ 
      type: 'ADAPTER_REGISTERED', 
      adapter: registered, 
      adapters: adapterEngine.getAllAdapters() 
    });

    res.json({ success: true, adapter: registered, testResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/adapters/delete', (req, res) => {
  try {
    const { adapterId } = req.body;
    if (!adapterId) return res.status(400).json({ success: false, error: 'adapterId is required' });

    const deleted = adapterEngine.deleteAdapter(adapterId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Target not found' });

    // If the deleted adapter was active, fallback to first available
    if (sentinelMonitor.activeAdapterId === adapterId) {
      const remaining = adapterEngine.getAllAdapters();
      if (remaining.length > 0) {
        sentinelMonitor.setActiveAdapter(remaining[0].id);
        sentinelMonitor.tick();
      }
    }

    broadcast({
      type: 'ADAPTER_DELETED',
      adapterId,
      adapters: adapterEngine.getAllAdapters(),
      activeAdapterId: sentinelMonitor.activeAdapterId
    });

    res.json({ 
      success: true, 
      adapters: adapterEngine.getAllAdapters(), 
      activeAdapterId: sentinelMonitor.activeAdapterId 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// 4. Human Approval Gate API
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

// 5. AI Agent Co-Pilot API
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

// 6. Real Webhook Alert Notification Dispatcher
app.post('/api/webhook/send', async (req, res) => {
  try {
    const { webhookUrl, message, details } = req.body;
    const targetUrl = webhookUrl || CONFIG.SLACK_WEBHOOK_URL || CONFIG.DISCORD_WEBHOOK_URL;
    
    if (!targetUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'No Webhook URL configured. Please provide a Slack or Discord webhook URL.' 
      });
    }

    const payload = {
      text: message || '⚡ Cost Collapser Real-Time Alert',
      content: message || '⚡ Cost Collapser Real-Time Alert',
      embeds: details ? [{
        title: 'Cost Collapser Price Trigger',
        description: details.summary || 'Price threshold reached on target website.',
        fields: [
          { name: 'Item', value: details.item || 'N/A', inline: true },
          { name: 'Price', value: details.price ? `$${details.price}` : 'N/A', inline: true },
          { name: 'Tokens Burned', value: '0 Tokens', inline: true }
        ],
        color: 3066993
      }] : undefined
    };

    const webhookRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    res.json({ success: true, status: webhookRes.status, statusText: webhookRes.statusText });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Gmail Alert Notifications API
app.get('/api/email/config', (req, res) => {
  res.json({ success: true, config: emailService.getConfig() });
});

app.post('/api/email/config', (req, res) => {
  try {
    const config = emailService.updateConfig(req.body);
    broadcast({ type: 'EMAIL_CONFIG_UPDATED', config });
    res.json({ success: true, config });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/email/test', async (req, res) => {
  try {
    const { recipient } = req.body;
    const result = await emailService.sendTestEmail(recipient);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


// Start Server (Standalone / Local Mode)
const PORT = CONFIG.PORT;
if (!process.env.VERCEL && !process.env.NOW_REGION && process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`⚡ COST COLLAPSER ACTIVE`);
    console.log(`📡 Dashboard: http://localhost:${PORT}`);
    console.log(`🌍 Default Live Target: ${CONFIG.DEFAULT_ADAPTER}`);
    console.log(`======================================================\n`);

    // Start continuous 0-token monitoring of real public web target
    sentinelMonitor.start(CONFIG.DEFAULT_ADAPTER, CONFIG.POLL_INTERVAL_SEC);
  });
}
