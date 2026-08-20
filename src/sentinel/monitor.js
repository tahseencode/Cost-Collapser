import { EventEmitter } from 'events';
import { adapterEngine } from '../adapters/adapterEngine.js';
import { costCalculator } from './costCalculator.js';
import { wakeUpEngine } from '../agent/wakeUpEngine.js';
import { approvalGate } from '../agent/approvalGate.js';
import { CONFIG } from '../config.js';

export class SentinelMonitor extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.intervalId = null;
    this.activeAdapterId = CONFIG.DEFAULT_ADAPTER;
    this.pollIntervalSec = CONFIG.POLL_INTERVAL_SEC;
    this.history = [];
    this.maxHistory = 100;
    this.lastTriggeredState = false;
  }

  start(adapterId = this.activeAdapterId, intervalSec = this.pollIntervalSec) {
    if (this.isRunning) return;
    this.activeAdapterId = adapterId;
    this.pollIntervalSec = intervalSec;
    this.isRunning = true;

    // Run first check immediately
    this.tick();

    // Schedule continuous loop
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.pollIntervalSec * 1000);

    this.emit('status_change', { isRunning: true, adapterId, intervalSec });
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.emit('status_change', { isRunning: false });
  }

  setIntervalSec(seconds) {
    this.pollIntervalSec = Math.max(1, parseInt(seconds, 10));
    if (this.isRunning) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.tick();
      }, this.pollIntervalSec * 1000);
    }
  }

  setActiveAdapter(adapterId) {
    this.activeAdapterId = adapterId;
    this.lastTriggeredState = false;
  }

  async tick() {
    try {
      // 1. Layer 2 Deterministic Zero-Token Check
      const result = await adapterEngine.execute(this.activeAdapterId);
      
      // 2. Update Cost Collapser metrics (0 tokens for this check!)
      const metrics = costCalculator.recordCheck();

      const entry = {
        id: 'CHK-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
        ...result,
        metrics
      };

      this.history.unshift(entry);
      if (this.history.length > this.maxHistory) this.history.pop();

      this.emit('check', entry);

      // 3. Phase 5 Trigger: Price <= Threshold
      if (result.success && result.triggered) {
        // Prevent duplicate trigger flooding if already in triggered state
        if (!this.lastTriggeredState) {
          this.lastTriggeredState = true;
          
          // WAKE UP AGENT!
          const wakeEvent = await wakeUpEngine.awakenAgent(result);
          const gate = await approvalGate.createGate(wakeEvent);

          this.emit('trigger_alert', {
            type: 'PRICE_TARGET_BREACHED',
            result,
            wakeEvent,
            gate
          });
        }
      } else {
        // Price restored or above threshold
        this.lastTriggeredState = false;
      }

      return entry;
    } catch (err) {
      this.emit('error', { error: err.message, timestamp: new Date().toISOString() });
    }
  }

  getRecentHistory() {
    return this.history;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeAdapterId: this.activeAdapterId,
      pollIntervalSec: this.pollIntervalSec,
      metrics: costCalculator.getMetrics(),
      pendingGatesCount: approvalGate.getPendingGates().length
    };
  }
}

export const sentinelMonitor = new SentinelMonitor();
