import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { ADAPTER_PRESETS } from './presets.js';
import { MOCK_PRODUCTS } from '../mock-store/storeData.js';

// Locate installed Chrome / Edge browser binary across Windows and Linux
function getBrowserExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium'
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
   * Tier 0: Internal Mock Store (0ms, 0 tokens)
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
      // 0. Mock Store target (Runs in-memory on localhost & Vercel)
      if (adapter.type === 'mock-store' || adapter.id === 'apex-industrial' || adapter.url?.includes('localhost:4100') || adapter.url?.startsWith('/products/')) {
        const prodId = adapter.url?.split('/products/')?.[1] || 'titan-carbide-drill-5000';
        const prod = MOCK_PRODUCTS[prodId] || MOCK_PRODUCTS['titan-carbide-drill-5000'];
        const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
        return {
          success: true,
          adapterId: adapter.id,
          item: prod.title,
          price: prod.price,
          currency: prod.currency || '$',
          inStock: prod.inStock,
          sku: prod.sku,
          vendor: prod.vendor,
          threshold: adapter.threshold,
          triggered: prod.price > 0 && prod.price <= adapter.threshold,
          timestamp: new Date().toISOString(),
          latencyMs,
          tokensConsumed: 0
        };
      }

      // 1. JSON API target (explicit or auto-detected)
      if (adapter.type === 'json-api') {
        return await this.executeJsonApi(adapter, startTime);
      }

      // 2. Tier 1: Try Fast HTTP Fetch (with auto JSON-API detection)
      const fastResult = await this.executeHttpFetch(adapter, startTime);
      
      // If Tier 1 successfully extracted product title and price, return it immediately
      if (fastResult.success && fastResult.price > 0 && !/access denied|robot|captcha/i.test(fastResult.item)) {
        return fastResult;
      }

      // 3. Tier 2: Real Browser Engine Fallback (for H&M, Zara, Nike, Akamai/Cloudflare SPA targets)
      if (this.browserPath) {
        console.log(`[AdapterEngine] Tier 1 fetch blocked or empty for ${adapter.url}. Engaging Real Browser Engine...`);
        const browserResult = await this.executeRealBrowser(adapter, startTime);
        return browserResult;
      }

      // Return fastResult even if empty price rather than failing
      return fastResult;

    } catch (error) {
      // Fallback to real browser if http failed entirely and browser is available
      if (this.browserPath) {
        try {
          const browserResult = await this.executeRealBrowser(adapter, startTime);
          return browserResult;
        } catch (browserError) {
          // fall through
        }
      }
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

  /**
   * Universal price string parser
   * Handles: $49.99, £51.77, €12.50, ₹54,999.00, ₹54999, 1,299.99, 49.99, Rs. 1,499, etc.
   */
  _parsePrice(text) {
    if (!text) return { price: 0, currency: '$' };
    const cleaned = text.replace(/\s+/g, ' ').trim();

    // Detect currency
    let currency = '$';
    if (/£/.test(cleaned)) currency = '£';
    else if (/€/.test(cleaned)) currency = '€';
    else if (/₹|Rs\.?|INR/i.test(cleaned)) currency = '₹';

    // Extract numeric price: strip currency symbols, commas → parse
    const numMatch = cleaned.match(/[0-9][0-9,]*(?:\.[0-9]{1,2})?/);
    if (numMatch) {
      const price = parseFloat(numMatch[0].replace(/,/g, ''));
      if (price > 0 && price < 10_000_000) return { price, currency };
    }
    return { price: 0, currency };
  }

  /**
   * Recursively extract price from JSON-LD offers (handles AggregateOffer, arrays, nested)
   */
  _extractJsonLdPrice(item) {
    if (!item) return null;

    // Direct Product with offers
    const offers = item.offers;
    if (!offers) return null;

    // offers can be a single object, an array, or an AggregateOffer
    const offerList = Array.isArray(offers) ? offers : [offers];

    for (const offer of offerList) {
      // AggregateOffer contains nested offers
      if (offer['@type'] === 'AggregateOffer') {
        const lowPrice = offer.lowPrice || offer.price;
        if (lowPrice) {
          return {
            title: item.name,
            price: parseFloat(lowPrice),
            currency: this._currencyCodeToSymbol(offer.priceCurrency)
          };
        }
        // Try nested offers inside AggregateOffer
        if (offer.offers) {
          const nested = Array.isArray(offer.offers) ? offer.offers : [offer.offers];
          for (const n of nested) {
            if (n.price) {
              return {
                title: item.name,
                price: parseFloat(n.price),
                currency: this._currencyCodeToSymbol(n.priceCurrency)
              };
            }
          }
        }
      }
      // Regular Offer
      if (offer.price) {
        return {
          title: item.name,
          price: parseFloat(offer.price),
          currency: this._currencyCodeToSymbol(offer.priceCurrency)
        };
      }
    }
    return null;
  }

  _currencyCodeToSymbol(code) {
    if (!code) return '$';
    const c = code.toUpperCase();
    if (c === 'GBP' || c === '£') return '£';
    if (c === 'EUR' || c === '€') return '€';
    if (c === 'INR' || c === '₹') return '₹';
    return '$';
  }

  /**
   * Tier 1: Fast HTTP Fetch + Multi-Strategy Price Extraction
   * Strategy order:
   *   1. JSON-LD structured data (@type Product, AggregateOffer)
   *   2. Meta tags (og:price:amount, product:price:amount, itemprop price)
   *   3. Explicit DOM selectors (adapter config + common e-commerce patterns)
   *   4. Broad text-node scanning (relaxed regex, handles ₹54,999 etc.)
   */
  async executeHttpFetch(adapter, startTime) {
    const response = await fetch(adapter.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch`);
    }

    // Auto-detect JSON API response by content-type
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      // Re-route to JSON API handler with the already-fetched body
      const jsonData = await response.json();
      return this._processJsonResponse(adapter, jsonData, startTime);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let hostname = '';
    try { hostname = new URL(adapter.url).hostname; } catch {}

    // === STRATEGY 1: JSON-LD Structured Data ===
    let jsonLdResult = null;
    $('script[type="application/ld+json"]').each((i, el) => {
      if (jsonLdResult) return;
      try {
        const raw = $(el).text();
        const data = JSON.parse(raw);

        // Flatten: could be array, single object, or @graph wrapper
        const candidates = [];
        if (Array.isArray(data)) {
          candidates.push(...data);
        } else if (data['@graph']) {
          candidates.push(...data['@graph']);
        } else {
          candidates.push(data);
        }

        for (const item of candidates) {
          if (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct' || item.offers) {
            const result = this._extractJsonLdPrice(item);
            if (result && result.price > 0) {
              jsonLdResult = result;
              return false;
            }
          }
        }
      } catch (e) { /* malformed JSON-LD, skip */ }
    });

    if (jsonLdResult && jsonLdResult.price > 0) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        adapterId: adapter.id,
        item: jsonLdResult.title || adapter.name || $('h1').first().text().trim() || $('title').text().trim(),
        price: jsonLdResult.price,
        currency: jsonLdResult.currency,
        inStock: true,
        sku: 'JSON-LD-VERIFIED',
        vendor: adapter.selectors?.vendor || hostname,
        threshold: adapter.threshold,
        triggered: jsonLdResult.price > 0 && jsonLdResult.price <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }

    // === STRATEGY 2: Meta Tags (OpenGraph / product / itemprop) ===
    let metaPrice = 0;
    let metaCurrency = '$';
    let metaTitle = '';

    const metaPriceSelectors = [
      'meta[property="og:price:amount"]',
      'meta[property="product:price:amount"]',
      'meta[name="twitter:data1"]',
      'meta[property="product:price"]',
      'meta[itemprop="price"]'
    ];
    for (const sel of metaPriceSelectors) {
      const val = $(sel).attr('content');
      if (val) {
        const parsed = this._parsePrice(val);
        if (parsed.price > 0) {
          metaPrice = parsed.price;
          break;
        }
      }
    }

    const metaCurrSelectors = [
      'meta[property="og:price:currency"]',
      'meta[property="product:price:currency"]'
    ];
    for (const sel of metaCurrSelectors) {
      const val = $(sel).attr('content');
      if (val) {
        metaCurrency = this._currencyCodeToSymbol(val);
        break;
      }
    }

    const metaTitleVal = $('meta[property="og:title"]').attr('content') || '';
    if (metaTitleVal) metaTitle = metaTitleVal;

    if (metaPrice > 0) {
      const itemName = metaTitle || $('h1').first().text().trim() || $('title').text().trim() || adapter.name || 'Web Product';
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        adapterId: adapter.id,
        item: itemName,
        price: metaPrice,
        currency: metaCurrency,
        inStock: true,
        sku: 'META-TAG-VERIFIED',
        vendor: adapter.selectors?.vendor || hostname,
        threshold: adapter.threshold,
        triggered: metaPrice > 0 && metaPrice <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }

    // === STRATEGY 3: DOM Selectors (configured + broad defaults) ===
    let rawItem = '';
    const titleSelectors = (adapter.selectors?.item || '').split(',').map(s => s.trim()).filter(Boolean);
    titleSelectors.push('h1', '.product-title', '.product-name', '#productTitle', '[data-testid="product-title"]', '.pdp-title', 'title');
    for (const sel of titleSelectors) {
      const text = $(sel).first().text().trim();
      if (text && text.length > 2 && text.length < 500) {
        rawItem = text;
        break;
      }
    }
    if (!rawItem) rawItem = $('title').text().trim() || adapter.name || 'Live Web Target';

    let cleanPrice = 0;
    let currency = '$';

    // Try configured price selectors first
    const priceSelectors = (adapter.selectors?.price || '').split(',').map(s => s.trim()).filter(Boolean);
    // Add many common e-commerce price selectors as fallbacks
    priceSelectors.push(
      '.price_color', '.product-price', '#product-price', '#priceblock_ourprice',
      '#priceblock_dealprice', '.a-price .a-offscreen', '.a-price-whole',
      '[data-testid="product-price"]', '.pdp-price', '.selling-price',
      '.current-price', '.offer-price', '.sale-price', '.special-price',
      '[itemprop="price"]', '.price', '.Price', 'span[class*="price"]',
      'div[class*="price"]', 'span[class*="Price"]', '.price-current',
      '.product_price', '#price', '#Price', '.cost', '.amount'
    );

    for (const sel of priceSelectors) {
      try {
        const el = $(sel).first();
        if (!el.length) continue;

        // Try content attribute first (e.g. <span itemprop="price" content="49.99">)
        const contentAttr = el.attr('content') || el.attr('data-price') || el.attr('data-value');
        if (contentAttr) {
          const parsed = this._parsePrice(contentAttr);
          if (parsed.price > 0) {
            cleanPrice = parsed.price;
            currency = parsed.currency;
            break;
          }
        }

        // Then try text content
        const rawText = el.text().trim();
        if (rawText) {
          const parsed = this._parsePrice(rawText);
          if (parsed.price > 0) {
            cleanPrice = parsed.price;
            currency = parsed.currency;
            break;
          }
        }
      } catch (e) { /* selector parse error, skip */ }
    }

    // === STRATEGY 4: Broad Text-Node Scan ===
    if (!cleanPrice) {
      // Scan all leaf-level elements for text that looks like a price
      const priceRegex = /[$£€₹]\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|(?:Rs\.?|INR)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|[0-9][0-9,]*\.[0-9]{2}/;
      $('span, div, p, b, strong, em, ins, td, li, h2, h3, h4, dd, label, data')
        .each((i, el) => {
          const $el = $(el);
          // Only check relatively short text (price elements are short)
          const txt = $el.text().trim();
          if (txt.length > 0 && txt.length < 50) {
            const match = txt.match(priceRegex);
            if (match) {
              const parsed = this._parsePrice(match[0]);
              if (parsed.price > 0) {
                cleanPrice = parsed.price;
                currency = parsed.currency;
                return false; // break
              }
            }
          }
        });
    }

    // === Parse stock availability ===
    let inStock = true;
    const stockSelectors = (adapter.selectors?.inStock || '').split(',').map(s => s.trim()).filter(Boolean);
    stockSelectors.push('.instock', '.availability', '#stock-status', '#availability', '[data-testid="stock-status"]');
    for (const sel of stockSelectors) {
      const rawStock = $(sel).first().text().trim();
      if (rawStock) {
        inStock = /in stock|available|units ready|add to cart|buy now/i.test(rawStock)
                  && !/out of stock|unavailable|sold out|currently unavailable/i.test(rawStock);
        break;
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
      vendor: adapter.selectors?.vendor || hostname,
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
            const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
            for (const it of items) {
              if (it['@type'] === 'Product' || it.offers) {
                const offers = Array.isArray(it.offers) ? it.offers : [it.offers];
                for (const offer of offers) {
                  const p = offer?.price || offer?.lowPrice;
                  if (p) {
                    return {
                      title: it.name,
                      price: parseFloat(p),
                      currency: offer?.priceCurrency || '$',
                      inStock: true
                    };
                  }
                  // AggregateOffer
                  if (offer?.offers) {
                    const nested = Array.isArray(offer.offers) ? offer.offers : [offer.offers];
                    for (const n of nested) {
                      if (n.price) return { title: it.name, price: parseFloat(n.price), currency: n.priceCurrency || '$', inStock: true };
                    }
                  }
                }
              }
            }
          } catch (e) {}
        }

        // Check meta tags
        const metaPrice = document.querySelector('meta[property="og:price:amount"], meta[property="product:price:amount"], meta[itemprop="price"]');
        if (metaPrice) {
          const val = parseFloat(metaPrice.getAttribute('content'));
          if (val > 0) {
            const metaCurr = document.querySelector('meta[property="og:price:currency"], meta[property="product:price:currency"]');
            const metaTitle = document.querySelector('meta[property="og:title"]');
            return {
              title: metaTitle?.getAttribute('content') || document.querySelector('h1')?.textContent.trim() || document.title,
              price: val,
              currency: metaCurr?.getAttribute('content') || '$',
              inStock: true
            };
          }
        }

        // Check DOM price elements
        const h1 = document.querySelector('h1')?.textContent.trim() || document.title;
        let price = 0;
        let currency = '$';

        const priceEls = document.querySelectorAll('[itemprop="price"], [class*="price" i], [class*="Price" i], [data-price], span, div, p, b, strong, ins');
        for (const el of priceEls) {
          // Try data attributes first
          const dataPrice = el.getAttribute('content') || el.getAttribute('data-price') || el.getAttribute('data-value');
          if (dataPrice) {
            const val = parseFloat(dataPrice.replace(/,/g, ''));
            if (val > 0) { price = val; break; }
          }

          const txt = el.textContent.trim();
          if (txt.length > 0 && txt.length < 60) {
            const match = txt.match(/[$£€₹]\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/);
            if (match) {
              const numStr = match[0].replace(/[^0-9.,]/g, '').replace(/,/g, '');
              const val = parseFloat(numStr);
              if (val > 0) {
                if (match[0].includes('£')) currency = '£';
                else if (match[0].includes('€')) currency = '€';
                else if (match[0].includes('₹')) currency = '₹';
                price = val;
                break;
              }
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
   * JSON API Execution (e.g. CoinGecko, FakeStoreAPI, public product APIs)
   * Auto-discovers price and title fields from arbitrary JSON structures.
   */
  async executeJsonApi(adapter, startTime) {
    const response = await fetch(adapter.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const jsonData = await response.json();
    return this._processJsonResponse(adapter, jsonData, startTime);
  }

  /**
   * Shared JSON response processor (used by executeJsonApi and auto-detected JSON in executeHttpFetch)
   */
  _processJsonResponse(adapter, jsonData, startTime) {
    let price = 0;
    let itemName = adapter.selectors?.item || adapter.name || '';

    // 1. Use explicit jsonPath if configured
    if (adapter.jsonPath) {
      const parts = adapter.jsonPath.split('.');
      let curr = jsonData;
      for (const p of parts) {
        if (curr && curr[p] !== undefined) curr = curr[p];
      }
      price = typeof curr === 'number' ? curr : parseFloat(curr) || 0;
    }

    // 2. Auto-discover price and title from flat JSON object
    if (!price && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      const priceKeys = ['price', 'cost', 'amount', 'sale_price', 'current_price', 'usd'];
      for (const key of priceKeys) {
        if (jsonData[key] !== undefined) {
          const val = parseFloat(jsonData[key]);
          if (val > 0) { price = val; break; }
        }
      }
      // Nested: e.g. { ethereum: { usd: 2500 } }
      if (!price) {
        for (const val of Object.values(jsonData)) {
          if (typeof val === 'object' && val !== null) {
            for (const k of ['usd', 'price', 'amount']) {
              if (val[k] !== undefined) {
                const p = parseFloat(val[k]);
                if (p > 0) { price = p; break; }
              }
            }
            if (price > 0) break;
          }
        }
      }

      const titleKeys = ['title', 'name', 'product_name', 'item', 'label', 'description'];
      for (const key of titleKeys) {
        if (jsonData[key] && typeof jsonData[key] === 'string') {
          itemName = jsonData[key];
          break;
        }
      }
    }

    let hostname = '';
    try { hostname = new URL(adapter.url).hostname; } catch {}

    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: price > 0,
      adapterId: adapter.id,
      item: itemName || 'API Product',
      price: price > 0 ? parseFloat(price.toFixed(2)) : 0,
      currency: '$',
      inStock: true,
      sku: 'API-LIVE-FEED',
      vendor: adapter.selectors?.vendor || hostname || 'Real-Time API',
      threshold: adapter.threshold,
      triggered: price > 0 && price <= adapter.threshold,
      timestamp: new Date().toISOString(),
      latencyMs,
      tokensConsumed: 0
    };
  }
}

export const adapterEngine = new AdapterEngine();
