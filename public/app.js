/**
 * Zero-Token Sentinel Command Center Client
 * Handles real-time WebSockets, telemetry streaming, human approval gates,
 * adapter compilation, and live demo simulations.
 */

// State
let ws = null;
let state = {
  status: { isRunning: true, pollIntervalSec: 5, activeAdapterId: 'apex-industrial' },
  metrics: null,
  pendingGates: [],
  auditLog: [],
  adapters: [],
  products: []
};

// Elements
const kpiTraditionalTokens = document.getElementById('kpiTraditionalTokens');
const kpiTraditionalCost = document.getElementById('kpiTraditionalCost');
const kpiDollarsSaved = document.getElementById('kpiDollarsSaved');
const kpiEfficiency = document.getElementById('kpiEfficiency');
const kpiChecksCount = document.getElementById('kpiChecksCount');
const kpiAvgLatency = document.getElementById('kpiAvgLatency');

const activeTargetName = document.getElementById('activeTargetName');
const targetCurrentPrice = document.getElementById('targetCurrentPrice');
const targetThresholdPrice = document.getElementById('targetThresholdPrice');
const targetStockStatus = document.getElementById('targetStockStatus');
const gaugeCurrent = document.getElementById('gaugeCurrent');

const terminalLogs = document.getElementById('terminalLogs');
const selectInterval = document.getElementById('selectInterval');
const btnToggleMonitor = document.getElementById('btnToggleMonitor');

const wakeUpAlertContainer = document.getElementById('wakeUpAlertContainer');
const alertSummaryText = document.getElementById('alertSummaryText');
const alertTimestamp = document.getElementById('alertTimestamp');
const pendingGateList = document.getElementById('pendingGateList');
const pendingGateBadge = document.getElementById('pendingGateBadge');
const auditTableBody = document.getElementById('auditTableBody');

const projTraditional = document.getElementById('projTraditional');
const projSentinel = document.getElementById('projSentinel');

// Store Simulator Controls
const simCurrentPriceDisplay = document.getElementById('simCurrentPriceDisplay');
const priceSlider = document.getElementById('priceSlider');
const selectTargetPreset = document.getElementById('selectTargetPreset');

// Adapter Compiler Elements
const compileAdapterSelect = document.getElementById('compileAdapterSelect');
const btnCompileAdapter = document.getElementById('btnCompileAdapter');
const btnTestAdapter = document.getElementById('btnTestAdapter');
const compiledCodeOutput = document.getElementById('compiledCodeOutput');
const btnCopyCompiled = document.getElementById('btnCopyCompiled');

// Quick Action Buttons
const btnTriggerDrop = document.getElementById('btnTriggerDrop');
const btnResetDemo = document.getElementById('btnResetDemo');
const btnManualCheck = document.getElementById('btnManualCheck');
const btnClearLogs = document.getElementById('btnClearLogs');

// Audio Notification Synthesizer (Zero external dependencies)
function playAlarmChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.log('Audio chime not available or user interaction required');
  }
}

// Initialize WebSocket Connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    appendTerminalLog('SYSTEM', 'WebSocket connection established with Sentinel Hub', '#00f0ff');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWsMessage(data);
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  };

  ws.onclose = () => {
    appendTerminalLog('WARN', 'WebSocket disconnected. Retrying in 2s...', '#ffb703');
    setTimeout(initWebSocket, 2000);
  };
}

function handleWsMessage(data) {
  switch (data.type) {
    case 'INIT_STATE':
      state.status = data.status;
      state.pendingGates = data.pendingGates || [];
      state.auditLog = data.auditLog || [];
      state.adapters = data.adapters || [];
      updateMetricsUI(data.status.metrics);
      renderPendingGates();
      renderAuditLog();
      break;

    case 'SENTINEL_CHECK':
      handleSentinelCheck(data.entry, data.metrics);
      break;

    case 'AGENTIC_WAKE_UP':
      handleAgenticWakeUp(data.data, data.metrics);
      break;

    case 'GATE_CREATED':
      state.pendingGates.unshift(data.gate);
      renderPendingGates();
      break;

    case 'GATE_RESOLVED':
      state.pendingGates = state.pendingGates.filter(g => g.gateId !== data.gate.gateId);
      if (data.auditLog) state.auditLog = data.auditLog;
      renderPendingGates();
      renderAuditLog();
      break;

    case 'MONITOR_STATUS':
      state.status = data.status;
      btnToggleMonitor.textContent = data.status.isRunning ? '⏸️' : '▶️';
      break;
  }
}

