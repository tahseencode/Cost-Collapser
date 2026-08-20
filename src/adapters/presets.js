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
    },
    parseRules: {
      priceRegex: /[£\$€]?\s*([0-9]+(?:\.[0-9]{2})?)/,
      inStockRegex: /in stock/i
    }
  },
  'live-books-velvet': {
    id: 'live-books-velvet',
    name: 'Books Store (Live Web) - Tipping the Velvet',
    url: 'https://books.toscrape.com/catalogue/tipping-the-velvet_999/index.html',
    type: 'html-selector',
    description: 'Live public e-commerce bookstore product page',
    threshold: 50.00,
    selectors: {
      item: 'h1',
      price: '.price_color, .product_main .price_color',
      currency: '.price_color',
      inStock: '.instock.availability',
      sku: '.table-striped tr:first-child td',
      vendor: 'Books to Scrape Global Ltd'
    },
    parseRules: {
      priceRegex: /[£\$€]?\s*([0-9]+(?:\.[0-9]{2})?)/,
      inStockRegex: /in stock/i
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
  'apex-industrial': {
    id: 'apex-industrial',
    name: 'Books Store (Live Web) - A Light in the Attic',
    url: 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    type: 'html-selector',
    description: 'Live public e-commerce product page',
    threshold: 55.00,
    selectors: {
      item: 'h1',
      price: '.price_color',
      currency: '.price_color',
      inStock: '.instock.availability',
      sku: '.table-striped tr:first-child td',
      vendor: 'Books to Scrape Global Ltd'
    }
  }
};
