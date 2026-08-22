import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { ADAPTER_PRESETS } from './presets.js';

// Locate installed Chrome / Edge browser binary
function getBrowserExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

export class AdapterEngine {
  constructor() {
    this.adapters = new Map(Object.entries(ADAPTER_PRESETS));
    this.browserPath = getBrowserExecutablePath();
    this.browserInstance = null;
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
        priceRegex: /[£\$€₹]?\s*([0-9]+(?:\.[0-9]{2})?)/,
        inStockRegex: /in stock|available/i
      },
      ...adapterConfig
    };
    this.adapters.set(adapterConfig.id, registered);
    return registered;
  }

  deleteAdapter(id) {
    if (this.adapters.has(id)) {
      this.adapters.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Universal Extraction Engine
   * Tier 1: Ultra-fast direct HTTP fetch (< 300ms, 0 tokens)
   * Tier 2: Real Browser Engine Fallback for Akamai/Cloudflare/React/H&M (0 tokens)
   */
  async execute(adapterIdOrConfig) {
    const startTime = performance.now();
    let adapter = typeof adapterIdOrConfig === 'string' 
      ? this.getAdapter(adapterIdOrConfig) 
      : adapterIdOrConfig;

    if (!adapter) {
      // Fallback to first available adapter if deleted or not found
      const first = Array.from(this.adapters.values())[0];
      if (first) adapter = first;
      else throw new Error(`Target adapter "${adapterIdOrConfig}" not found`);
    }

    try {
      // 1. JSON API target
      if (adapter.type === 'json-api') {
        return await this.executeJsonApi(adapter, startTime);
      }

      // 2. Tier 1: Try Fast HTTP Fetch
      const fastResult = await this.executeHttpFetch(adapter, startTime);
      
      // If Tier 1 successfully extracted product title and price, return it immediately
      if (fastResult.success && fastResult.price > 0 && !/access denied|robot|captcha/i.test(fastResult.item)) {
        return fastResult;
      }

      // 3. Tier 2: Real Browser Engine Fallback (for H&M, Zara, Nike, Akamai/Cloudflare SPA targets)
      console.log(`[AdapterEngine] Tier 1 fetch blocked or empty for ${adapter.url}. Engaging Real Browser Engine...`);
      const browserResult = await this.executeRealBrowser(adapter, startTime);
      return browserResult;

    } catch (error) {
      // Fallback to real browser if http failed entirely
      try {
        const browserResult = await this.executeRealBrowser(adapter, startTime);
        return browserResult;
      } catch (browserError) {
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

  /**
   * Tier 1: Fast HTTP Fetch + JSON-LD & DOM Parsing
   */
  async executeHttpFetch(adapter, startTime) {
    const response = await fetch(adapter.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 CostCollapser/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Try JSON-LD structured data first
    let jsonLdItem = null;
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).text());
        const list = Array.isArray(data) ? data : (data['@graph'] || [data]);
        for (const it of list) {
          if (it['@type'] === 'Product' || it.offers) {
            const rawP = it.offers?.price || it.offers?.[0]?.price || it.offers?.lowPrice;
            const rawCurr = it.offers?.priceCurrency || it.offers?.[0]?.priceCurrency || '$';
            if (rawP) {
              jsonLdItem = {
                title: it.name,
                price: parseFloat(rawP),
                currency: rawCurr.includes('GBP') ? '£' : (rawCurr.includes('EUR') ? '€' : '$')
              };
            }
          }
        }
      } catch (e) {}
    });

    if (jsonLdItem && jsonLdItem.price > 0) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        adapterId: adapter.id,
        item: jsonLdItem.title || adapter.name,
        price: jsonLdItem.price,
        currency: jsonLdItem.currency,
        inStock: true,
        sku: 'JSON-LD-VERIFIED',
        vendor: adapter.selectors?.vendor || new URL(adapter.url).hostname,
        threshold: adapter.threshold,
        triggered: jsonLdItem.price > 0 && jsonLdItem.price <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }

    // 2. Try DOM Selectors
    let rawItem = $(adapter.selectors?.item || 'h1').first().text().trim();
    if (!rawItem) rawItem = $('title').text().trim() || adapter.name || 'Live Web Target';

    let cleanPrice = 0;
    let currency = '$';

    if (adapter.selectors?.price) {
      const rawPrice = $(adapter.selectors.price).first().text().trim();
      const match = rawPrice.match(/[0-9]+(?:\.[0-9]{2})?/);
      if (match) cleanPrice = parseFloat(match[0]);
      if (rawPrice.includes('£')) currency = '£';
      else if (rawPrice.includes('€')) currency = '€';
      else if (rawPrice.includes('₹')) currency = '₹';
    }

    // 3. Try Scanning Text Nodes for Price Symbols
    if (!cleanPrice) {
      $('*').each((i, el) => {
        if ($(el).children().length === 0) {
          const txt = $(el).text().trim();
          const match = txt.match(/^([$£€₹])\s*([0-9]+(?:\.[0-9]{2}))$/);
          if (match) {
            currency = match[1];
            cleanPrice = parseFloat(match[2]);
            return false;
          }
        }
      });
    }

    // 4. Parse stock availability
    let inStock = true;
    if (adapter.selectors?.inStock) {
      const rawStock = $(adapter.selectors.inStock).first().text().trim();
      if (rawStock) {
        inStock = /in stock|available|units ready/i.test(rawStock) && !/out of stock|unavailable/i.test(rawStock);
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: cleanPrice > 0,
      adapterId: adapter.id,
      item: rawItem,
      price: cleanPrice,
      currency,
      inStock,
      sku: 'DOM-EXTRACTED',
      vendor: adapter.selectors?.vendor || new URL(adapter.url).hostname,
      threshold: adapter.threshold,
      triggered: cleanPrice > 0 && cleanPrice <= adapter.threshold,
      timestamp: new Date().toISOString(),
      latencyMs,
      tokensConsumed: 0
    };
  }

  /**
   * Tier 2: Real Browser Engine (Bypasses Akamai/Cloudflare, renders React/Next.js/H&M)
   */
  async executeRealBrowser(adapter, startTime) {
    if (!this.browserPath) {
      throw new Error('No Chrome or Edge browser binary found on system');
    }

    const browser = await puppeteer.launch({
      executablePath: this.browserPath,
      headless: false, // Run real browser instance off-screen to pass Akamai/Cloudflare bot defense
      args: [
        '--window-position=-2400,-2400',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    });

    try {
      const page = await browser.newPage();
      await page.goto(adapter.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Allow 4 seconds for Akamai JS & React hydration
      await new Promise(r => setTimeout(r, 4500));

      const extracted = await page.evaluate(() => {
        // Check JSON-LD
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const data = JSON.parse(s.textContent);
            const list = Array.isArray(data) ? data : (data['@graph'] || [data]);
            for (const it of list) {
              if (it['@type'] === 'Product' || it.offers) {
                const price = it.offers?.price || it.offers?.[0]?.price || it.offers?.lowPrice;
                return {
                  title: it.name,
                  price: parseFloat(price),
                  currency: it.offers?.priceCurrency || '$',
                  inStock: true
                };
              }
            }
          } catch (e) {}
        }

        // Check DOM H1 & Price Nodes
        const h1 = document.querySelector('h1')?.textContent.trim() || document.title;
        let price = 0;
        let currency = '$';

        const priceEls = document.querySelectorAll('[class*="price" i], [class*="Price" i], span, div, p');
        for (const el of priceEls) {
          if (el.children.length === 0) {
            const txt = el.textContent.trim();
            const match = txt.match(/^([$£€₹])\s*([0-9]+(?:\.[0-9]{2})?)$/);
            if (match && parseFloat(match[2]) > 0) {
              currency = match[1];
              price = parseFloat(match[2]);
              break;
            }
          }
        }

        return { title: h1, price, currency, inStock: true };
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const cleanTitle = extracted.title && !/access denied/i.test(extracted.title) 
        ? extracted.title 
        : (adapter.name || 'Live Web Product');

      return {
        success: extracted.price > 0,
        adapterId: adapter.id,
        item: cleanTitle,
        price: extracted.price,
        currency: extracted.currency || '$',
        inStock: extracted.inStock,
        sku: 'BROWSER-LIVE-EXTRACT',
        vendor: adapter.selectors?.vendor || new URL(adapter.url).hostname,
        threshold: adapter.threshold,
        triggered: extracted.price > 0 && extracted.price <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };

    } finally {
      await browser.close();
    }
  }

  /**
   * JSON API Execution (e.g. CoinGecko, public financial APIs)
   */
  async executeJsonApi(adapter, startTime) {
    const response = await fetch(adapter.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
}

export const adapterEngine = new AdapterEngine();