function handleSentinelCheck(entry, metrics) {
  updateMetricsUI(metrics);

  // Update Target Live Display
  targetCurrentPrice.textContent = `$${entry.price.toFixed(2)}`;
  simCurrentPriceDisplay.textContent = `$${entry.price.toFixed(2)}`;
  priceSlider.value = entry.price;

  if (entry.threshold) {
    targetThresholdPrice.textContent = `≤ $${entry.threshold.toFixed(2)}`;
  }

  targetStockStatus.textContent = entry.inStock ? '● In Stock' : '✕ Out of Stock';
  targetStockStatus.className = `stat-val ${entry.inStock ? 'text-neon-green' : 'text-danger'}`;

  // Gauge percentage (0 to $250)
  const maxScale = 250;
  const pct = Math.min(100, Math.max(2, (entry.price / maxScale) * 100));
  gaugeCurrent.style.left = `${pct}%`;

  // Terminal log line
  const time = new Date().toLocaleTimeString();
  const triggerStatus = entry.triggered ? '<span class="log-trigger">🚨 TRIGGER BREACHED</span>' : '';
  const lineHtml = `
    <div class="log-line">
      <span class="log-time">[${time}]</span>
      <span class="log-tag">[0-TOKEN-RUNNER]</span>
      <span>${entry.adapterId}</span>
      <span class="log-price">$${entry.price.toFixed(2)}</span>
      <span class="log-tokens">(0 tokens / ${entry.latencyMs}ms)</span>
      ${triggerStatus}
    </div>
  `;
  appendTerminalHtml(lineHtml);
}

function handleAgenticWakeUp(alertData, metrics) {
  playAlarmChime();
  updateMetricsUI(metrics);

  wakeUpAlertContainer.style.display = 'block';
  alertTimestamp.textContent = new Date().toLocaleTimeString();
  alertSummaryText.textContent = alertData.analysis?.executiveSummary || 'Target price threshold breached! AI Agent has awakened.';

  // Highlight terminal
  const lineHtml = `
    <div class="log-line" style="background: rgba(255, 51, 102, 0.2); padding: 4px; border-radius: 4px;">
      <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
      <span class="log-trigger">🚨 AGENTIC WAKE-UP</span>
      <span style="color:#fff; font-weight:700;">Awakened AI Agent: ${alertData.analysis?.recommendation}</span>
      <span class="log-tokens">(${alertData.tokensBurned} tokens burned for briefing)</span>
    </div>
  `;
  appendTerminalHtml(lineHtml);
}

function updateMetricsUI(metrics) {
  if (!metrics) return;
  state.metrics = metrics;

  kpiTraditionalTokens.innerHTML = `${metrics.traditional.tokensBurned.toLocaleString()} <span class="kpi-unit">TOK</span>`;
  kpiTraditionalCost.textContent = `Estimated Burn: $${metrics.traditional.costUSD.toFixed(4)}`;

  kpiDollarsSaved.textContent = `$${metrics.savings.dollarsSaved.toFixed(4)}`;
  kpiEfficiency.textContent = `${metrics.savings.efficiencyPercent}% Cost Efficiency (0 Polling Tokens)`;

  kpiChecksCount.innerHTML = `${metrics.totalChecks} <span class="kpi-unit">CHECKS</span>`;

  if (metrics.projections) {
    projTraditional.textContent = `$${metrics.projections.traditionalDailyUSD.toFixed(2)} / day ($${(metrics.projections.traditionalDailyUSD * 30).toFixed(2)} / mo)`;
    projSentinel.textContent = `$${metrics.projections.sentinelDailyUSD.toFixed(4)} / day ($${(metrics.projections.sentinelDailyUSD * 30).toFixed(4)} / mo)`;
  }
}

