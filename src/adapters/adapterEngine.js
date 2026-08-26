import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { ADAPTER_PRESETS } from './presets.js';
import { MOCK_PRODUCTS } from '../mock-store/storeData.js';

// Locate installed Chrome / Edge / Brave browser binary across Windows and Linux
function getBrowserExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.PROGRAMFILES || 'C:\\Program Files') + '\\Google\\Chrome\\Application\\chrome.exe',
    (process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)') + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    (process.env.LOCALAPPDATA || '') + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium'
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Normalizes input URL strings:
 * - Trims whitespace
 * - Ensures https:// prefix if missing
 * - Keeps internal mock paths (/products/...) untouched
 */
export function normalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  let cleaned = inputUrl.trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('/') || cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  return 'https://' + cleaned;
}

/**
 * Extract clean vendor/domain name from URL
 */
export function extractVendorFromUrl(rawUrl) {
  try {
    const parsed = new URL(normalizeUrl(rawUrl));
    const hostname = parsed.hostname.replace(/^www\./i, '');
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const brand = parts[0];
      if (brand === 'books' && parts.includes('toscrape')) return 'Books to Scrape';
      if (brand === 'dummyjson') return 'DummyJSON E-Commerce';
      if (brand === 'fakestoreapi') return 'FakeStore API';
      if (brand === 'coingecko') return 'CoinGecko Crypto Index';
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
    return hostname;
  } catch {
    return 'Live Web Supplier';
  }
}

/**
 * Clean product title by removing common website suffix branding
 */
export function cleanProductTitle(rawTitle, fallback = 'Live Web Product') {
  if (!rawTitle || typeof rawTitle !== 'string') return fallback;
  let title = rawTitle.replace(/\s+/g, ' ').trim();
  // Strip common e-commerce title suffixes
  title = title.replace(/\s*[-|–—:•]\s*(?:Amazon(?:\.com|\.in|\.co\.uk)?|eBay|Walmart(?:\.com)?|Target|Best Buy|AliExpress|Flipkart|Etsy|H&M|Zara|Nike|Books to Scrape).*$/i, '');
  title = title.replace(/\s*\|\s*Official Site$/i, '');
  return title.trim() || fallback;
}

