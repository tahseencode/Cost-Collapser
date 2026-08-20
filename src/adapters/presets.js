export const ADAPTER_PRESETS = {
  'apex-industrial': {
    id: 'apex-industrial',
    name: 'Apex Industrial Supply - Titan Carbide Bit',
    url: 'http://localhost:4100/products/titan-carbide-drill-5000',
    type: 'html-selector',
    description: 'Industrial MRO supplier monitoring for high-spec CNC carbide drill bits',
    threshold: 50.00,
    selectors: {
      item: '#product-title',
      price: '#product-price',
      currency: '#currency-symbol',
      inStock: '#stock-status',
      sku: '#product-sku',
      vendor: '#vendor-name',
      specifications: '#product-specs'
    },
    parseRules: {
      priceRegex: /[\$€£]?\s*([0-9]+(?:\.[0-9]{2})?)/,
      inStockRegex: /in stock|available|ready/i
    }
  },
  'grainger-catalog': {
    id: 'grainger-catalog',
    name: 'Industrial Hardware Catalog (Grainger Spec)',
    url: 'http://localhost:4100/products/hydraulic-control-valve-hv90',
    type: 'html-selector',
    description: 'Automated hydraulic control valve pricing for plant engineering',
    threshold: 120.00,
    selectors: {
      item: '.product-name, #product-title',
      price: '.pricing-value, #product-price',
      currency: '.currency-symbol, #currency-symbol',
      inStock: '.inventory-badge, #stock-status',
      sku: '.item-sku, #product-sku',
      vendor: '.manufacturer-name, #vendor-name'
    },
    parseRules: {
      priceRegex: /[\$€£]?\s*([0-9]+(?:\.[0-9]{2})?)/,
      inStockRegex: /in stock|available/i
    }
  },
  'precision-bearings': {
    id: 'precision-bearings',
    name: 'Precision Bearing Dynamics Corp',
    url: 'http://localhost:4100/products/ceramic-spindle-bearing-cb70',
    type: 'html-selector',
    description: 'Ceramic Spindle High-Speed Bearing 7000-Series monitoring',
    threshold: 85.00,
    selectors: {
      item: '#product-title',
      price: '#product-price',
      currency: '#currency-symbol',
      inStock: '#stock-status',
      sku: '#product-sku',
      vendor: '#vendor-name'
    },
    parseRules: {
      priceRegex: /[\$€£]?\s*([0-9]+(?:\.[0-9]{2})?)/,
      inStockRegex: /in stock|available/i
    }
  }
};
