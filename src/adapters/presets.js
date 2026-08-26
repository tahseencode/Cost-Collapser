import * as cheerio from 'cheerio';

export const ADAPTER_PRESETS = {
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
  'live-books-sapiens': {
    id: 'live-books-sapiens',
    name: 'Books Store (Live Web) - Sapiens',
    url: 'https://books.toscrape.com/catalogue/sapiens-a-brief-history-of-humankind_996/index.html',
    type: 'html-selector',
    description: 'Live public e-commerce bookstore product page',
    threshold: 60.00,
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
  },
  'live-tech-gadgets': {
    id: 'live-tech-gadgets',
    name: 'Tech & Beauty Store (Live Feed) - Essence Mascara',
    url: 'https://dummyjson.com/products/1',
    type: 'json-api',
    description: 'Live public e-commerce API product catalog',
    threshold: 12.00,
    jsonPath: 'price',
    selectors: {
      item: 'Essence Mascara Lash Princess',
      vendor: 'DummyJSON Global Wholesale'
    }
  },
  'apex-industrial': {
    id: 'apex-industrial',
    name: 'Apex Titan Carbide Drill Bit 5000',
    url: '/products/titan-carbide-drill-5000',
    type: 'mock-store',
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
  }
};
