/**
 * ==========================================================================
 * CROSS COUNTRY / DOT JEANS CO. - MAIN APPLICATION LOGIC
 * Hero Slider, B2B Inquiry Cart Drawer, Live Search & Lightbox
 * ==========================================================================
 */

// ---------------------------------------------------------------------------
// 1. Hero Carousel Controller (01 / 04 -> 04 / 04)
// ---------------------------------------------------------------------------
const HeroSlider = {
  currentIndex: 0,
  slides: [],
  autoSlideTimer: null,
  autoSlideInterval: 6000,

  init() {
    this.slides = window.AppConfig?.slides || [];
    if (this.slides.length === 0) return;

    this.counterCurrent = document.getElementById("sliderCurrent");
    this.counterTotal = document.getElementById("sliderTotal");
    this.prevBtn = document.getElementById("sliderPrev");
    this.nextBtn = document.getElementById("sliderNext");

    this.heroTag = document.getElementById("heroTag");
    this.heroTitleLine1 = document.getElementById("heroTitleLine1");
    this.heroTitleLine2 = document.getElementById("heroTitleLine2");
    this.heroDescription = document.getElementById("heroDescription");
    this.heroCtaBtn = document.getElementById("heroCtaBtn");

    this.slideItems = document.querySelectorAll(".slide-item");

    if (this.counterTotal) {
      this.counterTotal.textContent = String(this.slides.length).padStart(2, "0");
    }

    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => {
        this.prev();
        this.resetAutoSlide();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => {
        this.next();
        this.resetAutoSlide();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") this.prev();
      if (e.key === "ArrowRight") this.next();
    });

    this.updateSlide(0);
    this.startAutoSlide();
  },

  updateSlide(index) {
    if (index < 0) index = this.slides.length - 1;
    if (index >= this.slides.length) index = 0;
    this.currentIndex = index;

    const data = this.slides[this.currentIndex];

    if (this.counterCurrent) {
      this.counterCurrent.textContent = String(this.currentIndex + 1).padStart(2, "0");
    }

    const heroContent = document.querySelector(".hero-content");
    if (heroContent) {
      heroContent.style.opacity = "0.4";
      heroContent.style.transform = "translateY(4px)";
      heroContent.style.transition = "all 0.25s ease";

      setTimeout(() => {
        if (this.heroTag) this.heroTag.textContent = data.tagline;
        if (this.heroTitleLine1) this.heroTitleLine1.textContent = data.headlineLine1;
        if (this.heroTitleLine2) this.heroTitleLine2.textContent = data.headlineLine2;
        if (this.heroDescription) this.heroDescription.innerHTML = data.description;
        if (this.heroCtaBtn) {
          this.heroCtaBtn.innerHTML = `${data.buttonText} <span class="btn-arrow">&rarr;</span>`;
          this.heroCtaBtn.href = data.buttonLink;
        }

        heroContent.style.opacity = "1";
        heroContent.style.transform = "translateY(0)";
      }, 180);
    }

    this.slideItems.forEach((item, idx) => {
      if (idx === this.currentIndex) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  },

  next() {
    this.updateSlide(this.currentIndex + 1);
  },

  prev() {
    this.updateSlide(this.currentIndex - 1);
  },

  startAutoSlide() {
    this.autoSlideTimer = setInterval(() => {
      this.next();
    }, this.autoSlideInterval);
  },

  resetAutoSlide() {
    clearInterval(this.autoSlideTimer);
    this.startAutoSlide();
  }
};

// ---------------------------------------------------------------------------
// 2. B2B Inquiry Cart Module
// ---------------------------------------------------------------------------
const CartModule = {
  items: [],

  init() {
    this.cartDrawer = document.getElementById("cartDrawer");
    this.cartBackdrop = document.getElementById("cartBackdrop");
    this.cartItemsList = document.getElementById("cartItemsList");
    this.cartTotalEl = document.getElementById("cartGrandTotal");
    this.cartBadge = document.getElementById("cartBadge");

    const cartBtn = document.getElementById("cartBtn");
    const closeBtn = document.getElementById("closeCartBtn");
    const checkoutBtn = document.getElementById("cartCheckoutBtn");

    if (cartBtn) cartBtn.addEventListener("click", () => this.open());
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
    if (this.cartBackdrop) this.cartBackdrop.addEventListener("click", () => this.close());

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        window.WhatsAppModule?.checkoutCart(this.items);
      });
    }

    this.render();
  },

  addItem({ id, name, brand = "Cross Country", fit = "Old Money", size = "30 to 36 (Full Set)", img }) {
    const key = `${id}-${size}`;
    const existing = this.items.find(i => i.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ key, id, name, brand, fit, size, img, qty: 1 });
    }
    this.render();
    this.open();
  },

  changeQty(key, delta) {
    const item = this.items.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.items = this.items.filter(i => i.key !== key);
    }
    this.render();
  },

  getTotalSets() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  },

  open() {
    this.cartDrawer?.classList.add("active");
    this.cartBackdrop?.classList.add("active");
  },

  close() {
    this.cartDrawer?.classList.remove("active");
    this.cartBackdrop?.classList.remove("active");
  },

  render() {
    const totalCount = this.getTotalSets();
    if (this.cartBadge) {
      this.cartBadge.textContent = totalCount;
    }

    if (!this.cartItemsList) return;

    if (this.items.length === 0) {
      this.cartItemsList.innerHTML = `<div class="cart-empty-message">Your B2B inquiry bag is empty.<br><small>Select any Cross Country Old Money trouser to add.</small></div>`;
      if (this.cartTotalEl) this.cartTotalEl.textContent = "0 Sets";
      return;
    }

    let html = "";
    this.items.forEach(item => {
      html += `
        <div class="cart-item-row">
          <img src="${item.img}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-meta">${item.brand} • ${item.fit} Fit</div>
            <div class="cart-item-size">Size: <strong>${item.size}</strong></div>
            <div class="cart-qty-ctrl">
              <button class="qty-btn" onclick="CartModule.changeQty('${item.key}', -1)">-</button>
              <span>${item.qty} Set(s)</span>
              <button class="qty-btn" onclick="CartModule.changeQty('${item.key}', 1)">+</button>
            </div>
          </div>
        </div>
      `;
    });

    this.cartItemsList.innerHTML = html;
    if (this.cartTotalEl) {
      this.cartTotalEl.textContent = `${totalCount} Set(s)`;
    }
  }
};