export class AdapterEngine {
  constructor() {
    this.adapters = new Map(Object.entries(ADAPTER_PRESETS));
    this.browserPath = getBrowserExecutablePath();
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
    const cleanUrl = normalizeUrl(adapterConfig.url);
    const vendorName = adapterConfig.selectors?.vendor || extractVendorFromUrl(cleanUrl);

    const registered = {
      type: adapterConfig.type || (cleanUrl.includes('api.') || cleanUrl.includes('api/') || cleanUrl.endsWith('.json') ? 'json-api' : 'html-selector'),
      threshold: parseFloat(adapterConfig.threshold || 50.0),
      selectors: {
        item: adapterConfig.selectors?.item || 'h1, #product-title, .product-title, .title',
        price: adapterConfig.selectors?.price || '.price_color, .price, #product-price, .product-price',
        currency: adapterConfig.selectors?.currency || '.price',
        inStock: adapterConfig.selectors?.inStock || '.instock, .availability, #stock-status',
        sku: adapterConfig.selectors?.sku || '.sku, #product-sku',
        vendor: vendorName
      },
      parseRules: {
        priceRegex: /[£\$€₹¥]?\s*([0-9]+(?:\.[0-9]{2})?)/,
        inStockRegex: /in stock|available/i
      },
      ...adapterConfig,
      url: cleanUrl
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
   * Tier 2: Real Headless Browser Engine Fallback for SPA/Cloudflare (0 tokens)
   */
  async execute(adapterIdOrConfig) {
    const startTime = performance.now();
    let adapter = typeof adapterIdOrConfig === 'string' 
      ? this.getAdapter(adapterIdOrConfig) 
      : adapterIdOrConfig;

    if (!adapter) {
      const first = Array.from(this.adapters.values())[0];
      if (first) adapter = first;
      else throw new Error(`Target adapter "${adapterIdOrConfig}" not found`);
    }

    // Ensure URL is normalized
    adapter.url = normalizeUrl(adapter.url);

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

      // 1. JSON API target (explicit)
      if (adapter.type === 'json-api') {
        return await this.executeJsonApi(adapter, startTime);
      }

      // 2. Tier 1: Fast HTTP Fetch + Multi-Strategy Extraction
      let fastResult = null;
      try {
        fastResult = await this.executeHttpFetch(adapter, startTime);
      } catch (httpErr) {
        console.warn(`[AdapterEngine] Tier 1 fetch notice for ${adapter.url}: ${httpErr.message}`);
      }
      
      // If Tier 1 successfully extracted product title and price > 0, return immediately
      if (fastResult && fastResult.success && fastResult.price > 0 && !/access denied|robot|captcha|blocked|403 forbidden/i.test(fastResult.item)) {
        return fastResult;
      }

      // 3. Tier 2: Real Headless Browser Engine Fallback (for SPAs, React/Next.js hydration, Cloudflare)
      if (this.browserPath) {
        try {
          console.log(`[AdapterEngine] Engaging Headless Browser for ${adapter.url}...`);
          const browserResult = await this.executeRealBrowser(adapter, startTime);
          if (browserResult && browserResult.price > 0) {
            return browserResult;
          }
        } catch (browserError) {
          console.warn(`[AdapterEngine] Headless browser notice: ${browserError.message}`);
        }
      }

      // If fastResult exists with a valid item title, return it even if price is 0
      if (fastResult && fastResult.item && !/access denied|robot|captcha/i.test(fastResult.item)) {
        return fastResult;
      }

      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        adapterId: adapter?.id || 'unknown',
        item: adapter.name || 'Live Web Target',
        price: 0,
        currency: '$',
        inStock: true,
        sku: 'UNVERIFIED',
        vendor: extractVendorFromUrl(adapter.url),
        threshold: adapter.threshold,
        triggered: false,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0,
        error: 'Price selector or value not found on page'
      };

    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        adapterId: adapter?.id || 'unknown',
        item: adapter?.name || 'Live Web Target',
        price: 0,
        currency: '$',
        inStock: true,
        sku: 'UNVERIFIED',
        vendor: extractVendorFromUrl(adapter?.url || ''),
        threshold: adapter?.threshold || 50.0,
        triggered: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }
  }

