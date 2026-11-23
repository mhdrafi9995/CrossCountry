/**
 * ==========================================================================
 * CROSS COUNTRY / DOT JEANS CO. - CONFIGURATION
 * Brand: Cross Country | Fit: Old Money | Sizes: 30 to 36
 * Supabase Backend Integration
 * ==========================================================================
 */

const supabaseUrl = 'https://pmrcuuvyqbllgxsnelob.supabase.co';
const supabaseKey = 'sb_publishable_FMyUtQRXi1yGptoBB5SXcg_SES6VcSA';
const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(supabaseUrl, supabaseKey)
  : null;

window.supabaseUrl = supabaseUrl;
window.supabaseKey = supabaseKey;
window.supabaseClient = supabaseClient;

const AppConfig = {
  brandName: "Cross Country",
  subBrand: "DOT JEANS COMPANY",
  website: "www.dotjeansco.com",
  whatsappNumber: "919876543210", // Update with official WhatsApp B2B number
  currency: "INR",
  currencySymbol: "₹",
  defaultFit: "Old Money",
  availableSizes: ["30", "32", "34", "36"],
  sizeRangeLabel: "30 to 36",

  supabase: {
    url: supabaseUrl,
    key: supabaseKey,
    client: supabaseClient,
    tableName: "WideLeg"
  },

  endpoints: {
    widgets: "widgets/product-widgets.html",
    footer: "widgets/footer.html"
  },

  // 4 Products mapped directly to assets/images/1.jpg - 4.jpg
  products: [
    {
      id: 1,
      sku: "CC-OM-01",
      name: "Old Money Pleated Trouser — Ivory White",
      colorName: "Ivory White",
      colorHex: "#f3f0e6",
      brand: "Cross Country",
      fit: "Old Money",
      sizes: ["30", "32", "34", "36"],
      sizeRange: "30 to 36",
      badge: "Best Seller",
      moq: "Set (30–36)",
      image: "assets/images/1.jpg"
    },
    {
      id: 2,
      sku: "CC-OM-02",
      name: "Old Money Pleated Trouser — Olive Khaki",
      colorName: "Olive Khaki",
      colorHex: "#8c7d5b",
      brand: "Cross Country",
      fit: "Old Money",
      sizes: ["30", "32", "34", "36"],
      sizeRange: "30 to 36",
      badge: "Signature",
      moq: "Set (30–36)",
      image: "assets/images/2.jpg"
    },
    {
      id: 3,
      sku: "CC-OM-03",
      name: "Old Money Pleated Trouser — Jet Black",
      colorName: "Jet Black",
      colorHex: "#1c1c1c",
      brand: "Cross Country",
      fit: "Old Money",
      sizes: ["30", "32", "34", "36"],
      sizeRange: "30 to 36",
      badge: "Classic",
      moq: "Set (30–36)",
      image: "assets/images/3.jpg"
    },
    {
      id: 4,
      sku: "CC-OM-04",
      name: "Old Money Pleated Trouser — Sand Beige",
      colorName: "Sand Beige",
      colorHex: "#e4d5bc",
      brand: "Cross Country",
      fit: "Old Money",
      sizes: ["30", "32", "34", "36"],
      sizeRange: "30 to 36",
      badge: "New Arrival",
      moq: "Set (30–36)",
      image: "assets/images/4.jpg"
    }
  ],

  // 4 Hero Slides synced with assets/images/1.jpg - 4.jpg
  slides: [
    {
      id: "01",
      tagline: "CROSS COUNTRY",
      headlineLine1: "WEAR YOUR",
      headlineLine2: "STYLE",
      description: "Old Money Fit • Sizes 30 to 36<br>Ivory White Double-Pleated Trouser.",
      buttonText: "Shop Now",
      buttonLink: "#categories",
      image: "assets/images/1.jpg"
    },
    {
      id: "02",
      tagline: "CROSS COUNTRY",
      headlineLine1: "OLD MONEY",
      headlineLine2: "TAILORING",
      description: "Old Money Fit • Sizes 30 to 36<br>Olive Khaki Double-Pleated Trouser.",
      buttonText: "Explore Fit",
      buttonLink: "#categories",
      image: "assets/images/2.jpg"
    },
    {
      id: "03",
      tagline: "CROSS COUNTRY",
      headlineLine1: "TIMELESS",
      headlineLine2: "BLACK",
      description: "Old Money Fit • Sizes 30 to 36<br>Jet Black Double-Pleated Trouser.",
      buttonText: "View Catalog",
      buttonLink: "#categories",
      image: "assets/images/3.jpg"
    },
    {
      id: "04",
      tagline: "CROSS COUNTRY",
      headlineLine1: "REFINED",
      headlineLine2: "CLASSICS",
      description: "Old Money Fit • Sizes 30 to 36<br>Sand Beige Double-Pleated Trouser.",
      buttonText: "B2B Inquiry",
      buttonLink: "#categories",
      image: "assets/images/4.jpg"
    }
  ]
};

window.AppConfig = AppConfig;
