import { CONFIG } from '../config.js';

export class CostCalculator {
  constructor() {
    this.totalChecks = 0;
    this.totalWakeUps = 0;
    this.wakeUpTokensConsumed = 0;
    this.startTime = Date.now();
  }

  recordCheck() {
    this.totalChecks += 1;
    return this.getMetrics();
  }

  recordWakeUp(tokens = 380) {
    this.totalWakeUps += 1;
    this.wakeUpTokensConsumed += tokens;
    return this.getMetrics();
  }

  getMetrics() {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    
    // Traditional Agentic Polling:
    // Every single check re-prompts an LLM (DOM tree + vision + reasoning): ~2,450 tokens/check
    const traditionalTokens = this.totalChecks * CONFIG.BENCHMARK.TOKENS_PER_BROWSER_STEP;
    const traditionalCostUSD = (traditionalTokens / 1_000_000) * CONFIG.BENCHMARK.COST_PER_MILLION_TOKENS;

    // Zero-Token Sentinel:
    // 0 tokens for all polling checks. Tokens only spent when waking up the agent on trigger!
    const sentinelTokens = this.wakeUpTokensConsumed;
    const sentinelCostUSD = (sentinelTokens / 1_000_000) * CONFIG.BENCHMARK.COST_PER_MILLION_TOKENS;

    const tokensSaved = Math.max(0, traditionalTokens - sentinelTokens);
    const dollarsSaved = Math.max(0, traditionalCostUSD - sentinelCostUSD);
    const efficiency = traditionalTokens > 0 
      ? (((traditionalTokens - sentinelTokens) / traditionalTokens) * 100).toFixed(2)
      : '100.00';

    // Projected daily / monthly run-rate if polling every 10s:
    const checksPerDay = (86400 / (CONFIG.POLL_INTERVAL_SEC || 5));
    const projectedTraditionalDailyUSD = (checksPerDay * CONFIG.BENCHMARK.TOKENS_PER_BROWSER_STEP / 1_000_000) * CONFIG.BENCHMARK.COST_PER_MILLION_TOKENS;
    const projectedSentinelDailyUSD = (10 * 380 / 1_000_000) * CONFIG.BENCHMARK.COST_PER_MILLION_TOKENS; // assuming 10 trigger wakeups/day

    return {
      totalChecks: this.totalChecks,
      totalWakeUps: this.totalWakeUps,
      elapsedSeconds,
      traditional: {
        tokensBurned: traditionalTokens,
        costUSD: parseFloat(traditionalCostUSD.toFixed(4)),
        tokensPerCheck: CONFIG.BENCHMARK.TOKENS_PER_BROWSER_STEP
      },
      sentinel: {
        tokensBurned: sentinelTokens,
        costUSD: parseFloat(sentinelCostUSD.toFixed(6)),
        tokensPerPollingCheck: 0
      },
      savings: {
        tokensSaved,
        dollarsSaved: parseFloat(dollarsSaved.toFixed(4)),
        efficiencyPercent: parseFloat(efficiency),
        collapsedCostPercent: '100.00%'
      },
      projections: {
        traditionalDailyUSD: parseFloat(projectedTraditionalDailyUSD.toFixed(2)),
        sentinelDailyUSD: parseFloat(projectedSentinelDailyUSD.toFixed(4)),
        projectedMonthlySavingsUSD: parseFloat(((projectedTraditionalDailyUSD - projectedSentinelDailyUSD) * 30).toFixed(2))
      }
    };
  }

  reset() {
    this.totalChecks = 0;
    this.totalWakeUps = 0;
    this.wakeUpTokensConsumed = 0;
    this.startTime = Date.now();
  }
}

export const costCalculator = new CostCalculator();
