/**
 * Cost Collapser - Client Application
 * Zero-token autonomous monitoring, real-time WebSocket telemetry, and human approval gate.
 */

let ws = null;
let state = {
  status: { isRunning: true, pollIntervalSec: 5, activeAdapterId: 'apex-industrial' },
  metrics: null,
  pendingGates: [],
  auditLog: [],
  adapters: []
};

// UI Elements
const kpiDollarsSaved = document.getElementById('kpiDollarsSaved');
const kpiEfficiency = document.getElementById('kpiEfficiency');
const kpiChecksCount = document.getElementById('kpiChecksCount');
const kpiTraditionalTokens = document.getElementById('kpiTraditionalTokens');

const targetTitle = document.getElementById('targetTitle');
const targetCurrentPrice = document.getElementById('targetCurrentPrice');
const targetStockStatus = document.getElementById('targetStockStatus');
const sliderPriceDisplay = document.getElementById('sliderPriceDisplay');
const priceSlider = document.getElementById('priceSlider');

const btnTriggerDrop = document.getElementById('btnTriggerDrop');
const btnResetBaseline = document.getElementById('btnResetBaseline');
const btnClearLogs = document.getElementById('btnClearLogs');

const wakeUpAlertContainer = document.getElementById('wakeUpAlertContainer');
const alertSummaryText = document.getElementById('alertSummaryText');
const pendingGateList = document.getElementById('pendingGateList');
const pendingGateBadge = document.getElementById('pendingGateBadge');
const auditTableBody = document.getElementById('auditTableBody');
const terminalLogs = document.getElementById('terminalLogs');

const agentMessagesContainer = document.getElementById('agentMessagesContainer');
const agentInputForm = document.getElementById('agentInputForm');
const agentPromptInput = document.getElementById('agentPromptInput');

// Play subtle alert tone on price drop
function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

// WebSocket Connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    appendLog('SYSTEM', 'Connected to Cost Collapser Sentinel Engine');
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
    setTimeout(initWebSocket, 2000);
  };
}

function handleWsMessage(data) {
  switch (data.type) {
    case 'INIT_STATE':
      state.status = data.status;
      state.pendingGates = data.pendingGates || [];
      state.auditLog = data.auditLog || [];
      updateMetricsUI(data.status.metrics);
      renderPendingGates();
      renderAuditLog();
      break;

    case 'SENTINEL_CHECK':
      handleSentinelCheck(data.entry, data.metrics);
      break;

    case 'AGENTIC_WAKE_UP':
      handleWakeUpAlert(data.data, data.metrics);
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
  }
}

function handleSentinelCheck(entry, metrics) {
  updateMetricsUI(metrics);

  targetCurrentPrice.textContent = `$${entry.price.toFixed(2)}`;
  sliderPriceDisplay.textContent = `$${entry.price.toFixed(2)}`;
  priceSlider.value = entry.price;

  targetStockStatus.textContent = entry.inStock ? 'In Stock' : 'Out of Stock';
  targetStockStatus.className = `price-box-val ${entry.inStock ? 'text-green' : 'text-danger'}`;

  const time = new Date().toLocaleTimeString();
  const alertTag = entry.triggered ? '<span class="log-alert">[PRICE ALERT &le; $50]</span>' : '';
  const logHtml = `
    <div class="log-line">
      <span class="log-time">[${time}]</span>
      <span>${entry.adapterId}</span>
      <span style="color:#fff; font-weight:600;">$${entry.price.toFixed(2)}</span>
      <span class="log-green">(0 tokens &bull; ${entry.latencyMs}ms)</span>
      ${alertTag}
    </div>
  `;
  appendLogHtml(logHtml);
}

function handleWakeUpAlert(alertData, metrics) {
  playAlertChime();
  updateMetricsUI(metrics);

  wakeUpAlertContainer.style.display = 'block';
  alertSummaryText.textContent = alertData.analysis?.executiveSummary || 'Target price threshold breached! AI Agent prepared purchase briefing.';

  const logHtml = `
    <div class="log-line" style="background: rgba(245, 158, 11, 0.15); padding: 4px; border-radius: 4px;">
      <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
      <span class="log-alert">🚨 AI AWAKENED:</span>
      <span>Recommendation: ${alertData.analysis?.recommendation} (Tokens: ${alertData.tokensBurned})</span>
    </div>
  `;
  appendLogHtml(logHtml);
}

