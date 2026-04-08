document.addEventListener("DOMContentLoaded", () => {
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
  function getCart() {
    return JSON.parse(localStorage.getItem("premium_cart")) || [];
  }

  function saveCart(cart) {
    localStorage.setItem("premium_cart", JSON.stringify(cart));
  }

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
          <img src="${item.image}" class="cart-item-img" alt="${item.title}" loading="lazy">
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
            <img loading="lazy" src="${product.image}" alt="${product.title}">
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
            <img src="${product.image}" class="detail-img" id="detailImg" alt="${product.title}">
            <div class="zoom-preview" id="zoomPreview" style="background-image: url('${product.image}');"></div>
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
              <img loading="lazy" src="${product.image}" alt="${product.title}">
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

});