window.CartModule = CartModule;

// ---------------------------------------------------------------------------
// 3. Search Bar Modal Controller (Live Catalog Filter)
// ---------------------------------------------------------------------------
const SearchController = {
  init() {
    const searchBtn = document.getElementById("searchBtn");
    const searchModal = document.getElementById("searchModal");
    const closeSearch = document.getElementById("closeSearch");
    const searchInput = document.getElementById("searchInput");

    if (searchBtn && searchModal) {
      searchBtn.addEventListener("click", () => {
        searchModal.classList.add("active");
        setTimeout(() => searchInput?.focus(), 100);
      });
    }

    if (closeSearch && searchModal) {
      closeSearch.addEventListener("click", () => {
        searchModal.classList.remove("active");
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        const cards = document.querySelectorAll(".product-card");
        cards.forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(query) ? "flex" : "none";
        });
      });

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          searchModal?.classList.remove("active");
          document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchModal?.classList.remove("active");
        window.Widgets?.closeLightbox();
      }
    });
  }
};

// ---------------------------------------------------------------------------
// 4. Header Scroll & Mobile Menu
// ---------------------------------------------------------------------------
function initNavigation() {
  const header = document.querySelector(".header");
  const mobileToggle = document.getElementById("mobileToggle");
  const navMenu = document.getElementById("navMenu");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });

    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
      });
    });
  }
}

// ---------------------------------------------------------------------------
// 5. DOM Ready Bootstrap
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();
  HeroSlider.init();
  CartModule.init();
  SearchController.init();

  if (window.Widgets) {
    // 1. Load product widgets component if needed
    await window.Widgets.loadProductWidgets("widgets-container");
    // 2. Load dynamic data from Supabase 'WideLeg' table, falling back to local styles if offline
    const loadedFromSupabase = await window.Widgets.loadFromSupabase();
    if (!loadedFromSupabase) {
      window.Widgets.bindSizeSelectors();
      window.Widgets.bindColorFilters();
    }
    // 3. Load external footer component
    await window.Widgets.loadFooter("footer-container");
  }
});