function updateMetricsUI(metrics) {
  if (!metrics) return;
  state.metrics = metrics;

  kpiDollarsSaved.textContent = `$${metrics.savings.dollarsSaved.toFixed(2)}`;
  kpiEfficiency.textContent = `${metrics.savings.efficiencyPercent}% Token Cost Reduction`;
  kpiChecksCount.innerHTML = `${metrics.totalChecks} <span class="metric-unit">CHECKS</span>`;
  kpiTraditionalTokens.textContent = `Traditional LLM burn: ${metrics.traditional.tokensBurned.toLocaleString()} tokens`;
}

function renderPendingGates() {
  pendingGateBadge.textContent = `${state.pendingGates.length} PENDING`;

  if (state.pendingGates.length === 0) {
    pendingGateList.innerHTML = `
      <div class="empty-state" id="emptyGateState">
        <div class="empty-icon">🛡️</div>
        <div class="empty-title">Cost Collapser Standing By</div>
        <div class="empty-subtitle">
          Monitoring target site with <strong>0 tokens</strong>.<br>
          When a price drops below $50.00, the AI agent will analyze the deal and request human approval here.
        </div>
        <button class="btn btn-primary" style="margin-top: 16px;" onclick="triggerFlashDrop()">
          📉 Test Price Drop Alert ($39.99)
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
      <div class="gate-item-card">
        <div class="gate-head">
          <span class="gate-id">GATE ID: ${gate.gateId}</span>
          <span class="gate-rec">${analysis.recommendation}</span>
        </div>

        <div class="gate-price-row">
          <div>
            <div class="gate-item-title">${trigger.item}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Vendor: ${trigger.vendor}</div>
          </div>
          <div class="gate-item-price">$${trigger.currentPrice.toFixed(2)}</div>
        </div>

        <div class="gate-summary-box">
          ${analysis.executiveSummary}
          <div style="margin-top: 6px; font-weight: 600; color: var(--green);">
            Estimated Batch 25 Savings: ${fin.batch25LotSavings || '$2,250.00'}
          </div>
        </div>

        <div class="gate-actions">
          <button class="btn btn-sm btn-outline" onclick="rejectGate('${gate.gateId}')">
            ✕ Reject
          </button>
          <button class="btn btn-sm btn-primary" onclick="approveGate('${gate.gateId}')">
            ✓ Approve Purchase Order (${analysis.suggestedOrderQty || 25} Units)
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
        <td colspan="7" class="text-center text-muted">No purchase orders executed yet.</td>
      </tr>
    `;
    return;
  }

  auditTableBody.innerHTML = state.auditLog.map(gate => {
    const isApproved = gate.status === 'APPROVED';
    const poNumber = gate.executionResult?.poNumber || 'N/A';

    return `
      <tr>
        <td><code>${gate.gateId}</code></td>
        <td>${new Date(gate.decidedAt || gate.createdAt).toLocaleTimeString()}</td>
        <td>${gate.data?.trigger?.item || 'Item'}</td>
        <td style="font-family: var(--font-mono); font-weight:700;">$${(gate.data?.trigger?.currentPrice || 0).toFixed(2)}</td>
        <td style="font-weight:700; color: ${isApproved ? 'var(--green)' : 'var(--red)'};">${gate.status}</td>
        <td>${gate.decidedBy || 'Operator'}</td>
        <td>${isApproved ? `<code style="color:var(--cyan);">${poNumber}</code>` : '<span class="text-muted">Dismissed</span>'}</td>
      </tr>
    `;
  }).join('');
}

// Gate Handlers
async function approveGate(gateId) {
  try {
    const res = await fetch('/api/gate/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateId, operator: 'Chief Procurement Officer' })
    });
    const data = await res.json();
    if (data.success) {
      appendLog('APPROVAL', `Approved Gate ${gateId} -> PO ${data.result.executionResult.poNumber} issued!`);
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
      body: JSON.stringify({ gateId, operator: 'Chief Procurement Officer' })
    });
    const data = await res.json();
    if (data.success) {
      appendLog('GATE', `Dismissed Gate ${gateId}. Resumed 0-token monitoring.`);
      wakeUpAlertContainer.style.display = 'none';
    }
  } catch (err) {
    alert('Error rejecting gate: ' + err.message);
  }
}

