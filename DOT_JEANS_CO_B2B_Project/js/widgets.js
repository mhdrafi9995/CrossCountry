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

    // Smooth scroll down to the product catalog
    const shopEl = document.getElementById("shop");
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
const OldMoneyModule = {
  state: {
    oldMoneyCard1: {
      size: "32",
      color: "Jet Black",
      img: "assets/images/old-money-card.jpg",
      code: "OLD",
      title: "Old Money"
    },
    oldMoneyCard2: {
      size: "32",
      color: "Sand Beige",
      img: "assets/images/old-money-alt.jpg",
      code: "OLD",
      title: "Old Money"
    }
  },

  selectSize(btnEl, cardId = "oldMoneyCard1") {
    const parent = btnEl.closest(".sizes-box-group");
    if (parent) {
      parent.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    }
    btnEl.classList.add("active");
    const chosenSize = btnEl.dataset.size || "32";

    if (!this.state[cardId]) {
      this.state[cardId] = { size: chosenSize, color: "Jet Black", code: "OLD", title: "Old Money" };
    } else {
      this.state[cardId].size = chosenSize;
    }
  },

  switchColor(btnEl, colorKey, cardId = "oldMoneyCard1") {
    const card = document.getElementById(cardId) || btnEl.closest(".single-card-box");
    if (!card) return;

    // Switch active swatch button
    const swatchesWrap = btnEl.closest(".swatches-pills");
    if (swatchesWrap) {
      swatchesWrap.querySelectorAll(".color-swatch-btn").forEach(b => b.classList.remove("active"));
      btnEl.classList.add("active");
    }

    const imgEl = card.querySelector(".single-card-img");
    const isBeige = colorKey === "beige" || colorKey === "sand";
    const newSrc = isBeige ? "assets/images/old-money-alt.jpg" : "assets/images/old-money-card.jpg";
    const colorName = isBeige ? "Sand Beige" : "Jet Black";

    if (imgEl) {
      imgEl.style.opacity = "0.3";
      imgEl.style.transform = "scale(0.98)";
      setTimeout(() => {
        imgEl.src = newSrc;
        imgEl.style.opacity = "1";
        imgEl.style.transform = "scale(1)";
      }, 150);
    }

    if (!this.state[cardId]) {
      this.state[cardId] = { size: "32", code: "OLD", title: "Old Money" };
    }
    this.state[cardId].color = colorName;
    this.state[cardId].img = newSrc;
  },

  addToBag(cardId = "oldMoneyCard1") {
    const itemState = this.state[cardId] || {
      size: "32",
      color: "Jet Black",
      img: "assets/images/old-money-card.jpg",
      code: "OLD",
      title: "Old Money"
    };

    window.CartModule?.addItem({
      id: `old-money-${itemState.color.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Old Money (${itemState.color})`,
      brand: "Cross Country",
      fit: "Old Money",
      code: "OLD",
      size: `Size ${itemState.size} (Set 30–36)`,
      img: itemState.img || "assets/images/old-money-card.jpg"
    });
  },

  sendWhatsApp(cardId = "oldMoneyCard1") {
    const itemState = this.state[cardId] || {
      size: "32",
      color: "Jet Black",
      code: "OLD",
      title: "Old Money"
    };

    const brand = "CROSS COUNTRY";
    const product = "Old Money";
    const code = "OLD";
    const size = itemState.size || "32";
    const color = itemState.color || "Jet Black";

    const message =
      `*B2B Wholesale Inquiry | ${brand}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello Sales Team,\n\n` +
      `I would like to place a wholesale inquiry for:\n` +
      `• *Brand:* ${brand}\n` +
      `• *Product:* ${product}\n` +
      `• *Code:* ${code}\n` +
      `• *Status:* New Arrival | Wholesale Only\n` +
      `• *Colorway:* ${color}\n` +
      `• *Size Range:* 30 to 36\n` +
      `• *Selected Size Focus:* Size ${size}\n` +
      `• *Wholesale Pack:* 1 Set (5 Pcs)\n\n` +
      `Please provide the wholesale price quotation, MOQ requirements, and dispatch schedule.`;

    window.WhatsAppModule?.openWhatsApp(message);
  }
};

window.OldMoneyModule = OldMoneyModule;

// Initialize favorites syncing once DOM is loaded
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => FavoriteModule.syncButtons());
  } else {
    FavoriteModule.syncButtons();
  }
}

