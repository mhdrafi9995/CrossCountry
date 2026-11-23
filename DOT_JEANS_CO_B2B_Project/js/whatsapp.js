/**
 * ==========================================================================
 * CROSS COUNTRY / DOT JEANS CO. - WHATSAPP MODULE
 * Direct B2B order routing and catalog inquiry via WhatsApp
 * ==========================================================================
 */

const WhatsAppModule = {
  getNumber() {
    return window.AppConfig?.whatsappNumber || "919876543210";
  },

  getBrand() {
    return window.AppConfig?.brandName || "Cross Country";
  },

  openWhatsApp(message) {
    const phone = this.getNumber();
    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    window.open(url, "_blank");
  },

  // 1. Single Product B2B Inquiry
  sendInquiry(productName, selectedSize = "30 to 36 (Full Set)", extraNote = "") {
    const brand = this.getBrand();
    const fit = window.AppConfig?.defaultFit || "Old Money";

    const message =
      `*B2B Wholesale Inquiry | ${brand}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello Team,\n\n` +
      `I would like to request wholesale pricing & availability for:\n` +
      `• *Brand:* ${brand}\n` +
      `• *Product:* ${productName}\n` +
      `• *Fit:* ${fit}\n` +
      `• *Size:* ${selectedSize}\n` +
      (extraNote ? `• *Note:* ${extraNote}\n` : "") +
      `\nPlease share the B2B rate card and dispatch details.`;

    this.openWhatsApp(message);
  },

  // 2. Full Cart / Inquiry Bag Checkout via WhatsApp
  checkoutCart(cartItems) {
    if (!cartItems || cartItems.length === 0) {
      alert("Your B2B inquiry bag is empty. Add styles to continue.");
      return;
    }

    const brand = this.getBrand();
    let itemsText = "";
    let totalSets = 0;

    cartItems.forEach((item, index) => {
      totalSets += item.qty;
      itemsText +=
        `${index + 1}. *${item.name}*\n` +
        `   Brand: ${item.brand} | Fit: ${item.fit}\n` +
        `   Size: ${item.size} | Qty: ${item.qty} Set(s)\n`;
    });

    const message =
      `*Wholesale B2B Order Inquiry | ${brand}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello Sales Team,\n` +
      `Please share wholesale pricing & stock availability for the following selection:\n\n` +
      `${itemsText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Total Sets:* ${totalSets}\n\n` +
      `Looking forward to your reply.`;

    this.openWhatsApp(message);
  },

  // 3. General Direct Chat
  startDirectChat() {
    const brand = this.getBrand();
    const fit = window.AppConfig?.defaultFit || "Old Money";
    const sizeRange = window.AppConfig?.sizeRangeLabel || "30 to 36";
    const message = `Hello ${brand}, I would like to inquire about your ${fit} Fit collection (Sizes ${sizeRange}) for wholesale/B2B orders.`;
    this.openWhatsApp(message);
  }
};

window.WhatsAppModule = WhatsAppModule;