// Trigger Price Drop
async function triggerFlashDrop() {
  try {
    const res = await fetch('/api/demo/trigger-drop', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      appendLog('PRICE-DROP', 'Target site price dropped to $39.99! Triggering AI analysis...');
    }
  } catch (err) {
    alert('Failed to drop price: ' + err.message);
  }
}

// Reset Baseline
async function resetBaseline() {
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      appendLog('SYSTEM', 'Reset price to $129.99 baseline.');
      wakeUpAlertContainer.style.display = 'none';
      state.pendingGates = [];
      renderPendingGates();
    }
  } catch (err) {
    alert('Failed to reset: ' + err.message);
  }
}

// Slider Price Update
async function setSimPrice(newPrice) {
  try {
    await fetch('/api/products/titan-carbide-drill-5000/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: parseFloat(newPrice) })
    });
  } catch (err) {
    console.error('Failed to set price:', err);
  }
}

// AI Agent Chat
async function sendAgentPrompt(promptText) {
  if (!promptText) return;

  const userHtml = `
    <div class="chat-bubble user-bubble">
      ${escapeHtml(promptText)}
    </div>
  `;
  agentMessagesContainer.insertAdjacentHTML('beforeend', userHtml);
  agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;

  const typingId = 'typing-' + Date.now();
  const typingHtml = `
    <div class="chat-bubble ai-bubble" id="${typingId}">
      <div class="bubble-sender">🤖 Cost Collapser AI</div>
      <div style="color: var(--cyan);">Analyzing request & executing tools...</div>
    </div>
  `;
  agentMessagesContainer.insertAdjacentHTML('beforeend', typingHtml);
  agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;

  try {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });
    const data = await res.json();
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    if (data.success) {
      const resp = data.response;
      const aiMsgHtml = `
        <div class="chat-bubble ai-bubble">
          <div class="bubble-sender">🤖 Cost Collapser AI</div>
          <div>${resp.responseMessage.replace(/\n/g, '<br>')}</div>
        </div>
      `;
      agentMessagesContainer.insertAdjacentHTML('beforeend', aiMsgHtml);
      agentMessagesContainer.scrollTop = agentMessagesContainer.scrollHeight;
    }
  } catch (err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    alert('Agent error: ' + err.message);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function appendLog(tag, msg) {
  const time = new Date().toLocaleTimeString();
  const html = `
    <div class="log-line">
      <span class="log-time">[${time}]</span>
      <span style="color:var(--cyan);">[${tag}]</span>
      <span>${msg}</span>
    </div>
  `;
  appendLogHtml(html);
}

function appendLogHtml(html) {
  terminalLogs.insertAdjacentHTML('beforeend', html);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
  while (terminalLogs.children.length > 100) {
    terminalLogs.removeChild(terminalLogs.firstChild);
  }
}

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
  });
});

// Event Listeners
btnTriggerDrop.addEventListener('click', triggerFlashDrop);
btnResetBaseline.addEventListener('click', resetBaseline);

btnClearLogs.addEventListener('click', () => {
  terminalLogs.innerHTML = '';
});

priceSlider.addEventListener('input', (e) => {
  sliderPriceDisplay.textContent = `$${parseFloat(e.target.value).toFixed(2)}`;
});

priceSlider.addEventListener('change', (e) => {
  setSimPrice(e.target.value);
});

if (agentInputForm) {
  agentInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = agentPromptInput.value.trim();
    if (prompt) {
      sendAgentPrompt(prompt);
      agentPromptInput.value = '';
    }
  });
}

// Expose globals for inline HTML onclick handlers
window.triggerFlashDrop = triggerFlashDrop;
window.setSimPrice = setSimPrice;
window.approveGate = approveGate;
window.rejectGate = rejectGate;
window.sendAgentPrompt = sendAgentPrompt;

// Initialize
initWebSocket();
