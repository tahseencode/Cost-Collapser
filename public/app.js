/**
 * Cost Collapser - Real Live Web Intelligence & Automated Procurement
 */

let ws = null;
let state = {
  status: { isRunning: true, pollIntervalSec: 5, activeAdapterId: 'live-hm-onesie' },
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

const targetSelector = document.getElementById('targetSelector');
const btnDeleteCurrentTarget = document.getElementById('btnDeleteCurrentTarget');
const targetTitle = document.getElementById('targetTitle');
const targetVendor = document.getElementById('targetVendor');
const targetExternalLink = document.getElementById('targetExternalLink');
const targetCurrentPrice = document.getElementById('targetCurrentPrice');
const targetThresholdDisplay = document.getElementById('targetThresholdDisplay');
const targetStockStatus = document.getElementById('targetStockStatus');
const targetLatency = document.getElementById('targetLatency');

const thresholdInput = document.getElementById('thresholdInput');
const thresholdValueBadge = document.getElementById('thresholdValueBadge');
const btnUpdateThreshold = document.getElementById('btnUpdateThreshold');
const btnSetThresholdTrigger = document.getElementById('btnSetThresholdTrigger');
const btnResetThreshold = document.getElementById('btnResetThreshold');

const webhookUrlInput = document.getElementById('webhookUrlInput');
const btnSendTestWebhook = document.getElementById('btnSendTestWebhook');

const wakeUpAlertContainer = document.getElementById('wakeUpAlertContainer');
const alertSummaryText = document.getElementById('alertSummaryText');
const pendingGateList = document.getElementById('pendingGateList');
const pendingGateBadge = document.getElementById('pendingGateBadge');
const auditTableBody = document.getElementById('auditTableBody');
const terminalLogs = document.getElementById('terminalLogs');
const btnClearLogs = document.getElementById('btnClearLogs');

const agentMessagesContainer = document.getElementById('agentMessagesContainer');
const agentInputForm = document.getElementById('agentInputForm');
const agentPromptInput = document.getElementById('agentPromptInput');

// Add Custom Target Modal
const addModal = document.getElementById('addModal');
const btnOpenAddModal = document.getElementById('btnOpenAddModal');
const btnCloseAddModal = document.getElementById('btnCloseAddModal');
const btnCancelAddModal = document.getElementById('btnCancelAddModal');
const btnSubmitAddTarget = document.getElementById('btnSubmitAddTarget');
const newTargetUrl = document.getElementById('newTargetUrl');
const newTargetName = document.getElementById('newTargetName');
const newTargetThreshold = document.getElementById('newTargetThreshold');

// Manage Watchlist Modal
const manageModal = document.getElementById('manageModal');
const btnOpenManageModal = document.getElementById('btnOpenManageModal');
const btnCloseManageModal = document.getElementById('btnCloseManageModal');
const btnDoneManageModal = document.getElementById('btnDoneManageModal');
const watchlistItemsList = document.getElementById('watchlistItemsList');

// Play alert chime
function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1);
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
    appendLog('SYSTEM', 'Connected to Cost Collapser Real-Time Engine');
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
      state.adapters = data.adapters || [];
      updateAdaptersDropdown(state.adapters, data.status.activeAdapterId);
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

    case 'ADAPTER_REGISTERED':
      state.adapters = data.adapters;
      updateAdaptersDropdown(state.adapters, data.adapter.id);
      break;

    case 'ADAPTER_DELETED':
      state.adapters = data.adapters;
      updateAdaptersDropdown(state.adapters, data.activeAdapterId);
      renderWatchlistItems();
      break;
  }
}

function updateAdaptersDropdown(adapters, activeId) {
  if (!adapters || adapters.length === 0) {
    targetSelector.innerHTML = '<option value="">(No targets watched - add one!)</option>';
    return;
  }
  targetSelector.innerHTML = adapters.map(a => `
    <option value="${a.id}" ${a.id === activeId ? 'selected' : ''}>
      ${a.name}
    </option>
  `).join('');
}

