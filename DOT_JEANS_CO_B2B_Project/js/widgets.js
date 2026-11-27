/**
 * ==========================================================================
 * CROSS COUNTRY / DOT JEANS CO. - WIDGETS LOADER & RENDERER
 * Supabase Backend ('WideLeg' Table) + Interactive Size Selector + Lightbox
 * ==========================================================================
 */

const Widgets = {
  selectedSizes: {}, // { [productId]: selectedSizeString }

  /**
   * Loads product widgets component into #widgets-container
   */
  async loadProductWidgets(containerId = "widgets-container") {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.children.length > 0) {
      this.bindSizeSelectors();
      this.bindColorFilters();
      return;
    }

    const endpoint = window.AppConfig?.endpoints?.widgets || "widgets/product-widgets.html";
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        container.innerHTML = await response.text();
        this.bindSizeSelectors();
        this.bindColorFilters();
      }
    } catch (e) {
      console.warn("Could not fetch product widgets:", e);
    }
  },

  /**
   * Loads products from Supabase 'WideLeg' table with automatic fallback
   */
  async loadFromSupabase() {
    const client = window.supabaseClient || (window.supabase && window.supabaseUrl && window.supabaseKey
      ? window.supabase.createClient(window.supabaseUrl, window.supabaseKey)
      : null);

    const gridContainer = document.getElementById('supabase-product-grid') || document.getElementById('product-list');
    if (!gridContainer) return false;

    if (!client) {
      console.warn("Supabase client not initialized; rendering local fallback products.");
      this.bindSizeSelectors();
      this.bindColorFilters();
      return false;
    }

    try {
      const tableName = window.AppConfig?.supabase?.tableName || 'WideLeg';
      const { data: products, error } = await client
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn(`Supabase Error (${tableName}):`, error.message);
        this.bindSizeSelectors();
        this.bindColorFilters();
        return false;
      }

      if (!products || products.length === 0) {
        console.info(`Supabase '${tableName}' table is empty, maintaining default products.`);
        this.bindSizeSelectors();
        this.bindColorFilters();
        return false;
      }

      // Sync Supabase records into AppConfig.products
      window.AppConfig.products = products.map((item) => {
        const id = item.id;
        const brand = item.brand || 'Cross Country';
        const category = item.Category || 'Wide Leg';
        const productName = item.product_name || `${brand} — ${category}`;
        const colorName = item.color || 'Ivory White';
        const colorHex = item.color_hex || '#f3f0e6';
        const skuCode = item.Code || item.sku || `CC-${id}`;
        const sizeRange = item.size || '30 to 36';
        const setDetails = item.set_details || '30–36 Set';
        const imageUrl = item.image_url || item.image || `assets/images/${((id - 1) % 4) + 1}.jpg`;
        const isStockOut = item.is_stock_out === true;

        return {
          id,
          brand,
          fit: category,
          name: productName,
          colorName,
          colorHex,
          sku: skuCode,
          sizeRange,
          setDetails,
          image: imageUrl,
          isStockOut,
          badge: isStockOut ? 'Stock Out' : (item.badge || 'Best Seller')
        };
      });

      // Render cards into container
      gridContainer.innerHTML = '';
      window.AppConfig.products.forEach((item) => {
        const badgeHTML = item.isStockOut
          ? `<span class="product-badge" style="background: #dc2626; color: #fff;">Stock Out</span>`
          : `<span class="product-badge">${item.badge}</span>`;

        const actionButtonsHTML = item.isStockOut
          ? `<button type="button" class="btn-card" disabled style="opacity: 0.5; cursor: not-allowed; width: 100%; grid-column: span 2;">Out of Stock</button>`
          : `<button type="button" class="btn-card btn-card-cart" onclick="Widgets.addToCartFromCard(${item.id})">Add to Bag</button>
             <button type="button" class="btn-card btn-card-wa" onclick="Widgets.whatsappFromCard(${item.id})">WhatsApp</button>`;

        const cardHTML = `
          <div class="product-card" data-id="${item.id}" data-color="${item.colorName.toLowerCase()}" style="opacity: ${item.isStockOut ? '0.75' : '1'};">
            <div class="product-thumb" onclick="Widgets.openLightbox('${item.image}', '${item.name}', 'Brand: ${item.brand} • Fit: ${item.fit} • Sizes: ${item.sizeRange}')">
              ${badgeHTML}
              <img src="${item.image}" alt="${item.brand} ${item.fit} ${item.name}" loading="lazy" onerror="this.src='assets/images/1.jpg'">
            </div>
            <div class="product-info">
              <div class="product-brand-row">
                <span class="product-category">${item.brand}</span>
                <span class="product-fit-badge">${item.fit}</span>
              </div>
              <h3 class="product-name">${item.name}</h3>
              <div class="product-color-row">
                <span class="swatch-dot" style="background: ${item.colorHex};"></span>
                <span>${item.colorName} • CODE: ${item.sku}</span>
              </div>
              <div class="size-selector-wrap">
                <div class="size-header">
                  <span>Select Size</span>
                  <span>${item.sizeRange}</span>
                </div>
                <div class="size-pills">
                  <button type="button" class="size-pill active" data-size="${item.sizeRange} (${item.setDetails})">${item.setDetails}</button>
                  <button type="button" class="size-pill" data-size="30">30</button>
                  <button type="button" class="size-pill" data-size="32">32</button>
                  <button type="button" class="size-pill" data-size="34">34</button>
                  <button type="button" class="size-pill" data-size="36">36</button>
                </div>
              </div>
              <div class="product-actions">
                ${actionButtonsHTML}
              </div>
            </div>
          </div>
        `;
        gridContainer.insertAdjacentHTML('beforeend', cardHTML);
      });

      this.bindSizeSelectors();
      this.bindColorFilters();
      console.log(`Successfully loaded ${window.AppConfig.products.length} products from Supabase table '${tableName}'.`);
      return true;
    } catch (e) {
      console.error("Supabase integration error:", e);
      this.bindSizeSelectors();
      this.bindColorFilters();
      return false;
    }
  },

  bindSizeSelectors() {
    const sizePills = document.querySelectorAll(".size-pill");
    sizePills.forEach(pill => {
      pill.addEventListener("click", () => {
        const card = pill.closest(".product-card");
        if (!card) return;
        const productId = Number(card.dataset.id);

        card.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.selectedSizes[productId] = pill.dataset.size;
      });
    });
  },

  bindColorFilters() {
    const filterBtns = document.querySelectorAll(".filter-chip");
    const cards = document.querySelectorAll(".product-card");
    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.dataset.filter.toLowerCase();

        cards.forEach(card => {
          const cardColor = (card.dataset.color || "").toLowerCase();
          if (filter === "all" || cardColor.includes(filter)) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  },

  getSelectedSize(productId) {
    return this.selectedSizes[productId] || "30 to 36 (30–36 Set)";
  },

  addToCartFromCard(productId) {
    const products = window.AppConfig?.products || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.isStockOut) {
      alert("This item is currently Out of Stock.");
      return;
    }

    const size = this.getSelectedSize(productId);
    window.CartModule?.addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      fit: product.fit,
      size: size,
      img: product.image
    });
  },

  whatsappFromCard(productId) {
    const products = window.AppConfig?.products || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const size = this.getSelectedSize(productId);
    window.WhatsAppModule?.sendInquiry(product.name, size, product.isStockOut ? "Checking restock date" : "");
  },

  openLightbox(imageSrc, title, subtitle) {
    const modal = document.getElementById("imageLightbox");
    const imgEl = document.getElementById("lightboxImg");
    const titleEl = document.getElementById("lightboxTitle");
    const subEl = document.getElementById("lightboxSubtitle");

    if (modal && imgEl) {
      imgEl.src = imageSrc;
      imgEl.alt = title;
      if (titleEl) titleEl.textContent = title;
      if (subEl) subEl.textContent = subtitle;
      modal.classList.add("active");
    }
  },

  closeLightbox() {
    document.getElementById("imageLightbox")?.classList.remove("active");
  },

  /**
   * Dynamically loads the external footer component into #footer-container
   */
  async loadFooter(containerId = "footer-container") {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.children.length > 0) return; // already populated with fallback

    const endpoint = window.AppConfig?.endpoints?.footer || "widgets/footer.html";
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        container.innerHTML = await response.text();
        return;
      }
    } catch (e) {
      // If run over file:// or offline, fetch might fail
    }

    // Default template fallback if fetch cannot run over file:// protocol
    if (!container.innerHTML.trim()) {
      container.innerHTML = `
        <footer class="footer" id="about">
          <div class="footer-top">
            <div class="footer-col footer-brand">
              <a href="#" class="brand-logo">
                <div class="logo-monogram">
                  <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 6C13.1634 6 6 11.3726 6 18C6 24.6274 13.1634 30 22 30C28.5 30 34 26.5 36.5 21.5" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/>
                    <path d="M42 6C33.1634 6 26 11.3726 26 18C26 24.6274 33.1634 30 42 30C50.8366 30 58 24.6274 58 18C58 11.3726 50.8366 6 42 6" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="brand-name">
                  <span class="word-cross">CROSS</span>
                  <span class="word-country">COUNTRY</span>
                </div>
              </a>
              <p class="footer-desc">
                CROSS COUNTRY by DOT JEANS COMPANY — Old Money Fit tailored trousers (Sizes 30 to 36) crafted for retail partners and wholesale buyers.
              </p>
            </div>
            <div class="footer-col">
              <h4>Old Money Colors</h4>
              <ul>
                <li><a href="#shop">Ivory White (30–36)</a></li>
                <li><a href="#shop">Olive Khaki (30–36)</a></li>
                <li><a href="#shop">Jet Black (30–36)</a></li>
                <li><a href="#shop">Sand Beige (30–36)</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Wholesale &amp; B2B</h4>
              <ul>
                <li><a href="javascript:void(0)" onclick="WhatsAppModule.startDirectChat()">Distributor Inquiries</a></li>
                <li><a href="javascript:void(0)" onclick="WhatsAppModule.startDirectChat()">Bulk Set Orders (30–36)</a></li>
                <li><a href="javascript:void(0)" onclick="WhatsAppModule.startDirectChat()">Old Money Fit Specs</a></li>
              </ul>
            </div>
            <div class="footer-col" id="contact">
              <h4>Direct Contact</h4>
              <ul>
                <li><a href="mailto:wholesale@dotjeansco.com">wholesale@dotjeansco.com</a></li>
                <li><a href="tel:+919876543210">+91 98765 43210</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 CROSS COUNTRY • DOT JEANS COMPANY. All rights reserved.</p>
            <p>Brand: Cross Country | Fit: Old Money | Sizes: 30 to 36</p>
          </div>
        </footer>
      `;
    }
  }
};

