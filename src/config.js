import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MOCK_STORE_PORT: parseInt(process.env.MOCK_STORE_PORT || '4100', 10),
  POLL_INTERVAL_SEC: parseInt(process.env.POLL_INTERVAL_SEC || '5', 10),
  TARGET_PRICE_THRESHOLD: parseFloat(process.env.TARGET_PRICE_THRESHOLD || '50.00'),
  DEFAULT_ADAPTER: process.env.DEFAULT_ADAPTER || 'apex-industrial',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
  
  // Traditional Agent Benchmark Pricing (e.g. GPT-4o / Claude 3.5 Sonnet / Gemini 1.5 Pro)
  BENCHMARK: {
    TOKENS_PER_BROWSER_STEP: 2450, // Average input + screenshot + output tokens per check
    COST_PER_MILLION_TOKENS: 15.00, // $15 / 1M tokens ($0.015 / 1k)
  }
};
