import * as cheerio from 'cheerio';
import { ADAPTER_PRESETS } from './presets.js';

export class AdapterEngine {
  constructor() {
    this.adapters = new Map(Object.entries(ADAPTER_PRESETS));
  }

  getAdapter(id) {
    return this.adapters.get(id);
  }

  getAllAdapters() {
    return Array.from(this.adapters.values());
  }

  registerAdapter(adapterConfig) {
    if (!adapterConfig.id || !adapterConfig.url) {
      throw new Error('Target must have an id and url');
    }
    const registered = {
      type: adapterConfig.type || 'html-selector',
      threshold: parseFloat(adapterConfig.threshold || 50.0),
      selectors: {
        item: adapterConfig.selectors?.item || 'h1, #product-title, .product-title, .title',
        price: adapterConfig.selectors?.price || '.price_color, .price, #product-price, .product-price',
        currency: adapterConfig.selectors?.currency || '.price',
        inStock: adapterConfig.selectors?.inStock || '.instock, .availability, #stock-status',
        sku: adapterConfig.selectors?.sku || '.sku, #product-sku',
        vendor: adapterConfig.selectors?.vendor || 'Live Web Supplier'
      },
      parseRules: {
        priceRegex: /[£\$€]?\s*([0-9]+(?:\.[0-9]{2})?)/,
        inStockRegex: /in stock|available/i
      },
      ...adapterConfig
    };
    this.adapters.set(adapterConfig.id, registered);
    return registered;
  }

  /**
   * Layer 2: Deterministic Zero-Token Live Execution
   * Executes live HTTP fetch against real public web pages or APIs with 0 LLM tokens.
   */
  async execute(adapterIdOrConfig) {
    const startTime = performance.now();
    let adapter = typeof adapterIdOrConfig === 'string' 
      ? this.getAdapter(adapterIdOrConfig) 
      : adapterIdOrConfig;

    if (!adapter) {
      throw new Error(`Target adapter "${adapterIdOrConfig}" not found`);
    }

    try {
      const response = await fetch(adapter.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 CostCollapser/2.0 (Autonomous-Zero-Token-Monitor)',
          'Accept': 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${adapter.url}`);
      }

      // Handle JSON API Target (e.g. CoinGecko, public financial APIs)
      if (adapter.type === 'json-api' || response.headers.get('content-type')?.includes('application/json')) {
        const jsonData = await response.json();
        let price = 0;
        if (adapter.jsonPath) {
          const parts = adapter.jsonPath.split('.');
          let curr = jsonData;
          for (const p of parts) {
            if (curr && curr[p] !== undefined) curr = curr[p];
          }
          price = typeof curr === 'number' ? curr : parseFloat(curr) || 0;
        } else {
          price = Object.values(jsonData)[0]?.usd || Object.values(jsonData)[0] || 0;
        }

        const latencyMs = Math.round(performance.now() - startTime);
        return {
          success: true,
          adapterId: adapter.id,
          item: adapter.selectors?.item || adapter.name,
          price: parseFloat(price.toFixed(2)),
          currency: '$',
          inStock: true,
          sku: 'API-LIVE-FEED',
          vendor: adapter.selectors?.vendor || 'Real-Time Market API',
          threshold: adapter.threshold,
          triggered: price > 0 && price <= adapter.threshold,
          timestamp: new Date().toISOString(),
          latencyMs,
          tokensConsumed: 0
        };
      }

      // Handle Live Web HTML Pages
      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract raw title
      let rawItem = $(adapter.selectors?.item || 'h1').first().text().trim();
      if (!rawItem) rawItem = $('title').text().trim() || adapter.name || 'Live Web Product';

      // Extract price using selectors or fallback regex
      let rawPrice = '';
      if (adapter.selectors?.price) {
        rawPrice = $(adapter.selectors.price).first().text().trim();
      }
      
      let cleanPrice = 0;
      if (rawPrice) {
        const priceMatch = rawPrice.match(/[0-9]+(?:\.[0-9]{2})?/);
        if (priceMatch) cleanPrice = parseFloat(priceMatch[0]);
      }

      // If price wasn't found by explicit selector, perform semantic search in DOM
      if (!cleanPrice) {
        $('*').each((i, el) => {
          if ($(el).children().length === 0) {
            const txt = $(el).text().trim();
            const match = txt.match(/^[£\$€]\s*([0-9]+(?:\.[0-9]{2}))$/);
            if (match) {
              cleanPrice = parseFloat(match[1]);
              rawPrice = txt;
              return false; // break
            }
          }
        });
      }

      // Extract currency symbol
      let currency = '$';
      if (rawPrice.includes('£')) currency = '£';
      else if (rawPrice.includes('€')) currency = '€';
      else if (rawPrice.includes('$')) currency = '$';

      // Extract stock
      const stockElText = $(adapter.selectors?.inStock || '.availability, #stock-status').first().text().trim();
      const inStock = stockElText ? !/out of stock|unavailable/i.test(stockElText) : true;

      const sku = $(adapter.selectors?.sku || '.sku').first().text().trim() || 'WEB-LIVE-TARGET';
      const vendor = adapter.selectors?.vendor || 'Live Web Target';
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        adapterId: adapter.id,
        item: rawItem,
        price: cleanPrice,
        currency,
        inStock,
        sku,
        vendor,
        threshold: adapter.threshold,
        triggered: cleanPrice > 0 && cleanPrice <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0 // 0 TOKENS!
      };

    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        adapterId: adapter?.id || 'unknown',
        error: error.message,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }
  }
}

export const adapterEngine = new AdapterEngine();