window.Widgets = Widgets;
window.loadDotJeansProducts = () => Widgets.loadFromSupabase();

/**
 * Single Product Card Controller (Reference Design)
 */
const SingleCardBox = {
  selectedSize: "32",

  selectSize(btnEl) {
    const parent = btnEl.closest(".sizes-box-group");
    if (parent) {
      parent.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    }
    btnEl.classList.add("active");
    this.selectedSize = btnEl.dataset.size || "32";
  },

  addToBag() {
    const size = this.selectedSize || "32";
    window.CartModule?.addItem({
      id: "straight-fit",
      name: "Straight Fit Jeans",
      brand: "Cross Country",
      fit: "Straight Fit",
      size: `Size ${size}`,
      img: "assets/images/straight-fit-jeans.jpg"
    });
  },

  sendWhatsAppEnquiry() {
    const size = this.selectedSize || "32";
    const brand = "Cross Country";
    const product = "Straight Fit Jeans";
    const moq = "1 Set (5 Pcs)";
    const colors = "Multiple Colours Available";

    const message =
      `*B2B Wholesale Inquiry | ${brand}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello Sales Team,\n\n` +
      `I would like to inquire about wholesale ordering for:\n` +
      `• *Brand:* ${brand}\n` +
      `• *Product:* ${product}\n` +
      `• *Pack:* ${moq}\n` +
      `• *Available Sizes:* 28, 30, 32, 34\n` +
      `• *Selected Size Focus:* Size ${size}\n` +
      `• *Options:* ${colors}\n\n` +
      `Please share the distributor price list, available colorways, and dispatch terms.`;

    window.WhatsAppModule?.openWhatsApp(message);
  }
};