function handleSentinelCheck(entry, metrics) {
  updateMetricsUI(metrics);

  const curr = entry.currency || '$';
  targetCurrentPrice.textContent = `${curr}${entry.price.toFixed(2)}`;
  targetTitle.textContent = entry.item || 'Live Web Target';
  targetVendor.textContent = `Vendor: ${entry.vendor || 'Live Web Supplier'}`;
  targetLatency.textContent = `${entry.latencyMs}ms`;

  const adapter = state.adapters.find(a => a.id === entry.adapterId);
  if (adapter) {
    targetExternalLink.href = adapter.url;
    targetThresholdDisplay.textContent = `${curr}${adapter.threshold.toFixed(2)}`;
    thresholdValueBadge.textContent = `${curr}${adapter.threshold.toFixed(2)}`;
  }

  targetStockStatus.textContent = entry.inStock ? 'In Stock' : 'Out of Stock';
  targetStockStatus.className = `stat-val ${entry.inStock ? 'text-green' : 'text-danger'}`;

  const time = new Date().toLocaleTimeString();
  const alertTag = entry.triggered ? '<span class="log-alert">[THRESHOLD REACHED]</span>' : '';
  const logHtml = `
    <div class="log-line">
      <span class="log-time">[${time}]</span>
      <span>${entry.adapterId}</span>
      <span style="color:#fff; font-weight:600;">${curr}${entry.price.toFixed(2)}</span>
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
  alertSummaryText.textContent = alertData.wakeEvent?.analysis?.executiveSummary || 'Target threshold crossed! AI Agent formulated procurement briefing.';

  const logHtml = `
    <div class="log-line" style="background: rgba(245, 158, 11, 0.15); padding: 4px; border-radius: 4px;">
      <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
      <span class="log-alert">🚨 AI AWAKENED:</span>
      <span>Recommendation: ${alertData.wakeEvent?.analysis?.recommendation || 'BUY'}</span>
    </div>
  `;
  appendLogHtml(logHtml);
}

function updateMetricsUI(metrics) {
  if (!metrics) return;
  state.metrics = metrics;

  kpiDollarsSaved.textContent = `$${metrics.savings.dollarsSaved.toFixed(2)}`;
  kpiEfficiency.textContent = `${metrics.savings.efficiencyPercent}% LLM Cost Reduction`;
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
          Monitoring live web targets at <strong>0 tokens ($0.00)</strong>.<br>
          When a price triggers your threshold, the AI agent will formulate a purchase order recommendation here for your approval.
        </div>
      </div>
    `;
    return;
  }

  pendingGateList.innerHTML = state.pendingGates.map(gate => {
    const trigger = gate.data.trigger;
    const analysis = gate.data.analysis;
    const fin = analysis.financialImpact || {};
    const curr = trigger.currency || '$';

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
          <div class="gate-item-price">${curr}${trigger.currentPrice.toFixed(2)}</div>
        </div>

        <div class="gate-summary-box">
          ${analysis.executiveSummary}
          <div style="margin-top: 6px; font-weight: 600; color: var(--green);">
            Estimated Batch Lot Savings: ${fin.batch25LotSavings || '$2,250.00'}
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
    const curr = gate.data?.trigger?.currency || '$';

    return `
      <tr>
        <td><code>${gate.gateId}</code></td>
        <td>${new Date(gate.decidedAt || gate.createdAt).toLocaleTimeString()}</td>
        <td>${gate.data?.trigger?.item || 'Item'}</td>
        <td style="font-family: var(--font-mono); font-weight:700;">${curr}${(gate.data?.trigger?.currentPrice || 0).toFixed(2)}</td>
        <td style="font-weight:700; color: ${isApproved ? 'var(--green)' : 'var(--red)'};">${gate.status}</td>
        <td>${gate.decidedBy || 'Operator'}</td>
        <td>${isApproved ? `<code style="color:var(--cyan);">${poNumber}</code>` : '<span class="text-muted">Dismissed</span>'}</td>
      </tr>
    `;
  }).join('');
}

