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
      throw new Error('Adapter must have an id and url');
    }
    this.adapters.set(adapterConfig.id, {
      type: 'html-selector',
      threshold: 50.0,
      selectors: {
        item: '#product-title, h1',
        price: '#product-price, .price',
        currency: '#currency-symbol',
        inStock: '#stock-status',
        sku: '#product-sku',
        vendor: '#vendor-name'
      },
      parseRules: {
        priceRegex: /[\$€£]?\s*([0-9]+(?:\.[0-9]{2})?)/,
        inStockRegex: /in stock|available/i
      },
      ...adapterConfig
    });
    return this.adapters.get(adapterConfig.id);
  }

  /**
   * Layer 2: Deterministic Zero-Token Extraction
   * Fetches DOM and evaluates strict CSS selectors in <50ms with 0 tokens.
   */
  async execute(adapterIdOrConfig) {
    const startTime = performance.now();
    let adapter = typeof adapterIdOrConfig === 'string' 
      ? this.getAdapter(adapterIdOrConfig) 
      : adapterIdOrConfig;

    if (!adapter) {
      throw new Error(`Adapter "${adapterIdOrConfig}" not found`);
    }

    try {
      const response = await fetch(adapter.url, {
        headers: {
          'User-Agent': 'ZeroTokenSentinel/1.0 (Autonomous-Procurement-Agent)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${adapter.url}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract raw fields using selectors
      const rawItem = $(adapter.selectors.item).first().text().trim() || 'Unknown Item';
      const rawPrice = $(adapter.selectors.price).first().text().trim() || '0';
      const rawCurrency = adapter.selectors.currency ? $(adapter.selectors.currency).first().text().trim() || '$' : '$';
      const rawStock = adapter.selectors.inStock ? $(adapter.selectors.inStock).first().text().trim() : 'In Stock';
      const rawSku = adapter.selectors.sku ? $(adapter.selectors.sku).first().text().trim() : 'N/A';
      const rawVendor = adapter.selectors.vendor ? $(adapter.selectors.vendor).first().text().trim() : 'Apex Industrial Supply';

      // Parse price
      let cleanPrice = 0;
      const priceRegex = adapter.parseRules?.priceRegex || /[\$€£]?\s*([0-9]+(?:\.[0-9]{2})?)/;
      const priceMatch = rawPrice.match(priceRegex);
      if (priceMatch) {
        cleanPrice = parseFloat(priceMatch[1] || priceMatch[0].replace(/[^0-9.]/g, ''));
      } else {
        cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
      }

      // Parse stock
      const inStockRegex = adapter.parseRules?.inStockRegex || /in stock|available/i;
      const inStock = inStockRegex.test(rawStock);

      const latencyMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        adapterId: adapter.id,
        item: rawItem,
        price: cleanPrice,
        currency: rawCurrency.replace(/[0-9.]/g, '').trim() || '$',
        inStock: inStock,
        sku: rawSku,
        vendor: rawVendor,
        threshold: adapter.threshold,
        triggered: cleanPrice > 0 && cleanPrice <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0 // ZERO TOKENS!
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
