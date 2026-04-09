import { db, doc, getDoc, setDoc, collection, addDoc } from "./firebase-config.js";

const initApp = () => {
  // Image Optimization Helper
  const optimizeImg = (url, w) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp&w=${w}`;

  // Mobile Nav Toggle
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  const dropdown = document.querySelector(".dropdown");
  
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
    
    // Prevent body scrolling when menu is open
    if(navMenu.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  });

  // Mobile Dropdown Toggle
  dropdown.addEventListener("click", (e) => {
    // Only apply on mobile view
    if (window.innerWidth <= 768) {
      // prevent following link if they just want to open the menu
      if(e.target.classList.contains('nav-link') || e.target.classList.contains('dropdown-icon')){
        e.preventDefault();
        dropdown.classList.toggle("active");
      }
    }
  });

  // Sticky Header with drop shadow
  const header = document.getElementById("header");
  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Search input mock interactions
  const searchInput = document.getElementById("searchInput");
  const searchSuggestions = document.getElementById("searchSuggestions");
  
  // Real-world scenario search filtering
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();
    
    // UI interactions
    if(val.length > 0) {
      searchSuggestions.style.opacity = "1";
      searchSuggestions.style.visibility = "visible";
      searchSuggestions.style.transform = "translateY(0)";
    } else {
      searchSuggestions.style.opacity = "";
      searchSuggestions.style.visibility = "";
      searchSuggestions.style.transform = "";
    }

    // Dynamic filtering of grid
    if (typeof allProducts !== 'undefined' && typeof renderProducts === 'function') {
      if (val === '') {
        // Reset to currently active category
        const activeBtn = document.querySelector(".filter-btn.active");
        const activeFilter = activeBtn ? activeBtn.getAttribute("data-filter") : "all";
        
        if (activeFilter === "all") {
          renderProducts(allProducts);
        } else {
          renderProducts(allProducts.filter(p => p.category === activeFilter));
        }
      } else {
        // Search across title and category
        const searchResults = allProducts.filter(p => 
          p.title.toLowerCase().includes(val) || 
          p.category.toLowerCase().includes(val)
        );
        renderProducts(searchResults);
      }
    }
  });

  // ==========================================
  // SHARED CART LOGIC — FULL SYSTEM
  // ==========================================

  // --- Utility Functions ---
  window.getCart = function() {
    return JSON.parse(localStorage.getItem("premium_cart")) || [];
  };
  const getCart = window.getCart;

  window.saveCart = async function(cartArray) {
    localStorage.setItem("premium_cart", JSON.stringify(cartArray));
    if (window.currentUser) {
      try {
        await setDoc(doc(db, "carts", window.currentUser.uid), { items: cartArray });
      } catch (e) { console.error("Firebase save error", e); }
    }
  };

  window.syncCartWithFirebase = async function(user) {
    const localCart = getCart();
    try {
      const cartRef = doc(db, "carts", user.uid);
      const snap = await getDoc(cartRef);
      let fbCart = [];
      if (snap.exists()) {
        fbCart = snap.data().items || [];
      }
      
      const merged = [...fbCart];
      localCart.forEach(localItem => {
         const existing = merged.find(i => i.id === localItem.id && i.size === localItem.size && i.color === localItem.color);
         if (existing) existing.quantity += localItem.quantity;
         else merged.push(localItem);
      });
      
      await window.saveCart(merged);
      
      updateCartCount();
      renderCartPopup();
      if(window.location.pathname.includes("cart.html")) {
          if(typeof loadCartPage === 'function') loadCartPage();
      }
      if(typeof updateCheckoutSummary === 'function') updateCheckoutSummary();
      
    } catch(e) {
      console.error("Cart sync error", e);
    }
  }

  window.addEventListener('auth-changed', async (e) => {
    const user = e.detail.user;
    if(user) {
       await window.syncCartWithFirebase(user);
    } else {
       updateCartCount();
       renderCartPopup();
       if(window.location.pathname.includes("cart.html")) {
           if(typeof loadCartPage === 'function') loadCartPage();
       }
    }
  });

  // --- Update cart badge count ---
  window.updateCartCount = function() {
    const countEl = document.querySelector(".cart-count");
    if (!countEl) return;
    const total = getCart().reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = total;

    // Bounce animation on badge
    countEl.classList.remove("bounce");
    void countEl.offsetWidth; // reflow trick to restart animation
    countEl.classList.add("bounce");
  };

  // --- Render cart popup contents ---
  window.renderCartPopup = function() {
    const container  = document.getElementById("cartItemsContainer");
    const totalEl    = document.getElementById("cartTotalDisplay");
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <i class="fas fa-shopping-bag"></i>
          <p>Your cart is empty</p>
          <a href="index.html#products" class="browse-link">Browse Products</a>
        </div>
      `;
      if (totalEl) totalEl.textContent = "$0.00";
      return;
    }

    let grandTotal = 0;

    container.innerHTML = cart.map((item, idx) => {
      const lineTotal = item.price * item.quantity;
      grandTotal += lineTotal;
      const shortTitle = item.title.length > 22 ? item.title.substring(0, 22) + "…" : item.title;
      return `
        <div class="cart-item" id="cart-item-${idx}">
          <img src="${optimizeImg(item.image, 100)}" class="cart-item-img" alt="${item.title}" loading="lazy">
          <div class="item-details">
            <p class="item-name" title="${item.title}">${shortTitle}</p>
            <p class="item-meta">${item.size ? item.size + ' · ' : ''}${item.color ? item.color : ''}</p>
            <p class="item-price">$${item.price.toFixed(2)} × ${item.quantity} = <strong>$${lineTotal.toFixed(2)}</strong></p>
          </div>
          <button class="remove-item-btn" onclick="removeFromCart(${idx})" title="Remove"><i class="fas fa-times"></i></button>
        </div>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = "$" + grandTotal.toFixed(2);
  };

  // --- Remove single item by index ---
  window.removeFromCart = function(idx) {
    let cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
    updateCartCount();
    renderCartPopup();
  };

  // --- Add to cart (merge duplicates by id+size+color) ---
  window.addToCart = function(e, productString, qty = 1) {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const product = typeof productString === 'string'
      ? JSON.parse(productString)
      : productString;

    let cart = getCart();
    const existingIdx = cart.findIndex(item =>
      item.id    === product.id &&
      item.size  === (product.size  || null) &&
      item.color === (product.color || null)
    );

    if (existingIdx >= 0) {
      cart[existingIdx].quantity += parseInt(qty);
    } else {
      cart.push({ ...product, quantity: parseInt(qty) });
    }

    saveCart(cart);
    updateCartCount();
    renderCartPopup();

    // Green button feedback
    const btn = e ? e.currentTarget : null;
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = 'Added <i class="fas fa-check" style="margin-left:5px;"></i>';
      btn.style.background = '#32d74b';
      btn.style.color      = '#fff';
      setTimeout(() => {
        btn.innerHTML        = orig;
        btn.style.background = '';
        btn.style.color      = '';
      }, 1500);
    }
  };

  // --- Cart popup toggle (click on cart icon) ---
  const cartToggle = document.getElementById("cartToggle");
  const cartPopup  = document.getElementById("cartPopup");

  if (cartToggle && cartPopup) {
    cartToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      renderCartPopup(); // refresh contents on open
      cartPopup.classList.toggle("open");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!cartToggle.contains(e.target)) {
        cartPopup.classList.remove("open");
      }
    });
  }

  // --- Clear entire cart ---
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      saveCart([]);
      updateCartCount();
      renderCartPopup();
    });
  }

  // Initialize cart on every page load
  updateCartCount();
  renderCartPopup();

  // ==========================================
  // DYNAMIC PRODUCT GRID (FakeStore API)
  // ==========================================
  const productGrid = document.getElementById("productGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");
  let allProducts = [];

  // 1. Initial Loading State
  productGrid.innerHTML = `
    <div class="loading-state">
      <div class="loader-spinner"></div>
      <p>Loading premium products...</p>
    </div>
  `;

  // 2. Fetch Data from API (Robust Async/Await + Caching)
  async function fetchProducts() {
    try {
      // CACHE CHECK: Instant load if available
      const cachedData = localStorage.getItem("premium_products");
      if (cachedData) {
        allProducts = JSON.parse(cachedData);
        renderProducts(allProducts);
        return;
      }

      // NO CACHE: Fetch from API
      const response = await fetch("https://fakestoreapi.com/products");
      
      if (!response.ok) {
        throw new Error("Failed to fetch products from API. Status: " + response.status);
      }

      const data = await response.json();
      allProducts = data;
      
      // Store in CACHE for future loads
      localStorage.setItem("premium_products", JSON.stringify(data));
      
      renderProducts(allProducts);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      productGrid.innerHTML = `
        <div class="loading-state">
          <p style="color: #ff3b30; font-weight: bold; font-size: 20px;">Failed to load products 🚨</p>
          <p style="font-size: 14px; margin-bottom: 15px;">Please check your internet connection and try again.</p>
          <button class="cta-btn primary-btn" onclick="location.reload()">Try Again</button>
        </div>
      `;
    }
  }

  // Initialize
  fetchProducts();

  function renderProducts(products) {
    if(!productGrid) return; // Prevent errors if not on index.html
    productGrid.innerHTML = ""; // Clear existing logic
    
    if (products.length === 0) {
      productGrid.innerHTML = `<div class="loading-state"><p>No products found in this category.</p></div>`;
      return;
    }

    products.forEach(product => {
      const card = document.createElement("div");
      card.classList.add("product-card");
      
      // Calculate star rating logic
      const fullStars = Math.floor(product.rating.rate);
      const starHTML = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

      // Using Premium FAANG Aesthetics with explicit routing link
      const productJSON = JSON.stringify(product).replace(/'/g, "&#39;"); // safe for HTML injection
      
      card.innerHTML = `
        <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex-grow: 1;">
          <div class="product-img-wrapper">
            <img loading="lazy" 
                 src="${optimizeImg(product.image, 400)}" 
                 srcset="${optimizeImg(product.image, 300)} 300w, ${optimizeImg(product.image, 600)} 600w, ${optimizeImg(product.image, 900)} 900w"
                 sizes="(max-width: 768px) 100vw, 30vw"
                 alt="${product.title}">
          </div>
          <div class="product-card-body" style="padding-bottom: 0;">
            <span class="product-category">${product.category}</span>
            <h3 class="product-title" title="${product.title}">${product.title}</h3>
            
            <div class="product-rating">
              <i>${starHTML}</i>
              <span>(${product.rating.count})</span>
            </div>
          </div>
        </a>
        <div class="product-footer" style="padding: 16px 24px 24px; margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
          <span class="product-price">$${product.price.toFixed(2)}</span>
          <button class="add-to-cart-btn" aria-label="Add to cart" onclick='addToCart(event, ${productJSON})'>
            <span style="font-size: 18px;">+</span>
          </button>
        </div>
      `;

      productGrid.appendChild(card);
    });
  }

  // 4. Category Filtering Logic
  if(filterBtns) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        // Manage active classes
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Filter products array
        const filterValue = btn.getAttribute("data-filter");
        
        if (filterValue === "all") {
          renderProducts(allProducts);
        } else {
          const filtered = allProducts.filter(p => p.category === filterValue);
          renderProducts(filtered);
        }
      });
    });
  }
  
  // ==========================================
  // PRODUCT DETAIL PAGE LOGIC
  // ==========================================
  const productDetail = document.getElementById("productDetail");
  
  if(productDetail || window.location.pathname.includes("product.html")) {
    async function loadProductDetail() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      if (!id) {
        document.getElementById("productDetail").innerHTML = `<div class="loading-state"><p>Product not found.</p></div>`;
        return;
      }
      
      try {
        // Fetch specific product by ID
        const res = await fetch(`https://fakestoreapi.com/products/${id}`);
        if(!res.ok) throw new Error("Product fetch failed.");
        const product = await res.json();
        
        // Update breadcrumb
        const breadcrumb = document.getElementById("breadcrumbTitle");
        if(breadcrumb) breadcrumb.textContent = product.title;
        
        displayProductDetail(product);
        
        // As a challenge, load related products
        loadRelatedProducts(product.category, product.id);
        
      } catch(err) {
        console.error(err);
        document.getElementById("productDetail").innerHTML = `
          <div class="loading-state">
            <p style="color: #ff3b30;">Failed to load product details 🚨</p>
            <a href="index.html" class="cta-btn secondary-btn" style="margin-top: 20px;">Return Home</a>
          </div>
        `;
      }
    }
    
    // Determine smart variations based on product category
    function getVariationsForCategory(category) {
      const cat = category.toLowerCase();
      if (cat.includes("clothing") || cat.includes("fashion") || cat.includes("men") || cat.includes("women")) {
        return {
          sizes:  ["XS", "S", "M", "L", "XL", "XXL"],
          colors: ["Black", "White", "Navy", "Grey", "Red"]
        };
      } else if (cat.includes("electronic") || cat.includes("tech")) {
        return {
          sizes:  ["Standard", "Pro", "Max"],
          colors: ["Space Gray", "Silver", "Midnight Black"]
        };
      } else if (cat.includes("jewelry") || cat.includes("accessories")) {
        return {
          sizes:  ["One Size"],
          colors: ["Gold", "Silver", "Rose Gold"]
        };
      }
      return {
        sizes:  ["Small", "Medium", "Large"],
        colors: ["Default", "Black", "White"]
      };
    }

    function displayProductDetail(product) {
      const container = document.getElementById("productDetail");
      
      const fullStars = Math.floor(product.rating.rate);
      const halfStar  = product.rating.rate % 1 >= 0.5;
      const starHTML  = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
      
      const variations = getVariationsForCategory(product.category);

      // Build variation buttons HTML
      const sizeButtons  = variations.sizes.map((s, i) =>
        `<button class="variation-btn ${i === 0 ? 'active' : ''}" data-type="size" data-value="${s}">${s}</button>`
      ).join('');
      
      const colorButtons = variations.colors.map((c, i) =>
        `<button class="variation-btn color-btn ${i === 0 ? 'active' : ''}" data-type="color" data-value="${c}">
          <span class="color-swatch" style="background:${c.toLowerCase().replace(/ /g, '')}"></span>${c}
        </button>`
      ).join('');

      container.innerHTML = `
        <div class="detail-container">

          <!-- Left: Image with Zoom -->
          <div class="detail-img-container" id="zoomContainer">
            <div class="zoom-lens" id="zoomLens"></div>
            <img src="${optimizeImg(product.image, 600)}" 
                 srcset="${optimizeImg(product.image, 400)} 400w, ${optimizeImg(product.image, 800)} 800w, ${optimizeImg(product.image, 1200)} 1200w"
                 sizes="(max-width: 768px) 100vw, 50vw"
                 class="detail-img" id="detailImg" alt="${product.title}" loading="lazy">
          </div>
          <div class="product-gallery">
            <div class="zoom-preview" id="zoomPreview" style="background-image: url('${optimizeImg(product.image, 1200)}');"></div>
          </div>

          <!-- Right: Info -->
          <div class="detail-info">
            <span class="detail-category">${product.category}</span>
            <h2 class="detail-title">${product.title}</h2>

            <div class="detail-rating">
              <span class="star-display">${starHTML}</span>
              <span>${product.rating.rate} / 5 &nbsp;·&nbsp; ${product.rating.count} Reviews</span>
            </div>

            <!-- Live Price Display -->
            <div class="price-block">
              <p class="detail-price" id="currentPrice">$${product.price.toFixed(2)}</p>
              <p class="price-total-label">Total: <strong id="totalPrice">$${product.price.toFixed(2)}</strong></p>
            </div>

            <p class="detail-description">${product.description}</p>

            <!-- Size Variations -->
            <div class="variation-group">
              <label class="variation-label">Size: <span class="selected-label" id="selectedSize">${variations.sizes[0]}</span></label>
              <div class="variation-options" id="sizeOptions">${sizeButtons}</div>
            </div>

            <!-- Color Variations -->
            <div class="variation-group">
              <label class="variation-label">Color: <span class="selected-label" id="selectedColor">${variations.colors[0]}</span></label>
              <div class="variation-options" id="colorOptions">${colorButtons}</div>
            </div>

            <!-- Quantity + Add to Cart -->
            <div class="detail-actions">
              <div class="quantity-selector">
                <button class="qty-btn" id="qtyMinus">−</button>
                <input type="number" id="qty" class="qty-input" value="1" min="1" max="10" readonly>
                <button class="qty-btn" id="qtyPlus">+</button>
              </div>
              <button class="cta-btn primary-btn detail-add-btn" id="detailAddBtn">
                <i class="fas fa-shopping-cart"></i>&nbsp; Add to Cart
              </button>
            </div>

            <!-- Stock indicator -->
            <p class="stock-indicator"><span class="stock-dot"></span> In Stock — Ships within 2-3 business days</p>
          </div>
        </div>

        <!-- Toast Notification -->
        <div class="detail-toast" id="detailToast">
          <i class="fas fa-check-circle"></i>
          <span id="toastMsg">Added to cart!</span>
        </div>
      `;

      // ---- Wire up Interactivity ----
      let basePrice  = product.price;
      let quantity   = 1;
      let selectedSize  = variations.sizes[0];
      let selectedColor = variations.colors[0];

      // 1. Quantity Selector
      document.getElementById("qtyMinus").addEventListener("click", () => {
        if (quantity > 1) {
          quantity--;
          document.getElementById("qty").value = quantity;
          updateLivePrice(basePrice, quantity);
        }
      });

      document.getElementById("qtyPlus").addEventListener("click", () => {
        if (quantity < 10) {
          quantity++;
          document.getElementById("qty").value = quantity;
          updateLivePrice(basePrice, quantity);
        }
      });

      // 2. Live Price Update
      function updateLivePrice(price, qty) {
        const total = (price * qty).toFixed(2);
        document.getElementById("totalPrice").textContent = "$" + total;
      }

      // 3. Variation Selection
      container.querySelectorAll(".variation-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const type  = btn.dataset.type;
          const value = btn.dataset.value;

          // Remove active from siblings
          container.querySelectorAll(`.variation-btn[data-type="${type}"]`).forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          if (type === "size") {
            selectedSize = value;
            document.getElementById("selectedSize").textContent = value;
          } else if (type === "color") {
            selectedColor = value;
            document.getElementById("selectedColor").textContent = value;
          }
        });
      });

      // 4. Add to Cart with full details
      document.getElementById("detailAddBtn").addEventListener("click", (e) => {
        const cartItem = {
          id:       product.id,
          title:    product.title,
          image:    product.image,
          price:    basePrice,
          size:     selectedSize,
          color:    selectedColor,
          quantity: quantity
        };

        let cart = JSON.parse(localStorage.getItem("premium_cart")) || [];
        const existingIndex = cart.findIndex(item => item.id === cartItem.id && item.size === cartItem.size && item.color === cartItem.color);
        if (existingIndex >= 0) {
          cart[existingIndex].quantity += quantity;
        } else {
          cart.push(cartItem);
        }
        localStorage.setItem("premium_cart", JSON.stringify(cart));
        updateCartCount();

        // Animated Toast Notification
        const toast = document.getElementById("detailToast");
        document.getElementById("toastMsg").textContent = `${product.title.substring(0, 30)}... added to cart!`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);

        // Button feedback
        const btn = document.getElementById("detailAddBtn");
        btn.innerHTML = '<i class="fas fa-check"></i>&nbsp; Added!';
        btn.style.background = "#32d74b";
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-shopping-cart"></i>&nbsp; Add to Cart';
          btn.style.background = "";
        }, 1800);
      });

      // 5. Image Magnifier Lens Zoom (Desktop)
      const imgEl    = document.getElementById("detailImg");
      const lens     = document.getElementById("zoomLens");
      const preview  = document.getElementById("zoomPreview");
      const zoomContainer = document.getElementById("zoomContainer");
      const ZOOM    = 2.5;

      function moveLens(e) {
        e.preventDefault();
        const rect   = imgEl.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let x = clientX - rect.left - lens.offsetWidth  / 2;
        let y = clientY - rect.top  - lens.offsetHeight / 2;

        // Clamp lens within image
        x = Math.max(0, Math.min(x, imgEl.offsetWidth  - lens.offsetWidth));
        y = Math.max(0, Math.min(y, imgEl.offsetHeight - lens.offsetHeight));

        lens.style.left = x + "px";
        lens.style.top  = y + "px";

        // Move background in preview
        preview.style.backgroundPosition = `-${x * ZOOM}px -${y * ZOOM}px`;
        preview.style.backgroundSize     = `${imgEl.offsetWidth * ZOOM}px ${imgEl.offsetHeight * ZOOM}px`;
      }

      zoomContainer.addEventListener("mouseenter", () => {
        lens.style.display    = "block";
        preview.style.display = "block";
      });

      zoomContainer.addEventListener("mouseleave", () => {
        lens.style.display    = "none";
        preview.style.display = "none";
      });

      zoomContainer.addEventListener("mousemove", moveLens);
    }
    
    async function loadRelatedProducts(category, currentId) {
      const relatedGrid = document.getElementById("relatedProductsGrid");
      if(!relatedGrid) return;
      
      const cachedData = localStorage.getItem("premium_products");
      let all = [];
      
      if(cachedData) {
        all = JSON.parse(cachedData);
      } else {
        const res = await fetch("https://fakestoreapi.com/products");
        all = await res.json();
      }
      
      // Filter out current product and grab exactly 4 items in same category
      const related = all.filter(p => p.category === category && p.id !== currentId).slice(0, 4);
      
      if(related.length === 0) {
        document.querySelector('.related-products').style.display = 'none';
        return;
      }
      
      relatedGrid.innerHTML = "";
      
      related.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("product-card");
        
        const productJSON = JSON.stringify(product).replace(/'/g, "&#39;");
        const fullStars = Math.floor(product.rating.rate);
        const starHTML = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  
        card.innerHTML = `
          <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex-grow: 1;">
            <div class="product-img-wrapper">
              <img loading="lazy" 
                   src="${optimizeImg(product.image, 200)}" 
                   srcset="${optimizeImg(product.image, 200)} 200w, ${optimizeImg(product.image, 400)} 400w"
                   sizes="200px"
                   alt="${product.title}">
            </div>
            <div class="product-card-body" style="padding-bottom: 0;">
              <span class="product-category">${product.category}</span>
              <h3 class="product-title" title="${product.title}">${product.title}</h3>
              
              <div class="product-rating">
                <i>${starHTML}</i>
                <span>(${product.rating.count})</span>
              </div>
            </div>
          </a>
          <div class="product-footer" style="padding: 16px 24px 24px; margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button class="add-to-cart-btn" aria-label="Add to cart" onclick='addToCart(event, ${productJSON})'>
              <span style="font-size: 18px;">+</span>
            </button>
          </div>
        `;
        relatedGrid.appendChild(card);
      });
    }
    
    // Execute on page load
    loadProductDetail();
  }

  // ==========================================
  // CART PAGE LOGIC (cart.html)
  // ==========================================
  const cartPageItems = document.getElementById("cartPageItems");

  if (cartPageItems || window.location.pathname.includes("cart.html")) {

    let cartDiscount = 0; // discount multiplier from promo code

    const PROMO_CODES = {
      "SAVE10":  0.10,
      "SHOPX20": 0.20,
      "WELCOME": 0.05
    };

    // --- Render full cart page ---
    function loadCartPage() {
      const container = document.getElementById("cartPageItems");
      if (!container) return;

      const cart = getCart();

      if (cart.length === 0) {
        container.innerHTML = `
          <div class="cart-empty-state">
            <i class="fas fa-shopping-bag"></i>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything yet.</p>
            <a href="index.html#products" class="cta-btn primary-btn" style="text-decoration:none;">
              Start Shopping
            </a>
          </div>
        `;
        updateSummary(cart);
        const checkoutBtn = document.getElementById("checkoutBtn");
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
      }

      container.innerHTML = `
        <div class="cart-items-panel-header">
          <span>Product</span>
          <span>Price</span>
          <span>Quantity</span>
          <span>Total</span>
        </div>
        ${cart.map((item, idx) => {
          const lineTotal = (item.price * item.quantity).toFixed(2);
          const shortTitle = item.title.length > 40 ? item.title.substring(0, 40) + "…" : item.title;
          const metaParts = [item.size, item.color].filter(Boolean).join(" · ");
          return `
            <div class="cart-page-item" id="cart-row-${idx}">
              <div class="cart-product-info">
                <img src="${optimizeImg(item.image, 150)}" class="cart-product-img" alt="${item.title}" loading="lazy">
                <div class="cart-product-text">
                  <h4>${shortTitle}</h4>
                  ${metaParts ? `<p class="cart-meta">${metaParts}</p>` : ''}
                  <button class="cart-page-remove-btn" onclick="removeCartItem(${idx})">
                    <i class="fas fa-trash-alt"></i> Remove
                  </button>
                </div>
              </div>
              <div class="cart-unit-price">$${item.price.toFixed(2)}</div>
              <div class="cart-qty-stepper">
                <button class="cart-qty-btn" onclick="changeCartQty(${idx}, -1)">−</button>
                <span class="cart-qty-display">${item.quantity}</span>
                <button class="cart-qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
              </div>
              <div class="cart-line-total">$${lineTotal}</div>
            </div>
          `;
        }).join('')}
      `;

      updateSummary(cart);

      const checkoutBtn = document.getElementById("checkoutBtn");
      if (checkoutBtn) checkoutBtn.disabled = false;
    }

    // --- Update order summary panel ---
    function updateSummary(cart) {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discounted = subtotal * (1 - cartDiscount);
      const tax       = discounted * 0.08;
      const total     = discounted + tax;

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set("summarySubtotal", "$" + subtotal.toFixed(2));
      set("summaryTax",      "$" + tax.toFixed(2));
      set("summaryTotal",    "$" + total.toFixed(2));

      const shippingEl = document.getElementById("summaryShipping");
      if (shippingEl) {
        shippingEl.textContent = subtotal >= 50 ? "FREE" : "$5.99";
        shippingEl.className   = subtotal >= 50 ? "shipping-free" : "";
      }
    }

    // --- Quantity change ---
    window.changeCartQty = function(idx, delta) {
      let cart = getCart();
      if (!cart[idx]) return;
      cart[idx].quantity = Math.max(1, Math.min(10, cart[idx].quantity + delta));
      saveCart(cart);
      loadCartPage();
      updateCartCount();
      renderCartPopup();
    };

    // --- Remove item ---
    window.removeCartItem = function(idx) {
      let cart = getCart();
      cart.splice(idx, 1);
      saveCart(cart);
      loadCartPage();
      updateCartCount();
      renderCartPopup();
    };

    // --- Promo code ---
    const promoBtn = document.getElementById("promoBtn");
    if (promoBtn) {
      promoBtn.addEventListener("click", () => {
        const code     = (document.getElementById("promoInput").value || "").trim().toUpperCase();
        const feedback = document.getElementById("promoFeedback");
        const discount = PROMO_CODES[code];
        if (discount) {
          cartDiscount = discount;
          feedback.textContent = `✓ "${code}" applied — ${discount * 100}% off!`;
          feedback.className   = "promo-feedback success";
        } else {
          cartDiscount = 0;
          feedback.textContent = "Invalid promo code. Try SAVE10 or SHOPX20.";
          feedback.className   = "promo-feedback error";
        }
        updateSummary(getCart());
      });
    }

    // --- Checkout ---
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        if (getCart().length === 0) return;
        alert("🎉 Thank you for shopping with ShopX!\nOrder placed successfully.");
        saveCart([]);
        updateCartCount();
        renderCartPopup();
        loadCartPage();
      });
    }

    // Run on page load
    loadCartPage();
  }

  // ==========================================
  // CHECKOUT PAGE LOGIC (checkout.html)
  // ==========================================
  const checkoutContainer = document.querySelector(".checkout-container");

  if (checkoutContainer || window.location.pathname.includes("checkout.html")) {
    let currentStep = 1;
    const cart = getCart();
    let shippingCost = 0; // Default to free if standard selected
    
    // Auto-redirect if cart is empty and trying to view checkout
    if (cart.length === 0) {
      alert("Your cart is empty. Redirecting to home.");
      window.location.href = "index.html";
    }

    // --- DOM Elements ---
    const stepIndicators = [
      document.getElementById("step-indicator-1"),
      document.getElementById("step-indicator-2"),
      document.getElementById("step-indicator-3")
    ];
    const stepLines = [
      document.getElementById("line-1-2"),
      document.getElementById("line-2-3")
    ];
    const stepPanels = [
      document.getElementById("step-panel-1"),
      document.getElementById("step-panel-2"),
      document.getElementById("step-panel-3"),
      document.getElementById("step-panel-success") // 4th panel for success
    ];

    // Buttons
    const toPaymentBtn = document.getElementById("toPaymentBtn");
    const backToShippingBtn = document.getElementById("backToShippingBtn");
    const toReviewBtn = document.getElementById("toReviewBtn");
    const backToPaymentBtn = document.getElementById("backToPaymentBtn");
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    const shippingError = document.getElementById("shippingError");
    const paymentError = document.getElementById("paymentError");

    // --- Order Summary ---
    function updateCheckoutSummary() {
      const summaryItemsContainer = document.getElementById("checkoutSummaryItems");
      if (!summaryItemsContainer) return;

      let subtotal = 0;
      
      summaryItemsContainer.innerHTML = cart.map(item => {
        subtotal += item.price * item.quantity;
        return `
          <div class="checkout-summary-item">
            <img src="${optimizeImg(item.image, 150)}" alt="${item.title}" class="checkout-summary-img" loading="lazy">
            <div class="checkout-summary-name">${item.title}</div>
            <div style="font-size: 12px; color: #888;">Qty: ${item.quantity}</div>
            <div class="checkout-summary-price">$${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        `;
      }).join("");

      const tax = subtotal * 0.08;
      
      // Update shipping cost based on selection
      const selectedShipping = document.querySelector('input[name="shipping"]:checked');
      if (selectedShipping) {
        if (selectedShipping.value === "free") shippingCost = 0;
        else if (selectedShipping.value === "express") shippingCost = 9.99;
        else if (selectedShipping.value === "overnight") shippingCost = 19.99;
      }

      const total = subtotal + tax + shippingCost;

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
      set("coSubtotal", "$" + subtotal.toFixed(2));
      set("coTax", "$" + tax.toFixed(2));
      
      const shippingEl = document.getElementById("coShipping");
      if (shippingEl) {
        shippingEl.textContent = shippingCost === 0 ? "FREE" : "$" + shippingCost.toFixed(2);
        shippingEl.className = shippingCost === 0 ? "shipping-free" : "";
      }

      set("coTotal", "$" + total.toFixed(2));
      
      // Build Review Step summary data as well if on that step
      renderReviewStep(subtotal, tax, total);
    }

    // Initialize summary once
    updateCheckoutSummary();

    // --- Shipping Options Listeners ---
    const shippingRadios = document.querySelectorAll('input[name="shipping"]');
    shippingRadios.forEach(radio => {
      radio.addEventListener("change", (e) => {
        document.querySelectorAll(".shipping-option").forEach(opt => opt.classList.remove("selected"));
        e.target.closest(".shipping-option").classList.add("selected");
        updateCheckoutSummary();
      });
    });

    // --- Step Navigation Functions ---
    function goToStep(stepNumber) {
      // Hide all panels
      stepPanels.forEach(p => { if (p) p.classList.remove("active"); });
      
      if (stepNumber <= 3) {
        // Show target panel
        if (stepPanels[stepNumber - 1]) stepPanels[stepNumber - 1].classList.add("active");
        
        // Update indicators
        stepIndicators.forEach((ind, idx) => {
          if (!ind) return;
          ind.classList.remove("active", "done");
          if (idx < stepNumber - 1) ind.classList.add("done");
          else if (idx === stepNumber - 1) ind.classList.add("active");
        });

        // Update lines
        stepLines.forEach((line, idx) => {
          if (!line) return;
          line.classList.remove("done");
          if (idx < stepNumber - 1) line.classList.add("done");
        });
        
        currentStep = stepNumber;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function showSuccess() {
      // Hide standard step panels & summary
      stepPanels.forEach(p => { if (p) p.classList.remove("active"); });
      document.getElementById("checkoutSteps").style.display = "none";
      document.getElementById("checkoutSummaryPanel").style.display = "none";
      document.querySelector(".checkout-layout").style.gridTemplateColumns = "1fr";
      
      // Show success
      stepPanels[3].classList.add("active");
      
      // Populate order ref & email
      document.getElementById("confirmEmail").textContent = document.getElementById("email").value || "your email";
      document.getElementById("orderRef").textContent = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Clear Cart
      saveCart([]);
      updateCartCount();
      renderCartPopup();
    }

    // Validation helpers
    function validateShipping() {
      const requiredIds = ["firstName", "lastName", "email", "address", "city", "state", "zip", "country"];
      let isValid = true;
      requiredIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
          isValid = false;
          el.style.borderColor = "#ff3b30";
        } else if (el) {
          el.style.borderColor = "#e1e1e1"; // reset
        }
      });
      return isValid;
    }

    function validatePayment() {
      // Basic check based on active tab
      const activeTab = document.querySelector(".pay-tab.active").dataset.tab;
      let isValid = true;
      
      if (activeTab === "card") {
        const requiredIds = ["cardNumber", "cardName", "cardExpiry", "cardCVV"];
        requiredIds.forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.value.trim()) {
            isValid = false;
            el.style.borderColor = "#ff3b30";
          } else if (el) {
            el.style.borderColor = "#e1e1e1";
          }
        });
      } else if (activeTab === "upi") {
         const upi = document.getElementById("upiId");
         if(upi && !upi.value.trim()) {
            isValid = false;
            upi.style.borderColor = "#ff3b30";
         } else if(upi) {
            upi.style.borderColor = "#e1e1e1";
         }
      }
      return isValid;
    }

    // --- Buttons Event Listeners ---
    if (toPaymentBtn) {
      toPaymentBtn.addEventListener("click", () => {
        if (validateShipping()) {
          shippingError.style.display = "none";
          goToStep(2);
        } else {
          shippingError.textContent = "Please fill in all required fields.";
          shippingError.style.display = "block";
        }
      });
    }

    if (backToShippingBtn) {
      backToShippingBtn.addEventListener("click", () => goToStep(1));
    }

    if (toReviewBtn) {
      toReviewBtn.addEventListener("click", () => {
        if (validatePayment()) {
          paymentError.style.display = "none";
          updateCheckoutSummary(); // make sure review data is fresh
          goToStep(3);
        } else {
          paymentError.textContent = "Please complete your payment details.";
          paymentError.style.display = "block";
        }
      });
    }

    if (backToPaymentBtn) {
      backToPaymentBtn.addEventListener("click", () => goToStep(2));
    }

    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", async () => {
        // Change button state
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        placeOrderBtn.disabled = true;
        
        const cart = window.getCart();
        const orderData = {
           items: cart,
           total: parseFloat(document.getElementById("coTotal").textContent.replace('$','')),
           date: new Date().toISOString(),
           userEmail: window.currentUser ? window.currentUser.email : document.getElementById("email").value,
           userId: window.currentUser ? window.currentUser.uid : "guest"
        };
        
        try {
           if(window.currentUser) {
              await addDoc(collection(db, "orders"), orderData);
           } else {
              // Simulate API call for guest
              await new Promise(resolve => setTimeout(resolve, 1500));
           }
           showSuccess();
        } catch(e) {
           console.error(e);
           alert("Checkout failed. Please try again.");
           placeOrderBtn.innerHTML = 'Place Order Securely';
           placeOrderBtn.disabled = false;
        }
      });
    }

    // --- Payment Tabs ---
    const payTabs = document.querySelectorAll(".pay-tab");
    const payContents = document.querySelectorAll(".pay-tab-content");
    payTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        payTabs.forEach(t => t.classList.remove("active"));
        payContents.forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
      });
    });

    // --- Live Card Preview Logic ---
    const cNumInput = document.getElementById("cardNumber");
    const cNumDisplay = document.getElementById("cardNumDisplay");
    if (cNumInput) {
      cNumInput.addEventListener("input", (e) => {
        // auto format spaces
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
        e.target.value = formatted;
        cNumDisplay.textContent = formatted || "•••• •••• •••• ••••";
      });
    }

    const cNameInput = document.getElementById("cardName");
    const cNameDisplay = document.getElementById("cardHolderDisplay");
    if (cNameInput) {
      cNameInput.addEventListener("input", (e) => {
        cNameDisplay.textContent = e.target.value || "FULL NAME";
      });
    }

    const cExpInput = document.getElementById("cardExpiry");
    const cExpDisplay = document.getElementById("cardExpiryDisplay");
    if (cExpInput) {
      cExpInput.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (val.length >= 2 && !val.includes('/')) {
            val = val.substring(0, 2) + '/' + val.substring(2);
        }
        e.target.value = val;
        cExpDisplay.textContent = val || "MM/YY";
      });
    }

    // --- Render Review Step Data ---
    function renderReviewStep(subtotal, tax, total) {
      const reviewShipping = document.getElementById("reviewShipping");
      const reviewPayment = document.getElementById("reviewPayment");
      const reviewItems = document.getElementById("reviewItems");

      if (!reviewShipping || !reviewPayment || !reviewItems) return;

      // 1. Shipping info
      const name = `${document.getElementById("firstName").value} ${document.getElementById("lastName").value}`;
      const address = document.getElementById("address").value;
      const cSZ = `${document.getElementById("city").value}, ${document.getElementById("state").value} ${document.getElementById("zip").value}`;
      const shipMethod = document.querySelector('input[name="shipping"]:checked')?.closest('.shipping-option').querySelector('.s-name').textContent || 'Standard';

      reviewShipping.innerHTML = `
        <h4>Shipping Details</h4>
        <div class="review-row"><span>Name:</span> <span>${name || 'N/A'}</span></div>
        <div class="review-row"><span>Address:</span> <span>${address || 'N/A'}, ${cSZ}</span></div>
        <div class="review-row"><span>Method:</span> <span>${shipMethod}</span></div>
      `;

      // 2. Payment info
      const activeTab = document.querySelector(".pay-tab.active").dataset.tab;
      let payInfo = "Credit Card ending in " + (document.getElementById("cardNumber").value.slice(-4) || '****');
      if (activeTab === "paypal") payInfo = "PayPal";
      if (activeTab === "gpay") payInfo = "Google Pay";
      if (activeTab === "upi") payInfo = `UPI (${document.getElementById("upiId").value || 'N/A'})`;

      reviewPayment.innerHTML = `
        <h4>Payment details</h4>
        <div class="review-row"><span>Method:</span> <span>${activeTab.toUpperCase()}</span></div>
        <div class="review-row"><span>Account:</span> <span>${payInfo}</span></div>
      `;

      // 3. Items review
      reviewItems.innerHTML = `
        <h4>Items</h4>
        ${cart.map(item => `
          <div class="review-cart-item">
            <img src="${optimizeImg(item.image, 100)}" class="review-item-img" alt="${item.title}" loading="lazy">
            <div class="review-item-info">
              <div class="review-item-title">${item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title}</div>
              <div class="review-item-qty">Qty: ${item.quantity} · $${item.price.toFixed(2)} ea</div>
            </div>
            <div class="review-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        `).join('')}
      `;
    }

  }

};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
