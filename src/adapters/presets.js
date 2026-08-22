export const ADAPTER_PRESETS = {
  'apex-industrial': {
    id: 'apex-industrial',
    name: 'Apex Titan Carbide Drill Bit 5000',
    url: 'http://localhost:4100/products/titan-carbide-drill-5000',
    type: 'html-selector',
    description: 'Local Mock E-Commerce Industrial Supply Store',
    threshold: 50.00,
    selectors: {
      item: '#product-title',
      price: '#product-price',
      currency: '#currency-symbol',
      inStock: '#stock-status',
      sku: '#product-sku',
      vendor: 'Apex Industrial Supply Corp'
    }
  },
  'live-hm-onesie': {
    id: 'live-hm-onesie',
    name: 'H&M (Live E-Commerce) - Newborn Bodysuits',
    url: 'https://www2.hm.com/en_us/productpage.1235070001.html',
    type: 'html-selector',
    description: 'Live H&M US e-commerce product catalog',
    threshold: 15.00,
    selectors: {
      item: 'h1',
      vendor: 'H&M Hennes & Mauritz US'
    }
  },
  'live-books-attic': {
    id: 'live-books-attic',
    name: 'Books Store (Live Web) - A Light in the Attic',
    url: 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    type: 'html-selector',
    description: 'Live public e-commerce bookstore product page',
    threshold: 55.00,
    selectors: {
      item: 'h1',
      price: '.price_color, .product_main .price_color',
      currency: '.price_color',
      inStock: '.instock.availability',
      sku: '.table-striped tr:first-child td',
      vendor: 'Books to Scrape Global Ltd'
    }
  },
  'live-crypto-eth': {
    id: 'live-crypto-eth',
    name: 'Live Ethereum Market Price (CoinGecko API)',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    type: 'json-api',
    description: 'Real-time live Ethereum market price feed',
    threshold: 2800.00,
    jsonPath: 'ethereum.usd',
    selectors: {
      item: 'Ethereum (ETH)',
      vendor: 'CoinGecko Global Crypto Index'
    }
  }
};