window.SingleCardBox = SingleCardBox;

/**
 * ==========================================================================
 * Explore Our Categories Controller (Reference Design)
 * ==========================================================================
 */
const CategoryFilter = {
  activeCategory: "all",

  select(category) {
    this.activeCategory = category || "all";

    // Update active state on category cards
    document.querySelectorAll(".category-card").forEach(card => {
      if (card.dataset.category === category) {
        card.classList.add("active-category");
      } else {
        card.classList.remove("active-category");
      }
    });

    // If Wide Leg is selected, open the Full Photos Gallery!
    if (category === "wide-leg") {
      WideLegGallery.open(0);
      return;
    }

    // Smooth scroll down to the product catalog
    const shopEl = document.getElementById("shop") || document.getElementById("future-product");
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: "smooth" });
    }

    // Spotlight matching card if straight fit
    if (category === "straight-fit" || category === "jeans") {
      const card = document.getElementById("straightFitJeansCard");
      if (card) {
        card.style.transition = "all 0.4s ease";
        card.style.transform = "scale(1.02)";
        card.style.boxShadow = "0 18px 40px rgba(0, 0, 0, 0.16)";
        setTimeout(() => {
          card.style.transform = "";
          card.style.boxShadow = "";
        }, 1800);
      }
    }
  }
};

