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

  // 3 Brand Banner Slides (Why Choose Us)
  slides: [
    {
      id: "01",
      title: "Jeans Collection",
      tagline: "why choose us?",
      category: "straight-fit",
      image: "assets/images/banner-1.jpg",
      link: "#categories"
    },
    {
      id: "02",
      title: "Linen Pant Collection",
      tagline: "why choose us?",
      category: "linen-pant",
      image: "assets/images/banner-2.jpg",
      link: "#categories"
    },
    {
      id: "03",
      title: "Shorts Collection",
      tagline: "why choose us?",
      category: "shorts",
      image: "assets/images/banner-3.jpg",
      link: "#categories"
    }
  ]
};

window.AppConfig = AppConfig;