function renderPendingGates() {
  pendingGateBadge.textContent = state.pendingGates.length;

  if (state.pendingGates.length === 0) {
    pendingGateList.innerHTML = `
      <div class="empty-gate-state" id="emptyGateState">
        <div class="empty-icon">🛡️</div>
        <div class="empty-title">Zero-Token Sentinel Standing Guard</div>
        <div class="empty-desc">
          Monitoring target site deterministically with <strong>0 LLM reasoning tokens</strong>.<br>
          When a price drops below threshold, the AI agent will awaken and request human approval here.
        </div>
        <button class="btn btn-danger btn-pulse" style="margin-top: 16px;" onclick="triggerFlashDrop()">
          ⚡ Click to Simulate Instant Price Drop Deal
        </button>
      </div>
    `;
    return;
  }

  pendingGateList.innerHTML = state.pendingGates.map(gate => {
    const trigger = gate.data.trigger;
    const analysis = gate.data.analysis;
    const fin = analysis.financialImpact || {};

    return `
      <div class="gate-card urgent">
        <div class="gate-top-row">
          <div class="gate-id-badge">GATE ID: ${gate.gateId}</div>
          <div class="ai-awakened-badge">🧠 AI AGENT AWAKENED (${gate.data.tokensBurned} TOKENS)</div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <div>
            <h3 style="font-size: 16px; font-weight:700;">${trigger.item}</h3>
            <div style="font-size: 12px; color: var(--text-muted);">Vendor: ${trigger.vendor} | SKU: ${trigger.sku}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size: 24px; font-weight:800; color:var(--neon-green); font-family:var(--font-mono);">
              $${trigger.currentPrice.toFixed(2)}
            </div>
            <div style="font-size: 11px; color:var(--amber);">Threshold: $${trigger.threshold.toFixed(2)}</div>
          </div>
        </div>

        <div class="ai-briefing-box">
          <div class="briefing-header">
            <span>⚡ AI EXECUTIVE PROCUREMENT RECOMMENDATION:</span>
            <span class="badge-tag ${analysis.recommendation === 'STRONG_BUY' ? 'live-badge' : 'cost-badge'}">${analysis.recommendation}</span>
          </div>
          <div class="briefing-text">
            ${analysis.executiveSummary}
          </div>
          <div class="briefing-stats-grid">
            <div class="stat-pill">
              <span class="b-stat-name">Unit Savings</span>
              <span class="b-stat-val text-neon-green">${fin.unitSavings || '$90.00'}</span>
            </div>
            <div class="stat-pill">
              <span class="b-stat-name">Batch 25 Lot Savings</span>
              <span class="b-stat-val text-neon-cyan">${fin.batch25LotSavings || '$2,250.00'}</span>
            </div>
            <div class="stat-pill">
              <span class="b-stat-name">Annual OPEX Impact</span>
              <span class="b-stat-val text-amber">${fin.estimatedAnnualOPEXReduction || '$27,000.00'}</span>
            </div>
          </div>
        </div>

        <div class="gate-action-bar">
          <button class="btn btn-reject" onclick="rejectGate('${gate.gateId}')">
            ✕ Reject Action
          </button>
          <button class="btn btn-approve" onclick="approveGate('${gate.gateId}')">
            ✓ Authorize Purchase Order (${analysis.suggestedOrderQty || 25} Units)
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderAuditLog() {
  if (state.auditLog.length === 0) {
    auditTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding: 24px;">No human approval records yet. Simulate a price drop to generate gate history.</td>
      </tr>
    `;
    return;
  }

  auditTableBody.innerHTML = state.auditLog.map(gate => {
    const isApproved = gate.status === 'APPROVED';
    const decisionClass = isApproved ? 'decision-approved' : 'decision-rejected';
    const poNumber = gate.executionResult?.poNumber || 'N/A';

    return `
      <tr>
        <td><code>${gate.gateId}</code></td>
        <td>${new Date(gate.decidedAt || gate.createdAt).toLocaleTimeString()}</td>
        <td>${gate.data?.trigger?.item || 'Item'}</td>
        <td class="font-mono">$${(gate.data?.trigger?.currentPrice || 0).toFixed(2)}</td>
        <td class="${decisionClass}">${gate.status}</td>
        <td>${gate.decidedBy || 'Operator'}</td>
        <td>${isApproved ? `<span class="po-badge">${poNumber}</span>` : '<span class="text-muted">Dismissed</span>'}</td>
      </tr>
    `;
  }).join('');
}

// Gate Approval Handlers
async function approveGate(gateId) {
  try {
    const res = await fetch('/api/gate/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateId, operator: 'Human Operator (Judge / Demo)' })
    });
    const data = await res.json();
    if (data.success) {
      appendTerminalLog('HUMAN-GATE', `Approved Gate ${gateId} -> PO ${data.result.executionResult.poNumber} issued!`, '#00ff88');
      wakeUpAlertContainer.style.display = 'none';
    }
  } catch (err) {
    alert('Error approving gate: ' + err.message);
  }
}

async function rejectGate(gateId) {
  try {
    const res = await fetch('/api/gate/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateId, operator: 'Human Operator (Judge / Demo)' })
    });
    const data = await res.json();
    if (data.success) {
      appendTerminalLog('HUMAN-GATE', `Rejected Gate ${gateId}. Resumed idle zero-token monitoring.`, '#ff3366');
      wakeUpAlertContainer.style.display = 'none';
    }
  } catch (err) {
    alert('Error rejecting gate: ' + err.message);
  }
}

// Live Demo Flash Drop
async function triggerFlashDrop() {
  try {
    const res = await fetch('/api/demo/trigger-drop', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      appendTerminalLog('DEMO-TRIGGER', 'Simulated Flash Price Drop ($39.99)! Triggering Agentic Wake-Up...', '#ff3366');
    }
  } catch (err) {
    alert('Failed to trigger demo drop: ' + err.message);
  }
}

