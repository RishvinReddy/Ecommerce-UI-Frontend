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

  // 3. Render Products Function
  function renderProducts(products) {
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

      // Using Premium FAANG Aesthetics
      card.innerHTML = `
        <div class="product-img-wrapper">
          <img loading="lazy" src="${product.image}" alt="${product.title}">
        </div>
        <div class="product-card-body">
          <span class="product-category">${product.category}</span>
          <h3 class="product-title" title="${product.title}">${product.title}</h3>
          
          <div class="product-rating">
            <i>${starHTML}</i>
            <span>(${product.rating.count})</span>
          </div>
          
          <div class="product-footer">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button class="add-to-cart-btn" aria-label="Add to cart">
              <span style="font-size: 18px;">+</span>
            </button>
          </div>
        </div>
      `;

      productGrid.appendChild(card);
    });
  }

  // 4. Category Filtering Logic
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
});