// Render Manage Watchlist items
function renderWatchlistItems() {
  if (!state.adapters || state.adapters.length === 0) {
    watchlistItemsList.innerHTML = '<div class="text-muted text-center" style="padding: 20px;">No targets currently monitored.</div>';
    return;
  }

  watchlistItemsList.innerHTML = state.adapters.map(a => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); border: 1px solid var(--border); padding: 10px 14px; border-radius: 8px;">
      <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 380px;">
        <div style="font-weight: 700; font-size: 13px; color: #fff;">${a.name}</div>
        <div style="font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis;">${a.url}</div>
      </div>
      <button class="btn btn-sm btn-outline" style="color: var(--red); border-color: rgba(239, 68, 68, 0.3);" onclick="deleteTarget('${a.id}')">
        🗑️ Remove
      </button>
    </div>
  `).join('');
}

// Delete target action
async function deleteTarget(adapterId) {
  if (!confirm(`Are you sure you want to remove target "${adapterId}" from your watch list?`)) return;

  try {
    const res = await fetch('/api/adapters/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adapterId })
    });
    const data = await res.json();
    if (data.success) {
      appendLog('CONFIG', `Removed target ${adapterId} from monitoring.`);
    } else {
      alert('Failed to delete target: ' + data.error);
    }
  } catch (err) {
    alert('Error deleting target: ' + err.message);
  }
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

// Target Selection Change
targetSelector.addEventListener('change', async (e) => {
  const selectedId = e.target.value;
  if (!selectedId) return;
  try {
    const res = await fetch('/api/monitor/select-adapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adapterId: selectedId })
    });
    const data = await res.json();
    if (data.success) {
      appendLog('TARGET', `Switched monitoring target to: ${selectedId}`);
      if (data.adapter) {
        thresholdInput.value = data.adapter.threshold;
        thresholdValueBadge.textContent = `$${data.adapter.threshold.toFixed(2)}`;
      }
    }
  } catch (err) {
    alert('Failed to switch target: ' + err.message);
  }
});

// Delete Active Target Button
btnDeleteCurrentTarget.addEventListener('click', () => {
  const currentId = targetSelector.value;
  if (currentId) deleteTarget(currentId);
});

// Update Threshold
btnUpdateThreshold.addEventListener('click', async () => {
  const val = parseFloat(thresholdInput.value);
  if (isNaN(val) || val <= 0) return alert('Please enter a valid price threshold.');

  const selectedId = targetSelector.value;
  try {
    const res = await fetch('/api/target/threshold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adapterId: selectedId, threshold: val })
    });
    const data = await res.json();
    if (data.success) {
      thresholdValueBadge.textContent = `$${val.toFixed(2)}`;
      targetThresholdDisplay.textContent = `$${val.toFixed(2)}`;
      appendLog('CONFIG', `Updated alert threshold to $${val.toFixed(2)} for ${selectedId}`);
    }
  } catch (err) {
    alert('Failed to update threshold: ' + err.message);
  }
});

// Quick Trigger
btnSetThresholdTrigger.addEventListener('click', () => {
  const currentPriceText = targetCurrentPrice.textContent.replace(/[^0-9.]/g, '');
  const currentVal = parseFloat(currentPriceText) || 10.0;
  const triggerVal = currentVal + 2.00;
  thresholdInput.value = triggerVal.toFixed(2);
  btnUpdateThreshold.click();
});

// Reset Threshold below price
btnResetThreshold.addEventListener('click', () => {
  const currentPriceText = targetCurrentPrice.textContent.replace(/[^0-9.]/g, '');
  const currentVal = parseFloat(currentPriceText) || 10.0;
  const resetVal = Math.max(1.0, currentVal - 5.00);
  thresholdInput.value = resetVal.toFixed(2);
  btnUpdateThreshold.click();
});

// Webhook Test Sender
btnSendTestWebhook.addEventListener('click', async () => {
  const url = webhookUrlInput.value.trim();
  if (!url) return alert('Please paste your Discord or Slack Webhook URL.');

  btnSendTestWebhook.disabled = true;
  btnSendTestWebhook.textContent = 'Sending...';

  try {
    const res = await fetch('/api/webhook/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: url,
        message: '⚡ [Cost Collapser] Real-Time Alert: Price threshold reached on live web target!',
        details: {
          item: targetTitle.textContent,
          price: targetCurrentPrice.textContent,
          summary: 'Live web price crossed alert threshold. Formulation completed with 0 polling tokens.'
        }
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Webhook sent successfully! Check your Discord / Slack channel.');
      appendLog('WEBHOOK', `Dispatched real-time alert webhook to endpoint.`);
    } else {
      alert('Webhook error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to send webhook: ' + err.message);
  } finally {
    btnSendTestWebhook.disabled = false;
    btnSendTestWebhook.textContent = 'Send Webhook';
  }
});

// Modal Events
btnOpenAddModal.addEventListener('click', () => addModal.style.display = 'flex');
btnCloseAddModal.addEventListener('click', () => addModal.style.display = 'none');
btnCancelAddModal.addEventListener('click', () => addModal.style.display = 'none');

btnOpenManageModal.addEventListener('click', () => {
  renderWatchlistItems();
  manageModal.style.display = 'flex';
});
btnCloseManageModal.addEventListener('click', () => manageModal.style.display = 'none');
btnDoneManageModal.addEventListener('click', () => manageModal.style.display = 'none');

btnSubmitAddTarget.addEventListener('click', async () => {
  const url = newTargetUrl.value.trim();
  const name = newTargetName.value.trim();
  const threshold = parseFloat(newTargetThreshold.value);

  if (!url) return alert('Please enter a valid website URL.');
  if (isNaN(threshold) || threshold <= 0) return alert('Please enter a valid threshold.');

  btnSubmitAddTarget.disabled = true;
  btnSubmitAddTarget.textContent = 'Analyzing & Registering...';

  try {
    const res = await fetch('/api/adapters/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name, threshold })
    });
    const data = await res.json();
    if (data.success) {
      addModal.style.display = 'none';
      newTargetUrl.value = '';
      newTargetName.value = '';
      appendLog('TARGET', `Registered and started monitoring new live URL: ${url}`);
    } else {
      alert('Failed to register target: ' + data.error);
    }
  } catch (err) {
    alert('Error registering target: ' + err.message);
  } finally {
    btnSubmitAddTarget.disabled = false;
    btnSubmitAddTarget.textContent = 'Add & Start Monitoring';
  }
});

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
      <div style="color: var(--cyan);">Analyzing live data & executing tools...</div>
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

btnClearLogs.addEventListener('click', () => {
  terminalLogs.innerHTML = '';
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

// Expose globals for inline onclick
window.approveGate = approveGate;
window.rejectGate = rejectGate;
window.deleteTarget = deleteTarget;

// Initialize
initWebSocket();
