import { Router } from 'express';
import { MOCK_PRODUCTS } from './storeData.js';

export const storeRouter = Router();

// API to list all mock products
storeRouter.get('/api/products', (req, res) => {
  res.json({ success: true, products: Object.values(MOCK_PRODUCTS) });
});

// API to get single product
storeRouter.get('/api/products/:id', (req, res) => {
  const product = MOCK_PRODUCTS[req.params.id];
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true, product });
});

// API to dynamically update product price or stock (triggers flash sale)
storeRouter.post('/api/products/:id/update', (req, res) => {
  const product = MOCK_PRODUCTS[req.params.id];
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { price, inStock } = req.body;
  if (price !== undefined) {
    product.price = parseFloat(price);
    product.priceHistory.push({
      price: product.price,
      timestamp: new Date().toISOString()
    });
  }
  if (inStock !== undefined) {
    product.inStock = Boolean(inStock);
  }

  res.json({ success: true, product, message: `Updated ${product.title} to $${product.price}` });
});

// API to reset product back to base price
storeRouter.post('/api/products/:id/reset', (req, res) => {
  const product = MOCK_PRODUCTS[req.params.id];
  if (!product) return res.status(404).json({ error: 'Product not found' });

  product.price = product.initialPrice;
  product.inStock = true;
  product.priceHistory.push({
    price: product.price,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, product, message: `Reset ${product.title} to $${product.price}` });
});