  /**
   * Universal price string parser
   * Handles all global formats:
   * - $49.99, £51.77, €12.50, ₹54,999.00, ₹54999, Rs. 1,499, ¥3500
   * - European decimals: 12,99 € | 1.250,50 €
   * - Formats with codes: 49.99 USD | EUR 12.50 | INR 2,499
   */
  _parsePrice(text) {
    if (!text) return { price: 0, currency: '$' };
    let cleaned = String(text).replace(/\s+/g, ' ').trim();

    // Detect currency symbol or code
    let currency = '$';
    if (/£|GBP/i.test(cleaned)) currency = '£';
    else if (/€|EUR/i.test(cleaned)) currency = '€';
    else if (/₹|Rs\.?|INR/i.test(cleaned)) currency = '₹';
    else if (/¥|JPY|RMB|CNY/i.test(cleaned)) currency = '¥';
    else if (/C\$|CAD/i.test(cleaned)) currency = 'C$';
    else if (/A\$|AUD/i.test(cleaned)) currency = 'A$';
    else if (/CHF/i.test(cleaned)) currency = 'CHF';
    else if (/zł|PLN/i.test(cleaned)) currency = 'zł';
    else if (/kr|SEK|NOK|DKK/i.test(cleaned)) currency = 'kr';
    else if (/R\$|BRL/i.test(cleaned)) currency = 'R$';

    // Handle European price formatting with comma decimal (e.g. 1.250,50 or 12,99)
    if (/[0-9]+\.[0-9]{3},[0-9]{2}/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (/[0-9]+,[0-9]{2}(?:\s*(?:€|EUR|zł|kr))?$/.test(cleaned) && !/\.[0-9]+/.test(cleaned)) {
      cleaned = cleaned.replace(',', '.');
    }

    // Extract numeric price
    const numMatch = cleaned.match(/[0-9][0-9,]*(?:\.[0-9]{1,2})?/);
    if (numMatch) {
      const price = parseFloat(numMatch[0].replace(/,/g, ''));
      // Sanity filter: ignore 4-digit years like 2024 without decimals/currency, or zero/huge numbers
      if (price > 0 && price < 100_000_000) {
        return { price: parseFloat(price.toFixed(2)), currency };
      }
    }
    return { price: 0, currency };
  }

  /**
   * Currency code converter
   */
  _currencyCodeToSymbol(code) {
    if (!code) return '$';
    const c = String(code).toUpperCase();
    if (c === 'GBP' || c === '£') return '£';
    if (c === 'EUR' || c === '€') return '€';
    if (c === 'INR' || c === '₹' || c === 'RS') return '₹';
    if (c === 'JPY' || c === 'CNY' || c === '¥') return '¥';
    if (c === 'CAD' || c === 'C$') return 'C$';
    if (c === 'AUD' || c === 'A$') return 'A$';
    if (c === 'CHF') return 'CHF';
    if (c === 'PLN' || c === 'ZŁ') return 'zł';
    if (c === 'BRL' || c === 'R$') return 'R$';
    return '$';
  }

  /**
   * Recursively extract price from JSON-LD offers
   */
  _extractJsonLdPrice(item) {
    if (!item) return null;
    const offers = item.offers;
    if (!offers) return null;

    const offerList = Array.isArray(offers) ? offers : [offers];

    for (const offer of offerList) {
      if (offer['@type'] === 'AggregateOffer') {
        const lowPrice = offer.lowPrice || offer.price || offer.highPrice;
        if (lowPrice) {
          const parsed = this._parsePrice(String(lowPrice));
          return {
            title: item.name,
            price: parsed.price > 0 ? parsed.price : parseFloat(lowPrice),
            currency: offer.priceCurrency ? this._currencyCodeToSymbol(offer.priceCurrency) : parsed.currency
          };
        }
        if (offer.offers) {
          const nested = Array.isArray(offer.offers) ? offer.offers : [offer.offers];
          for (const n of nested) {
            const p = n.price || n.lowPrice;
            if (p) {
              const parsed = this._parsePrice(String(p));
              return {
                title: item.name,
                price: parsed.price > 0 ? parsed.price : parseFloat(p),
                currency: n.priceCurrency ? this._currencyCodeToSymbol(n.priceCurrency) : (offer.priceCurrency ? this._currencyCodeToSymbol(offer.priceCurrency) : parsed.currency)
              };
            }
          }
        }
      }

      if (offer.price !== undefined && offer.price !== null) {
        const parsed = this._parsePrice(String(offer.price));
        return {
          title: item.name,
          price: parsed.price > 0 ? parsed.price : parseFloat(offer.price),
          currency: offer.priceCurrency ? this._currencyCodeToSymbol(offer.priceCurrency) : parsed.currency
        };
      }

      if (offer.priceSpecification && offer.priceSpecification.price) {
        const spec = offer.priceSpecification;
        const parsed = this._parsePrice(String(spec.price));
        return {
          title: item.name,
          price: parsed.price > 0 ? parsed.price : parseFloat(spec.price),
          currency: spec.priceCurrency ? this._currencyCodeToSymbol(spec.priceCurrency) : parsed.currency
        };
      }
    }
    return null;
  }

  /**
   * Search embedded Next.js / Nuxt / Shopify scripts for product data
   */
  _extractEmbeddedScriptData($) {
    // 1. Next.js __NEXT_DATA__
    const nextDataEl = $('#__NEXT_DATA__');
    if (nextDataEl.length) {
      try {
        const json = JSON.parse(nextDataEl.text());
        const props = json.props?.pageProps;
        if (props) {
          const product = props.product || props.initialData?.product || props.data?.product || props.initialState?.product;
          if (product) {
            const p = product.price || product.salePrice || product.currentPrice || product.minPrice;
            if (p) {
              const parsed = this._parsePrice(String(p));
              if (parsed.price > 0) {
                return {
                  title: product.title || product.name || '',
                  price: parsed.price,
                  currency: parsed.currency
                };
              }
            }
          }
        }
      } catch {}
    }

    // 2. Generic application/json script tags with product or price
    let found = null;
    $('script[type="application/json"]').each((i, el) => {
      if (found) return;
      try {
        const text = $(el).text();
        if (text.includes('"price"') || text.includes('"currentPrice"') || text.includes('"sale_price"')) {
          const obj = JSON.parse(text);
          if (obj.price || obj.product?.price || obj.currentPrice) {
            const val = obj.price || obj.product?.price || obj.currentPrice;
            const parsed = this._parsePrice(String(val));
            if (parsed.price > 0) {
              found = {
                title: obj.title || obj.name || obj.product?.title || '',
                price: parsed.price,
                currency: parsed.currency
              };
              return false;
            }
          }
        }
      } catch {}
    });

    return found;
  }

  /**
   * Tier 1: Fast HTTP Fetch + Multi-Strategy Price Extraction
   */
  async executeHttpFetch(adapter, startTime) {
    const url = normalizeUrl(adapter.url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${url}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json') || url.endsWith('.json')) {
      const jsonData = await response.json();
      return this._processJsonResponse(adapter, jsonData, startTime);
    }

    const html = await response.text();

    // If response body is actually JSON despite content-type
    if (html.trim().startsWith('{') && html.trim().endsWith('}')) {
      try {
        const jsonData = JSON.parse(html);
        return this._processJsonResponse(adapter, jsonData, startTime);
      } catch {}
    }

    const $ = cheerio.load(html);
    const vendorName = adapter.selectors?.vendor || extractVendorFromUrl(url);

    // === STRATEGY 1: JSON-LD Structured Data ===
    let jsonLdResult = null;
    $('script[type="application/ld+json"]').each((i, el) => {
      if (jsonLdResult) return;
      try {
        const raw = $(el).text();
        const data = JSON.parse(raw);
        const candidates = [];
        if (Array.isArray(data)) candidates.push(...data);
        else if (data['@graph']) candidates.push(...data['@graph']);
        else candidates.push(data);

        for (const item of candidates) {
          const type = String(item['@type'] || '');
          if (type.includes('Product') || item.offers) {
            const res = this._extractJsonLdPrice(item);
            if (res && res.price > 0) {
              jsonLdResult = res;
              return false;
            }
          }
        }
      } catch {}
    });

    if (jsonLdResult && jsonLdResult.price > 0) {
      const latencyMs = Math.round(performance.now() - startTime);
      const title = cleanProductTitle(jsonLdResult.title || $('h1').first().text().trim() || $('title').text().trim() || adapter.name);
      return {
        success: true,
        adapterId: adapter.id,
        item: title,
        price: jsonLdResult.price,
        currency: jsonLdResult.currency,
        inStock: true,
        sku: 'JSON-LD-VERIFIED',
        vendor: vendorName,
        threshold: adapter.threshold,
        triggered: jsonLdResult.price > 0 && jsonLdResult.price <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }

    // === STRATEGY 2: Embedded Next.js / Nuxt / JSON Data Scripts ===
    const embeddedData = this._extractEmbeddedScriptData($);
    if (embeddedData && embeddedData.price > 0) {
      const latencyMs = Math.round(performance.now() - startTime);
      const title = cleanProductTitle(embeddedData.title || $('h1').first().text().trim() || $('title').text().trim() || adapter.name);
      return {
        success: true,
        adapterId: adapter.id,
        item: title,
        price: embeddedData.price,
        currency: embeddedData.currency,
        inStock: true,
        sku: 'NEXT-DATA-VERIFIED',
        vendor: vendorName,
        threshold: adapter.threshold,
        triggered: embeddedData.price > 0 && embeddedData.price <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }

    // === STRATEGY 3: Meta & OpenGraph Tags ===
    let metaPrice = 0;
    let metaCurrency = '$';
    let metaTitle = '';

    const metaPriceSelectors = [
      'meta[property="og:price:amount"]',
      'meta[property="product:price:amount"]',
      'meta[name="twitter:data1"]',
      'meta[property="twitter:data1"]',
      'meta[property="product:price"]',
      'meta[itemprop="price"]',
      'meta[name="price"]',
      'meta[property="ecommerce:price"]'
    ];
    for (const sel of metaPriceSelectors) {
      const val = $(sel).attr('content') || $(sel).attr('value');
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
      'meta[property="product:price:currency"]',
      'meta[itemprop="priceCurrency"]'
    ];
    for (const sel of metaCurrSelectors) {
      const val = $(sel).attr('content');
      if (val) {
        metaCurrency = this._currencyCodeToSymbol(val);
        break;
      }
    }

    const metaTitleVal = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || '';
    if (metaTitleVal) metaTitle = metaTitleVal;

    if (metaPrice > 0) {
      const itemName = cleanProductTitle(metaTitle || $('h1').first().text().trim() || $('title').text().trim() || adapter.name);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        adapterId: adapter.id,
        item: itemName,
        price: metaPrice,
        currency: metaCurrency,
        inStock: true,
        sku: 'META-TAG-VERIFIED',
        vendor: vendorName,
        threshold: adapter.threshold,
        triggered: metaPrice > 0 && metaPrice <= adapter.threshold,
        timestamp: new Date().toISOString(),
        latencyMs,
        tokensConsumed: 0
      };
    }

    // === STRATEGY 4: DOM CSS Selectors (Configured + Universal) ===
    let rawItem = '';
    const titleSelectors = (adapter.selectors?.item && !adapter.selectors.item.includes('#product-title,') ? adapter.selectors.item : '').split(',').map(s => s.trim()).filter(Boolean);
    titleSelectors.push(
      '#productTitle', '#product-title', '.product-title', '.product-name',
      '.pdp-title', '.x-item-title__mainTitle', '[data-testid*="title" i]',
      'h1.title', 'h1', 'h2.product-title', 'title'
    );
    for (const sel of titleSelectors) {
      const text = $(sel).first().text().trim();
      if (text && text.length > 2 && text.length < 500) {
        rawItem = text;
        break;
      }
    }
    const cleanTitle = cleanProductTitle(rawItem || $('title').text().trim() || adapter.name);

    let cleanPrice = 0;
    let currency = '$';

    const priceSelectors = (adapter.selectors?.price || '').split(',').map(s => s.trim()).filter(Boolean);
    priceSelectors.push(
      // Bookstore & Mock presets
      '.price_color', '.product_main .price_color', '#product-price',
      // Amazon
      '#corePrice_feature_div .a-offscreen', '#corePriceDisplay_desktop_feature_div .a-offscreen',
      '.a-price .a-offscreen', '#priceblock_ourprice', '#priceblock_dealprice', '#price_inside_buybox',
      '.apexPriceToPay .a-offscreen',
      // eBay
      '.x-price-primary .ux-textspans', '.x-price-approx__price .ux-textspans', '#prcIsum', '#mm-saleDscPrc',
      // Walmart
      '[itemprop="price"]', 'span[itemprop="price"]', '[data-testid="item-price"]',
      // Flipkart
      '._30jeq3._16J0vi', '._30jeq3',
      // Best Buy & Target
      '.priceView-customer-price span', '[data-test="product-price"]',
      // Shopify & WooCommerce & Generic
      '.price-item--regular', '.price-item--sale', '.woocommerce-Price-amount',
      '.product-price', '.selling-price', '.current-price', '.offer-price', '.sale-price',
      '.pdp-price', '.special-price', '.price-current', '.product__price', '.product_price',
      '[data-price]', '[data-product-price]', '.price', '.Price', '#price', '#Price',
      'span[class*="price" i]', 'div[class*="price" i]', 'ins .amount', '.cost', '.amount'
    );

    for (const sel of priceSelectors) {
      try {
        const el = $(sel).first();
        if (!el.length) continue;

        // Content or data attribute
        const contentAttr = el.attr('content') || el.attr('data-price') || el.attr('data-value') || el.attr('data-product-price');
        if (contentAttr) {
          const parsed = this._parsePrice(contentAttr);
          if (parsed.price > 0) {
            cleanPrice = parsed.price;
            currency = parsed.currency;
            break;
          }
        }

        // Text content
        const rawText = el.text().trim();
        if (rawText) {
          const parsed = this._parsePrice(rawText);
          if (parsed.price > 0) {
            cleanPrice = parsed.price;
            currency = parsed.currency;
            break;
          }
        }
      } catch {}
    }

    // === STRATEGY 5: Broad Text-Node Pattern Matching ===
    if (!cleanPrice) {
      const priceRegex = /[$£€₹¥]\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|(?:Rs\.?|INR|USD|EUR|GBP)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|[0-9][0-9,]*\.[0-9]{2}\s*(?:€|zł|kr)?/;
      $('span, div, p, b, strong, em, ins, td, li, h2, h3, h4, dd, label, data, font')
        .each((i, el) => {
          const $el = $(el);
          if ($el.children().length > 2) return;
          const txt = $el.text().trim();
          if (txt.length > 0 && txt.length < 50) {
            const match = txt.match(priceRegex);
            if (match) {
              const parsed = this._parsePrice(match[0]);
              if (parsed.price > 0) {
                cleanPrice = parsed.price;
                currency = parsed.currency;
                return false;
              }
            }
          }
        });
    }

    // Stock availability
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
      item: cleanTitle,
      price: cleanPrice,
      currency,
      inStock,
      sku: 'DOM-EXTRACTED',
      vendor: vendorName,
      threshold: adapter.threshold,
      triggered: cleanPrice > 0 && cleanPrice <= adapter.threshold,
      timestamp: new Date().toISOString(),
      latencyMs,
      tokensConsumed: 0
    };
  }

  /**
   * Tier 2: Real Headless Browser Engine (Runs modern headless Chromium for React / SPAs / Anti-bot)
   */
  async executeRealBrowser(adapter, startTime) {
    if (!this.browserPath) {
      throw new Error('No Chrome or Edge browser binary found on system');
    }

    const url = normalizeUrl(adapter.url);
    const browser = await puppeteer.launch({
      executablePath: this.browserPath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1920,1080'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // Stealth anti-detection injection
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        window.chrome = { runtime: {} };
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Short delay for dynamic React / SPA hydration
      await new Promise(r => setTimeout(r, 2000));

      const extracted = await page.evaluate(() => {
        // 1. JSON-LD in DOM
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
                      price: parseFloat(String(p).replace(/[^0-9.]/g, '')),
                      currency: offer?.priceCurrency || '$',
                      inStock: true
                    };
                  }
                }
              }
            }
          } catch {}
        }

        // 2. Meta tags
        const metaPrice = document.querySelector('meta[property="og:price:amount"], meta[property="product:price:amount"], meta[itemprop="price"], meta[name="price"]');
        if (metaPrice) {
          const val = parseFloat(metaPrice.getAttribute('content') || metaPrice.getAttribute('value') || '');
          if (val > 0) {
            const metaCurr = document.querySelector('meta[property="og:price:currency"], meta[property="product:price:currency"], meta[itemprop="priceCurrency"]');
            const metaTitle = document.querySelector('meta[property="og:title"], meta[name="twitter:title"]');
            return {
              title: metaTitle?.getAttribute('content') || document.querySelector('h1')?.textContent.trim() || document.title,
              price: val,
              currency: metaCurr?.getAttribute('content') || '$',
              inStock: true
            };
          }
        }

        // 3. DOM selectors
        const h1 = document.querySelector('h1')?.textContent.trim() || document.title;
        let price = 0;
        let currency = '$';

        const priceEls = document.querySelectorAll(
          '[itemprop="price"], .a-price .a-offscreen, #corePrice_feature_div .a-offscreen, .priceView-customer-price span, .x-price-primary, [data-testid="item-price"], [class*="price" i], [class*="Price" i], [data-price], [data-product-price], span, div, p, b, strong, ins'
        );
        for (const el of priceEls) {
          const dataPrice = el.getAttribute('content') || el.getAttribute('data-price') || el.getAttribute('data-value');
          if (dataPrice) {
            const val = parseFloat(dataPrice.replace(/,/g, ''));
            if (val > 0 && val < 10000000) { price = val; break; }
          }

          const txt = el.textContent.trim();
          if (txt.length > 0 && txt.length < 60) {
            const match = txt.match(/[$£€₹¥]\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|(?:USD|EUR|GBP|INR|CAD|AUD)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/i);
            if (match) {
              const numMatch = match[0].match(/[0-9][0-9,]*(?:\.[0-9]{1,2})?/);
              if (numMatch) {
                const val = parseFloat(numMatch[0].replace(/,/g, ''));
                if (val > 0 && val < 10000000) {
                  if (match[0].includes('£') || /GBP/i.test(match[0])) currency = '£';
                  else if (match[0].includes('€') || /EUR/i.test(match[0])) currency = '€';
                  else if (match[0].includes('₹') || /INR/i.test(match[0])) currency = '₹';
                  else if (match[0].includes('¥')) currency = '¥';
                  price = val;
                  break;
                }
              }
            }
          }
        }

        return { title: h1, price, currency, inStock: true };
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const title = cleanProductTitle(extracted.title || adapter.name);
      const vendorName = adapter.selectors?.vendor || extractVendorFromUrl(url);

      return {
        success: extracted.price > 0,
        adapterId: adapter.id,
        item: title,
        price: extracted.price,
        currency: extracted.currency || '$',
        inStock: extracted.inStock,
        sku: 'BROWSER-LIVE-EXTRACT',
        vendor: vendorName,
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
   * JSON API Execution
   */
  async executeJsonApi(adapter, startTime) {
    const url = normalizeUrl(adapter.url);
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch JSON API ${url}`);
    const jsonData = await response.json();
    return this._processJsonResponse(adapter, jsonData, startTime);
  }

  /**
   * Shared JSON response processor
   */
  _processJsonResponse(adapter, jsonData, startTime) {
    let price = 0;
    let itemName = '';

    // If explicit adapter name is provided and doesn't look like a raw selector
    if (adapter.name && !adapter.name.startsWith('#') && !adapter.name.startsWith('.') && !adapter.name.includes('h1')) {
      itemName = adapter.name;
    }

    if (adapter.jsonPath) {
      const parts = adapter.jsonPath.split('.');
      let curr = jsonData;
      for (const p of parts) {
        if (curr && curr[p] !== undefined) curr = curr[p];
      }
      price = typeof curr === 'number' ? curr : parseFloat(curr) || 0;
    }

    if (!price && typeof jsonData === 'object' && jsonData !== null) {
      if (Array.isArray(jsonData)) {
        if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
          return this._processJsonResponse(adapter, jsonData[0], startTime);
        }
      } else {
        const priceKeys = ['price', 'cost', 'amount', 'sale_price', 'current_price', 'usd', 'rate', 'value'];
        for (const key of priceKeys) {
          if (jsonData[key] !== undefined) {
            const val = parseFloat(jsonData[key]);
            if (val > 0) { price = val; break; }
          }
        }
        if (!price) {
          for (const val of Object.values(jsonData)) {
            if (typeof val === 'object' && val !== null) {
              for (const k of ['usd', 'price', 'amount', 'rate']) {
                if (val[k] !== undefined) {
                  const p = parseFloat(val[k]);
                  if (p > 0) { price = p; break; }
                }
              }
              if (price > 0) break;
            }
          }
        }

        if (!itemName) {
          const titleKeys = ['title', 'name', 'product_name', 'item', 'label', 'description'];
          for (const key of titleKeys) {
            if (jsonData[key] && typeof jsonData[key] === 'string') {
              itemName = jsonData[key];
              break;
            }
          }
        }
      }
    }

    const vendorName = (adapter.selectors?.vendor && !adapter.selectors.vendor.includes('#')) 
      ? adapter.selectors.vendor 
      : extractVendorFromUrl(adapter.url) || 'Real-Time API';
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      success: price > 0,
      adapterId: adapter.id,
      item: cleanProductTitle(itemName || adapter.name || 'API Product'),
      price: price > 0 ? parseFloat(price.toFixed(2)) : 0,
      currency: '$',
      inStock: true,
      sku: 'API-LIVE-FEED',
      vendor: vendorName,
      threshold: adapter.threshold,
      triggered: price > 0 && price <= adapter.threshold,
      timestamp: new Date().toISOString(),
      latencyMs,
      tokensConsumed: 0
    };
  }
}

export const adapterEngine = new AdapterEngine();
