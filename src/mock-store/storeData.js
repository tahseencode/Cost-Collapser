export const MOCK_PRODUCTS = {
  'titan-carbide-drill-5000': {
    id: 'titan-carbide-drill-5000',
    title: 'Apex Titan Carbide Drill Bit 5000 (Industrial Grade)',
    sku: 'APX-TCB-5000',
    vendor: 'Apex Industrial Supply Corp',
    category: 'CNC Tooling & Cutting Parts',
    price: 129.99,
    initialPrice: 129.99,
    targetThreshold: 50.00,
    currency: '$',
    inStock: true,
    stockCount: 42,
    rating: 4.9,
    reviewsCount: 128,
    description: 'Ultra-tough Tungsten Carbide end mill with AlTiN nano-composite coating. Engineered for aerospace titanium and hardened tool steel milling at 24,000 RPM.',
    specifications: {
      'Material': 'Solid Micro-Grain Tungsten Carbide',
      'Coating': 'AlTiN Nano-Composite Shield',
      'Flute Count': '4 Flutes Helix 35°',
      'Tolerance': 'h6 Precision Ground (+0.000 / -0.008 mm)',
      'Recommended RPM': '18,000 - 26,000 RPM'
    },
    priceHistory: [
      { price: 129.99, timestamp: new Date(Date.now() - 3600000).toISOString() }
    ]
  },
  'hydraulic-control-valve-hv90': {
    id: 'hydraulic-control-valve-hv90',
    title: 'Grainger-Spec HV-90 Electro-Hydraulic Directional Valve',
    sku: 'GRN-HV-90-PRO',
    vendor: 'FluidPower Systems Int.',
    category: 'Hydraulics & Fluid Power',
    price: 249.00,
    initialPrice: 249.00,
    targetThreshold: 120.00,
    currency: '$',
    inStock: true,
    stockCount: 15,
    rating: 4.8,
    reviewsCount: 74,
    description: 'Proportional 4-way, 3-position directional control valve with integrated digital electronics and 24V DC solenoid coils.',
    specifications: {
      'Operating Pressure': '315 bar (4568 PSI)',
      'Flow Rate': '90 L/min',
      'Voltage': '24V DC Solenoid',
      'Mounting': 'ISO 4401-03-02-0-05 standard'
    },
    priceHistory: [
      { price: 249.00, timestamp: new Date(Date.now() - 3600000).toISOString() }
    ]
  },
  'ceramic-spindle-bearing-cb70': {
    id: 'ceramic-spindle-bearing-cb70',
    title: 'Precision Ceramic Hybrid Spindle Angular Contact Bearing CB-70',
    sku: 'PBD-CB70-HQ',
    vendor: 'Precision Bearing Dynamics Corp',
    category: 'Bearings & Motion Control',
    price: 185.00,
    initialPrice: 185.00,
    targetThreshold: 85.00,
    currency: '$',
    inStock: true,
    stockCount: 28,
    rating: 5.0,
    reviewsCount: 39,
    description: 'Super-precision angular contact ball bearing with silicon nitride (Si3N4) ceramic balls and PEEK cage for ultra-high speed CNC spindles.',
    specifications: {
      'Ball Material': 'Silicon Nitride (Si3N4 Ceramic)',
      'Precision Grade': 'ISO Class 4 / ABEC 7',
      'Max Speed': '42,000 RPM (Oil-Air Lubricated)',
      'Contact Angle': '15° High-Precision'
    },
    priceHistory: [
      { price: 185.00, timestamp: new Date(Date.now() - 3600000).toISOString() }
    ]
  }
};
