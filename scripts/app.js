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
  
  // Real-world scenario would fetch data here
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if(val.length > 0) {
      searchSuggestions.style.opacity = "1";
      searchSuggestions.style.visibility = "visible";
      searchSuggestions.style.transform = "translateY(0)";
    } else {
      // Revert to CSS hover logic by removing inline styles
      searchSuggestions.style.opacity = "";
      searchSuggestions.style.visibility = "";
      searchSuggestions.style.transform = "";
    }
  });
});