window.CategoryFilter = CategoryFilter;

/**
 * ==========================================================================
 * FAVORITE MODULE (Interactive Wishlist / Heart Toggle)
 * Persists in localStorage and gives animated toast feedback
 * ==========================================================================
 */
const FavoriteModule = {
  storageKey: "cc_b2b_favorites",

  getFavorites() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  isFavorited(codeOrId) {
    const list = this.getFavorites();
    return list.some(item => item.id === codeOrId || item.code === codeOrId);
  },

  toggle(btnEl, productName = "Old Money", productCode = "OLD") {
    const list = this.getFavorites();
    const existingIndex = list.findIndex(item => item.code === productCode || item.name === productName);
    let isNowFavorited = false;

    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      isNowFavorited = false;
      this.showToast(`Removed "${productName}" from favorites`);
    } else {
      list.push({
        id: productCode.toLowerCase(),
        code: productCode,
        name: productName,
        addedAt: new Date().toISOString()
      });
      isNowFavorited = true;
      this.showToast(`Added "${productName}" to favorites! ❤️`);
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn("localStorage not available:", e);
    }

    // Update active class on all buttons in this card
    const cardEl = btnEl ? btnEl.closest(".single-card-box") : null;
    if (cardEl) {
      cardEl.querySelectorAll(".card-fav-btn, .card-inline-fav-btn").forEach(btn => {
        if (isNowFavorited) {
          btn.classList.add("active");
          const textSpan = btn.querySelector(".fav-text");
          if (textSpan) textSpan.textContent = "Favorited";
        } else {
          btn.classList.remove("active");
          const textSpan = btn.querySelector(".fav-text");
          if (textSpan) textSpan.textContent = "Favorite";
        }
      });
    } else if (btnEl) {
      btnEl.classList.toggle("active", isNowFavorited);
    }
  },

  showToast(message) {
    let toast = document.getElementById("favoriteToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "favoriteToast";
      toast.className = "fav-toast";
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span class="fav-toast-heart">♥</span> <span>${message}</span>`;
    toast.classList.add("show");

    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  },

  syncButtons() {
    const list = this.getFavorites();
    const codes = new Set(list.map(i => i.code));
    document.querySelectorAll(".single-card-box").forEach(card => {
      const code = card.dataset.code || "OLD";
      if (codes.has(code)) {
        card.querySelectorAll(".card-fav-btn, .card-inline-fav-btn").forEach(btn => {
          btn.classList.add("active");
          const textSpan = btn.querySelector(".fav-text");
          if (textSpan) textSpan.textContent = "Favorited";
        });
      }
    });
  }
};

window.FavoriteModule = FavoriteModule;

/**
 * ==========================================================================
 * OLD MONEY CARD CONTROLLER
 * Code: OLD | Sizes: 30 to 36 | Badges: New Arrival, Wholesale Only
 * Photos: Jet Black & Sand Beige
 * ==========================================================================
 */
/**
 * ==========================================================================
 * PRODUCT CARD CONTROLLER (Exact Specifications from Reference)
 * Handles Size Selection, Color Swatches, WhatsApp B2B Inquiry, & Add to Bag
 * ==========================================================================
 */
const ProductCardModule = {
  state: {
    featuredCardWide: { code: 'WIDE', title: 'Wide Leg Denim', size: '32', color: 'Vintage Blue', img: 'assets/images/category-wide-leg.jpg' },
    featuredCardStraight: { code: 'STR', title: 'Straight Fit Jeans', size: '32', color: 'Classic Blue', img: 'assets/images/category-straight-fit.jpg' },
    featuredCardOldMoney: { code: 'OLD', title: 'Old Money', size: '32', color: 'Jet Black', img: 'assets/images/old-money-card.jpg' },
    featuredCardLinen: { code: 'LINEN', title: 'Linen Classic Pant', size: '32', color: 'Natural Ivory', img: 'assets/images/category-linen-pant.jpg' },
    featuredCardTracks: { code: 'TRACK', title: 'Athletic Track Pant', size: '32', color: 'Midnight Black', img: 'assets/images/category-tracks.jpg' },
    oldMoneyCard1: { code: 'OLD', title: 'Old Money', size: '32', color: 'Jet Black', img: 'assets/images/old-money-card.jpg' },
    oldMoneyCard2: { code: 'OLD', title: 'Old Money', size: '32', color: 'Sand Beige', img: 'assets/images/old-money-alt.jpg' },
    futureCard1: { code: 'WIDE', title: 'Wide Leg', brand: 'CROSS COUNTRY', pack: '1 Set (6 Pcs)', size: '28 to 34 (Assorted Set)', color: 'Multiple Colours Available', img: 'assets/images/wide-leg-photo-1.jpg' },
    futureCard2: { code: 'WIDE', title: 'Wide Leg', brand: 'CROSS COUNTRY', pack: '1 Set (6 Pcs)', size: '28 to 34 (Assorted Set)', color: 'Multiple Colours Available', img: 'assets/images/wide-leg-photo-2.jpg' },
    futureCard3: { code: 'WIDE', title: 'Wide Leg', brand: 'CROSS COUNTRY', pack: '1 Set (6 Pcs)', size: '28 to 34 (Assorted Set)', color: 'Multiple Colours Available', img: 'assets/images/wide-leg-photo-3.jpg' }
  },

  selectSize(btnEl, cardId) {
    const parent = btnEl.closest(".sizes-box-group");
    if (parent) {
      parent.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    }
    btnEl.classList.add("active");
    const chosenSize = btnEl.dataset.size || "30";
    if (!this.state[cardId]) {
      this.state[cardId] = { size: chosenSize };
    } else {
      this.state[cardId].size = chosenSize;
    }
  },

  switchColor(btnEl, colorKey, cardId) {
    const card = document.getElementById(cardId) || btnEl.closest(".featured-card, .single-card-box");
    if (!card) return;

    const swatchesWrap = btnEl.closest(".swatches-pills");
    if (swatchesWrap) {
      swatchesWrap.querySelectorAll(".color-swatch-btn").forEach(b => b.classList.remove("active"));
      btnEl.classList.add("active");
    }

    const textSpan = btnEl.querySelector("span:not(.swatch-circle)");
    const colorName = textSpan ? textSpan.textContent.trim() : colorKey;

    if (!this.state[cardId]) {
      this.state[cardId] = { color: colorName };
    } else {
      this.state[cardId].color = colorName;
    }

    // Dynamic image swap for Wide Leg / Future Product
    const wideLegMap = {
      tint: 'assets/images/wide-leg-tint.jpg',
      vintage: 'assets/images/wide-leg-tint.jpg',
      black: 'assets/images/wide-leg-black.jpg',
      'washed-black': 'assets/images/wide-leg-black.jpg',
      ice: 'assets/images/wide-leg-light-blue.jpg',
      'ice-blue': 'assets/images/wide-leg-light-blue.jpg',
      indigo: 'assets/images/wide-leg-dark-blue.jpg',
      'deep-indigo': 'assets/images/wide-leg-dark-blue.jpg'
    };

    if (wideLegMap[colorKey]) {
      const imgEl = card.querySelector(".single-card-img, .featured-card-img");
      const newSrc = wideLegMap[colorKey];
      if (imgEl) {
        imgEl.style.opacity = "0.3";
        setTimeout(() => {
          imgEl.src = newSrc;
          imgEl.style.opacity = "1";
        }, 150);
      }
      this.state[cardId].img = newSrc;
      return;
    }

    // Dynamic image swap for Old Money
    if (cardId.toLowerCase().includes("oldmoney")) {
      const imgEl = card.querySelector(".single-card-img, .featured-card-img");
      const isBeige = colorKey === "beige" || colorKey === "sand";
      const newSrc = isBeige ? "assets/images/old-money-alt.jpg" : "assets/images/old-money-card.jpg";
      if (imgEl) {
        imgEl.style.opacity = "0.3";
        setTimeout(() => {
          imgEl.src = newSrc;
          imgEl.style.opacity = "1";
        }, 150);
      }
      this.state[cardId].img = newSrc;
    }
  },

  addToBag(cardId) {
    const item = this.state[cardId] || {
      title: "Wide Leg",
      code: "WIDE",
      brand: "CROSS COUNTRY",
      size: "30",
      color: "Vintage Tint",
      pack: "1 Set (6 Pcs)",
      img: "assets/images/wide-leg-tint.jpg"
    };

    const packText = item.pack || "1 Set (6 Pcs)";

    window.CartModule?.addItem({
      id: `${(item.code || 'wide').toLowerCase()}-${(item.color || 'std').toLowerCase().replace(/\s+/g, '-')}`,
      name: `${item.title} (${item.color || 'Standard'})`,
      brand: item.brand || "CROSS COUNTRY",
      fit: item.title,
      code: item.code || "WIDE",
      size: `Size ${item.size || '30'} (${packText})`,
      img: item.img || "assets/images/wide-leg-tint.jpg"
    });

    FavoriteModule?.showToast(`🛒 Added "${item.title}" (${item.color || 'Standard'}) to bag!`);
  },

  sendWhatsApp(cardId) {
    const item = this.state[cardId] || {
      title: "Wide Leg",
      code: "WIDE",
      brand: "CROSS COUNTRY",
      pack: "1 Set (6 Pcs)",
      size: "28 to 34 (Assorted Set)",
      color: "Multiple Colours Available",
      img: "assets/images/wide-leg-photo-1.jpg"
    };

    const brand = item.brand || "CROSS COUNTRY";
    const product = item.title || "Wide Leg";
    const code = item.code || "WIDE";
    const size = item.size || "28 to 34 (Assorted Set)";
    const color = item.color || "Multiple Colours Available";
    const pack = item.pack || "1 Set (6 Pcs)";

    const message =
      `*B2B Wholesale Inquiry | ${brand}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello Sales Team,\n\n` +
      `I would like to place a wholesale inquiry for:\n` +
      `• *Brand:* ${brand}\n` +
      `• *Product:* ${product}\n` +
      `• *Code:* ${code}\n` +
      `• *Pack:* ${pack} Wholesale\n` +
      `• *Sizes:* ${size}\n` +
      `• *Colours:* ${color}\n\n` +
      `Please provide the wholesale price quotation, MOQ terms, and dispatch schedule.`;

    window.WhatsAppModule?.openWhatsApp(message);
  }
};

window.ProductCardModule = ProductCardModule;
window.OldMoneyModule = ProductCardModule; // Backward compatibility

/**
 * ==========================================================================
 * FEATURED PRODUCTS 3D COVERFLOW CAROUSEL CONTROLLER
 * Matches reference UI: 5-card perspective, active card elevated
 * ==========================================================================
 */
const FeaturedCarousel = {
  currentIndex: 2, // Center card (Old Money Trouser) initially active
  totalCards: 5,

  init() {
    this.cards = Array.from(document.querySelectorAll(".featured-card"));
    this.dots = Array.from(document.querySelectorAll(".featured-page-dot"));
    if (!this.cards.length) return;

    this.totalCards = this.cards.length;
    this.update();

    // Attach click events on each card
    this.cards.forEach((card, idx) => {
      card.addEventListener("click", (e) => {
        // If clicking directly on an interactive button or input inside, do not rotate
        if (
          e.target.closest("button") ||
          e.target.closest(".card-fav-btn") ||
          e.target.closest(".single-card-wa-btn") ||
          e.target.closest(".size-btn") ||
          e.target.closest(".color-swatch-btn") ||
          e.target.closest(".card-inline-fav-btn") ||
          e.target.closest(".card-add-bag-btn")
        ) {
          return;
        }
        this.goTo(idx);
      });
    });

    // Touch swipe support
    const track = document.getElementById("featuredCardsTrack");
    if (track) {
      let touchStartX = 0;
      track.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      track.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (diff > 50) this.prev();
        if (diff < -50) this.next();
      }, { passive: true });
    }
  },

  goTo(targetIndex) {
    if (targetIndex < 0) targetIndex = this.totalCards - 1;
    if (targetIndex >= this.totalCards) targetIndex = 0;
    this.currentIndex = targetIndex;
    this.update();
  },

  next() {
    this.goTo(this.currentIndex + 1);
  },

  prev() {
    this.goTo(this.currentIndex - 1);
  },

  update() {
    if (!this.cards || !this.cards.length) return;

    this.cards.forEach((card, i) => {
      let offset = i - this.currentIndex;
      if (offset < -2) offset += this.totalCards;
      if (offset > 2) offset -= this.totalCards;

      card.classList.remove("is-active", "is-prev", "is-next", "is-far-prev", "is-far-next", "is-hidden");
      card.setAttribute("data-offset", offset);

      if (offset === 0) {
        card.classList.add("is-active");
      } else if (offset === -1) {
        card.classList.add("is-prev");
      } else if (offset === 1) {
        card.classList.add("is-next");
      } else if (offset === -2) {
        card.classList.add("is-far-prev");
      } else if (offset === 2) {
        card.classList.add("is-far-next");
      } else {
        card.classList.add("is-hidden");
      }
    });

    // Update dots
    if (this.dots) {
      this.dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === this.currentIndex);
      });
    }
  }
};

window.FeaturedCarousel = FeaturedCarousel;

/**
 * ==========================================================================
 * WIDE LEG FULL PHOTOS GALLERY CONTROLLER
 * Opens full 8-photo gallery when Wide Leg category is clicked
 * ==========================================================================
 */
const WideLegGallery = {
  photos: [
    { src: 'assets/images/wide-leg-photo-1.jpg', caption: 'Vintage Green-Tint Denim (Profile Wash View)' },
    { src: 'assets/images/wide-leg-photo-2.jpg', caption: 'Vintage Green-Tint Denim (Model Fit View)' },
    { src: 'assets/images/wide-leg-photo-3.jpg', caption: 'Washed Black / Charcoal Denim (Classic Wash)' },
    { src: 'assets/images/wide-leg-photo-4.jpg', caption: 'Ice Light Blue Denim (Summer Wash)' },
    { src: 'assets/images/wide-leg-photo-5.jpg', caption: 'Washed Black Denim (Texture & Pocket View)' },
    { src: 'assets/images/wide-leg-photo-6.jpg', caption: 'Washed Black Denim (Wide Leg Hem & Silhouette)' },
    { src: 'assets/images/wide-leg-photo-7.jpg', caption: 'Ice Light Blue Denim (Model Leg Fit View)' },
    { src: 'assets/images/wide-leg-photo-8.jpg', caption: 'Deep Indigo Denim (Dark Wash Vintage Style)' }
  ],
  currentIndex: 0,

  open(index = 0) {
    this.currentIndex = typeof index === 'number' ? index : 0;
    const modal = document.getElementById('wideLegGalleryModal');
    if (!modal) return;

    this.renderThumbnails();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.update();
  },

  close() {
    const modal = document.getElementById('wideLegGalleryModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  goTo(idx) {
    if (idx < 0) idx = this.photos.length - 1;
    if (idx >= this.photos.length) idx = 0;
    this.currentIndex = idx;
    this.update();
  },

  next() {
    this.goTo(this.currentIndex + 1);
  },

  prev() {
    this.goTo(this.currentIndex - 1);
  },

  renderThumbnails() {
    const thumbsWrap = document.getElementById('wideLegThumbs');
    if (!thumbsWrap || thumbsWrap.children.length > 0) return;

    thumbsWrap.innerHTML = this.photos.map((p, idx) => `
      <div class="wideleg-thumb ${idx === 0 ? 'active' : ''}" onclick="WideLegGallery.goTo(${idx})">
        <img src="${p.src}" alt="Thumb ${idx + 1}" loading="lazy">
      </div>
    `).join('');
  },

  update() {
    const photo = this.photos[this.currentIndex];
    const mainImg = document.getElementById('wideLegMainImg');
    const captionEl = document.getElementById('wideLegCaption');
    const counterEl = document.getElementById('wideLegPhotoCounter');
    const thumbsWrap = document.getElementById('wideLegThumbs');

    if (mainImg) {
      mainImg.style.opacity = '0.3';
      setTimeout(() => {
        mainImg.src = photo.src;
        mainImg.style.opacity = '1';
      }, 120);
    }

    if (captionEl) {
      captionEl.textContent = photo.caption;
    }

    if (counterEl) {
      counterEl.textContent = `${this.currentIndex + 1} / ${this.photos.length}`;
    }

    if (thumbsWrap) {
      const thumbs = thumbsWrap.querySelectorAll('.wideleg-thumb');
      thumbs.forEach((t, i) => {
        if (i === this.currentIndex) {
          t.classList.add('active');
          t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          t.classList.remove('active');
        }
      });
    }
  },

  sendWhatsApp() {
    const photo = this.photos[this.currentIndex] || this.photos[0];
    const message =
      `*B2B Wholesale Inquiry | CROSS COUNTRY*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello Sales Team,\n\n` +
      `I am inquiring about wholesale purchase for:\n` +
      `• *Brand:* CROSS COUNTRY\n` +
      `• *Product:* Wide Leg Denim\n` +
      `• *Code:* WIDE\n` +
      `• *Pack:* 1 Set (6 Pcs) Wholesale\n` +
      `• *Sizes:* 28 to 34 (Assorted)\n` +
      `• *Selected Photo Wash:* ${photo.caption}\n` +
      `• *Colour Availability:* Multiple Colours Available\n\n` +
      `Please provide the wholesale price catalog, MOQ terms, and dispatch schedule.`;

    window.WhatsAppModule?.openWhatsApp(message);
  },

  addToBag() {
    const photo = this.photos[this.currentIndex] || this.photos[0];
    window.CartModule?.addItem({
      id: `wide-leg-${this.currentIndex + 1}`,
      name: `Cross Country Wide Leg (${photo.caption.split('(')[0].trim()})`,
      brand: "CROSS COUNTRY",
      fit: "Wide Leg",
      code: "WIDE",
      size: "Sizes 28 to 34 (1 Set / 6 Pcs)",
      img: photo.src
    });
    FavoriteModule?.showToast(`🛒 Added Wide Leg Set (6 Pcs) to Bag!`);
  }
};

window.WideLegGallery = WideLegGallery;

// Close gallery on Escape key or backdrop click
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") WideLegGallery.close();
  });
}

// Initialize components once DOM is loaded
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      FavoriteModule.syncButtons();
      FeaturedCarousel.init();
    });
  } else {
    FavoriteModule.syncButtons();
    FeaturedCarousel.init();
  }
}

