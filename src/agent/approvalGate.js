import { EventEmitter } from 'events';
import { CONFIG } from '../config.js';

export class ApprovalGate extends EventEmitter {
  constructor() {
    super();
    this.pendingGates = new Map();
    this.auditLog = [];
  }

  /**
   * Registers a new Human-in-the-Loop gate request
   */
  async createGate(wakeUpEvent) {
    const gateId = 'GATE-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    
    const gate = {
      gateId,
      wakeUpId: wakeUpEvent.wakeUpId,
      createdAt: new Date().toISOString(),
      status: 'PENDING_HUMAN_APPROVAL',
      data: wakeUpEvent,
      decision: null,
      decidedAt: null,
      decidedBy: null,
      executionResult: null
    };

    this.pendingGates.set(gateId, gate);
    
    // Dispatch webhook notifications if configured
    this.dispatchWebhook(gate).catch(err => {
      console.warn('Webhook dispatch failed:', err.message);
    });

    this.emit('gate_created', gate);
    return gate;
  }

  getGate(gateId) {
    return this.pendingGates.get(gateId) || this.auditLog.find(g => g.gateId === gateId);
  }

  getPendingGates() {
    return Array.from(this.pendingGates.values()).filter(g => g.status === 'PENDING_HUMAN_APPROVAL');
  }

  getAuditLog() {
    return this.auditLog;
  }

  /**
   * Human Operator Approves the Action
   */
  async approveGate(gateId, operator = 'Human Operator (Judge / Admin)', notes = '') {
    const gate = this.pendingGates.get(gateId);
    if (!gate) throw new Error(`Gate ${gateId} not found or already resolved`);

    gate.status = 'APPROVED';
    gate.decidedAt = new Date().toISOString();
    gate.decidedBy = operator;
    gate.notes = notes;

    // Simulate Autonomous ERP Execution (Purchase Order dispatch)
    const poNumber = 'PO-' + Math.floor(100000 + Math.random() * 900000);
    gate.executionResult = {
      success: true,
      action: 'PURCHASE_ORDER_ISSUED',
      poNumber,
      vendor: gate.data.trigger.vendor,
      item: gate.data.trigger.item,
      quantity: gate.data.analysis.suggestedOrderQty || 25,
      unitPrice: gate.data.trigger.currentPrice,
      totalAmount: parseFloat(((gate.data.analysis.suggestedOrderQty || 25) * gate.data.trigger.currentPrice).toFixed(2)),
      executedAt: new Date().toISOString(),
      message: `Purchase Order ${poNumber} successfully transmitted to ${gate.data.trigger.vendor} EDI Gateway.`
    };

    this.pendingGates.delete(gateId);
    this.auditLog.unshift(gate);
    if (this.auditLog.length > 100) this.auditLog.pop();

    this.emit('gate_resolved', gate);
    return gate;
  }

  /**
   * Human Operator Rejects the Action
   */
  async rejectGate(gateId, operator = 'Human Operator (Judge / Admin)', reason = 'Price drop acknowledged, but deferred by procurement policy.') {
    const gate = this.pendingGates.get(gateId);
    if (!gate) throw new Error(`Gate ${gateId} not found or already resolved`);

    gate.status = 'REJECTED';
    gate.decidedAt = new Date().toISOString();
    gate.decidedBy = operator;
    gate.reason = reason;
    gate.executionResult = {
      success: true,
      action: 'ORDER_DISMISSED',
      executedAt: new Date().toISOString(),
      message: `Procurement action canceled by ${operator}. Zero-Token Sentinel resumed idle monitoring.`
    };

    this.pendingGates.delete(gateId);
    this.auditLog.unshift(gate);

    this.emit('gate_resolved', gate);
    return gate;
  }

  /**
   * Dispatches structured alerts to external webhooks (Slack / Discord / custom)
   */
  async dispatchWebhook(gate) {
    const trigger = gate.data.trigger;
    const analysis = gate.data.analysis;

    if (CONFIG.SLACK_WEBHOOK_URL) {
      const slackPayload = {
        text: `🚨 *ZERO-TOKEN SENTINEL ALERT: Price Target Reached!*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🚨 *Zero-Token Sentinel Awakened AI Agent*\n*Item:* ${trigger.item}\n*Price:* ~$${trigger.currentPrice}~ (Threshold: $${trigger.threshold})\n*Recommendation:* *${analysis.recommendation}*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Executive Summary:*\n${analysis.executiveSummary}`
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `🔒 *Human-in-the-loop Gate ID:* \`${gate.gateId}\` | Action: ${analysis.proposedAction}`
              }
            ]
          }
        ]
      };

      await fetch(CONFIG.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
    }
  }
}

export const approvalGate = new ApprovalGate();