// Live Demo Reset
async function resetDemo() {
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      appendTerminalLog('SYSTEM', 'Baseline reset to standard $129.99 and metrics cleared', '#00f0ff');
      wakeUpAlertContainer.style.display = 'none';
      state.pendingGates = [];
      renderPendingGates();
    }
  } catch (err) {
    alert('Failed to reset demo: ' + err.message);
  }
}

// Mock Store Price Slider
async function setSimPrice(newPrice) {
  try {
    const activeAdapter = state.status.activeAdapterId;
    let productId = 'titan-carbide-drill-5000';
    if (activeAdapter === 'grainger-catalog') productId = 'hydraulic-control-valve-hv90';
    if (activeAdapter === 'precision-bearings') productId = 'ceramic-spindle-bearing-cb70';

    await fetch(`/api/products/${productId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: parseFloat(newPrice) })
    });
  } catch (err) {
    console.error('Failed to set sim price:', err);
  }
}

// Terminal Utilities
function appendTerminalLog(tag, msg, color = '#f0f6fc') {
  const time = new Date().toLocaleTimeString();
  const html = `
    <div class="log-line">
      <span class="log-time">[${time}]</span>
      <span class="log-tag" style="color: ${color}">[${tag}]</span>
      <span>${msg}</span>
    </div>
  `;
  appendTerminalHtml(html);
}

function appendTerminalHtml(html) {
  terminalLogs.insertAdjacentHTML('beforeend', html);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
  // Keep terminal buffer clean
  while (terminalLogs.children.length > 200) {
    terminalLogs.removeChild(terminalLogs.firstChild);
  }
}

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// Event Listeners
btnTriggerDrop.addEventListener('click', triggerFlashDrop);
btnResetDemo.addEventListener('click', resetDemo);

btnManualCheck.addEventListener('click', async () => {
  appendTerminalLog('MANUAL', 'Executing manual on-demand zero-token check...', '#00f0ff');
  const res = await fetch('/api/adapters/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adapterId: state.status.activeAdapterId })
  });
  const data = await res.json();
  appendTerminalLog('RESULT', `Fetched ${data.item}: $${data.price} (${data.latencyMs}ms, 0 tokens)`, '#00ff88');
});

btnClearLogs.addEventListener('click', () => {
  terminalLogs.innerHTML = '';
});

selectInterval.addEventListener('change', async () => {
  const intervalSec = parseInt(selectInterval.value, 10);
  await fetch('/api/monitor/interval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intervalSec })
  });
  appendTerminalLog('CONFIG', `Polling interval updated to ${intervalSec} seconds`, '#ffb703');
});

btnToggleMonitor.addEventListener('click', async () => {
  const isRunning = state.status.isRunning;
  const endpoint = isRunning ? '/api/monitor/stop' : '/api/monitor/start';
  await fetch(endpoint, { method: 'POST' });
});

selectTargetPreset.addEventListener('change', async () => {
  const adapterId = selectTargetPreset.value;
  await fetch('/api/monitor/select-adapter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adapterId })
  });
  activeTargetName.textContent = selectTargetPreset.options[selectTargetPreset.selectedIndex].text;
  appendTerminalLog('ADAPTER', `Switched active adapter to: ${adapterId}`, '#00f0ff');
});

priceSlider.addEventListener('input', (e) => {
  simCurrentPriceDisplay.textContent = `$${parseFloat(e.target.value).toFixed(2)}`;
});

priceSlider.addEventListener('change', (e) => {
  setSimPrice(e.target.value);
});

// Adapter Compiler Studio
btnCompileAdapter.addEventListener('click', async () => {
  const adapterId = compileAdapterSelect.value;
  const res = await fetch('/api/adapters/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adapterId })
  });
  const data = await res.json();
  if (data.success) {
    compiledCodeOutput.textContent = data.script;
    appendTerminalLog('COMPILER', `Compiled ${adapterId} to Layer 2 Zero-Token CLI script`, '#9d4edd');
  }
});

btnTestAdapter.addEventListener('click', async () => {
  const adapterId = compileAdapterSelect.value;
  const res = await fetch('/api/adapters/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adapterId })
  });
  const data = await res.json();
  compiledCodeOutput.textContent = JSON.stringify(data, null, 2);
  appendTerminalLog('TEST', `Tested ${adapterId}: $${data.price} (${data.latencyMs}ms, 0 tokens)`, '#00ff88');
});

btnCopyCompiled.addEventListener('click', () => {
  navigator.clipboard.writeText(compiledCodeOutput.textContent).then(() => {
    btnCopyCompiled.textContent = 'Copied!';
    setTimeout(() => { btnCopyCompiled.textContent = 'Copy Code'; }, 1500);
  });
});

// Global exports for inline HTML handlers
window.triggerFlashDrop = triggerFlashDrop;
window.setSimPrice = setSimPrice;
window.approveGate = approveGate;
window.rejectGate = rejectGate;

// Boot
initWebSocket();