// HTML Product Page (Rendered for Webcmd zero-token inspection and extraction)
storeRouter.get('/products/:id', (req, res) => {
  const product = MOCK_PRODUCTS[req.params.id] || MOCK_PRODUCTS['titan-carbide-drill-5000'];
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.title} | Apex Industrial Supply</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --accent: #ff8c00;
      --accent-glow: rgba(255, 140, 0, 0.2);
      --text: #f0f6fc;
      --text-muted: #8b949e;
      --green: #3fb950;
      --red: #f85149;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    .header-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 800; color: var(--accent); letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
    .nav-tag { background: #21262d; padding: 4px 10px; border-radius: 20px; font-size: 12px; color: var(--text-muted); }
    .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 1100px; margin: 0 auto; }
    @media (max-width: 800px) { .main-grid { grid-template-columns: 1fr; } }
    .image-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 380px; position: relative; overflow: hidden; }
    .spec-badge { position: absolute; top: 16px; left: 16px; background: rgba(255, 140, 0, 0.15); color: var(--accent); border: 1px solid var(--accent); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .product-graphic { width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(255,140,0,0.2) 0%, rgba(22,27,34,0) 70%); display: flex; align-items: center; justify-content: center; font-size: 72px; }
    .details-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 32px; display: flex; flex-direction: column; gap: 16px; }
    .vendor-pill { font-size: 13px; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    h1 { font-size: 26px; font-weight: 700; line-height: 1.3; color: #fff; }
    .meta-row { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); }
    .price-box { background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin: 12px 0; }
    .price-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .price-wrapper { display: flex; align-items: baseline; gap: 4px; margin-top: 6px; }
    .currency-symbol { font-size: 28px; font-weight: 700; color: var(--accent); }
    .product-price { font-size: 42px; font-weight: 800; color: #fff; letter-spacing: -1px; }
    .original-strike { font-size: 18px; color: var(--text-muted); text-decoration: line-through; margin-left: 12px; }
    .stock-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; width: fit-content; }
    .in-stock { background: rgba(63, 185, 80, 0.15); color: var(--green); border: 1px solid rgba(63, 185, 80, 0.4); }
    .out-of-stock { background: rgba(248, 81, 73, 0.15); color: var(--red); border: 1px solid rgba(248, 81, 73, 0.4); }
    .specs-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .specs-table td { padding: 8px 12px; border-bottom: 1px solid #21262d; }
    .specs-table td:first-child { color: var(--text-muted); width: 40%; }
    
    /* Interactive Judge / Live Demo Controller Drawer */
    .demo-controller { margin-top: 32px; max-width: 1100px; margin-left: auto; margin-right: auto; background: linear-gradient(145deg, #1c2128, #161b22); border: 1px solid var(--accent); border-radius: 12px; padding: 20px 24px; box-shadow: 0 0 20px var(--accent-glow); }
    .demo-title { font-size: 15px; font-weight: 700; color: var(--accent); display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .btn-group { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .btn { padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px; }
    .btn-drop { background: #ff4757; color: white; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4); }
    .btn-drop:hover { background: #ff6b81; transform: translateY(-1px); }
    .btn-reset { background: #2f3542; color: #ced6e0; }
    .btn-reset:hover { background: #57606f; }
    .price-input-group { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .price-input { background: #0d1117; border: 1px solid var(--border); color: #fff; padding: 8px 12px; border-radius: 6px; width: 90px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="logo">⚙️ APEX INDUSTRIAL SUPPLY <span class="nav-tag">Live Target Node</span></div>
    <div class="nav-tag">Zero-Token Target DOM Endpoint: <code>/products/${product.id}</code></div>
  </div>

  <div class="main-grid">
    <div class="image-card">
      <div class="spec-badge">Heavy Industry MRO</div>
      <div class="product-graphic">🔩</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 16px;">SKU: <span id="product-sku">${product.sku}</span></div>
    </div>

    <div class="details-card">
      <div class="vendor-pill" id="vendor-name">${product.vendor}</div>
      <h1 id="product-title">${product.title}</h1>
      
      <div class="meta-row">
        <span>Category: ${product.category}</span>
        <span>•</span>
        <span>Rating: ⭐ ${product.rating} (${product.reviewsCount} verified orders)</span>
      </div>

      <div class="price-box">
        <div class="price-label">Real-Time Catalog Price</div>
        <div class="price-wrapper">
          <span class="currency-symbol" id="currency-symbol">${product.currency}</span>
          <span class="product-price" id="product-price">${product.price.toFixed(2)}</span>
          ${product.price < product.initialPrice ? `<span class="original-strike">$${product.initialPrice.toFixed(2)}</span>` : ''}
        </div>
      </div>

      <div>
        <span class="stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}" id="stock-status">
          ${product.inStock ? `● In Stock (${product.stockCount} units ready to ship)` : '✕ Out of Stock'}
        </span>
      </div>

      <p style="font-size: 13px; color: #c9d1d9; line-height: 1.5; margin-top: 8px;">
        ${product.description}
      </p>

      <div id="product-specs">
        <table class="specs-table">
          <tbody>
            ${Object.entries(product.specifications).map(([k, v]) => `
              <tr>
                <td>${k}</td>
                <td style="color:#f0f6fc; font-weight:500;">${v}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Live Store Price Controller Drawer -->
  <div class="demo-controller">
    <div class="demo-title">
      <span>⚡ Live Store Price Controller (Adjust Catalog Price)</span>
      <span style="font-size:12px; color:#8b949e;">Alert Threshold: $${product.targetThreshold.toFixed(2)}</span>
    </div>
    <div class="btn-group">
      <button class="btn btn-drop" onclick="updatePrice(39.99)">
        📉 Set Price to $39.99 (Triggers Alert)
      </button>
      <button class="btn btn-drop" style="background:#ffa502;" onclick="updatePrice(45.50)">
        🏷️ Set Price to $45.50
      </button>
      <button class="btn btn-reset" onclick="resetPrice()">
        🔄 Reset to Standard ($${product.initialPrice.toFixed(2)})
      </button>
      <div class="price-input-group">
        <span style="font-size: 13px; color: #8b949e;">Custom $:</span>
        <input type="number" step="0.01" id="customPriceInput" class="price-input" value="${product.price}">
        <button class="btn btn-reset" onclick="applyCustomPrice()">Apply</button>
      </div>
    </div>
  </div>


  <script>
    async function updatePrice(newPrice) {
      const res = await fetch('/api/products/${product.id}/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      });
      if (res.ok) window.location.reload();
    }

    async function resetPrice() {
      const res = await fetch('/api/products/${product.id}/reset', { method: 'POST' });
      if (res.ok) window.location.reload();
    }

    function applyCustomPrice() {
      const val = parseFloat(document.getElementById('customPriceInput').value);
      if (!isNaN(val)) updatePrice(val);
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
