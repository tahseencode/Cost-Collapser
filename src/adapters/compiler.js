/**
 * Adapter Compiler (Layer 0 -> Layer 2 Compilation)
 * Compiles a visual or mapped web selector into a self-contained, high-performance
 * zero-token deterministic CLI script.
 */
export class AdapterCompiler {
  static compileToScript(adapterConfig) {
    const code = `#!/usr/bin/env node
/**
 * Zero-Token Sentinel Compiled Adapter
 * Target: ${adapterConfig.name || adapterConfig.id}
 * URL: ${adapterConfig.url}
 * Generated: ${new Date().toISOString()}
 */
import * as cheerio from 'cheerio';

async function execute() {
  const start = performance.now();
  try {
    const res = await fetch('${adapterConfig.url}', {
      headers: { 'User-Agent': 'ZeroTokenSentinel-Compiled/1.0' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();
    const $ = cheerio.load(html);

    const rawTitle = $('${adapterConfig.selectors.item}').first().text().trim() || 'Unknown Item';
    const rawPrice = $('${adapterConfig.selectors.price}').first().text().trim() || '0';
    const rawStock = $('${adapterConfig.selectors.inStock || '#stock-status'}').first().text().trim();
    
    const priceMatch = rawPrice.match(/[0-9]+(?:\\.[0-9]{2})?/);
    const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
    const inStock = /in stock|available/i.test(rawStock);

    const output = {
      adapterId: '${adapterConfig.id}',
      item: rawTitle,
      price: price,
      inStock: inStock,
      threshold: ${adapterConfig.threshold || 50.0},
      triggered: price > 0 && price <= ${adapterConfig.threshold || 50.0},
      tokensConsumed: 0,
      executionMs: Math.round(performance.now() - start),
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ error: err.message, tokensConsumed: 0 }));
    process.exit(1);
  }
}

execute();
`;
    return code;
  }
}
