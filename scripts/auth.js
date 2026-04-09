import { 
  auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "./firebase-config.js";

// Global User State
window.currentUser = null;

const initAuth = () => {
  // 1. Inject Auth Modal into body if not exists
  if (!document.getElementById("authModalOverlay")) {
    const modalHTML = `
      <div class="auth-modal-overlay" id="authModalOverlay">
        <div class="auth-modal">
          <button class="auth-close-btn" id="authCloseBtn"><i class="fas fa-times"></i></button>
          
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login">Login</button>
            <button class="auth-tab" data-tab="register">Sign Up</button>
          </div>

          <!-- Login Form -->
          <form class="auth-form active" id="loginForm">
            <div class="auth-error" id="loginError"></div>
            <div class="auth-input-group">
              <i class="fas fa-envelope"></i>
              <input type="email" id="loginEmail" class="auth-input" placeholder="Email Address" required>
            </div>
            <div class="auth-input-group">
              <i class="fas fa-lock"></i>
              <input type="password" id="loginPassword" class="auth-input" placeholder="Password" required>
            </div>
            <button type="submit" class="auth-btn" id="loginBtn">Log In</button>
            <div class="auth-divider"><span>or automatically sign in</span></div>
            <button type="button" class="auth-btn demo-btn" id="demoLoginBtn">Demo Sign In</button>
          </form>

          <!-- Register Form -->
          <form class="auth-form" id="registerForm">
            <div class="auth-error" id="registerError"></div>
            <div class="auth-input-group">
              <i class="fas fa-envelope"></i>
              <input type="email" id="registerEmail" class="auth-input" placeholder="Email Address" required>
            </div>
            <div class="auth-input-group">
              <i class="fas fa-lock"></i>
              <input type="password" id="registerPassword" class="auth-input" placeholder="Password (min 6 chars)" required>
            </div>
            <button type="submit" class="auth-btn" id="registerBtn">Create Account</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  // Inject Profile Dropdown into header (replacing generic user icon)
  const navIcons = document.querySelector(".header-right") || document.querySelector(".nav-icons");
  if (navIcons) {
    // 1. Remove existing user icon anchor
    const oldIcon = navIcons.querySelector("a[href='#'] i.fa-user")?.parentElement;
    if (oldIcon) oldIcon.remove();

    // 2. Add dynamic Auth Nav elements
    const authNavHTML = `
      <button class="nav-btn login-btn" id="navLoginBtn">Sign In</button>
      <div class="user-profile-menu" id="userProfileMenu">
        <div class="profile-avatar" id="profileAvatar">U</div>
        <div class="profile-dropdown" id="profileDropdown">
          <div class="profile-header">
            <div class="profile-email" id="profileEmailDisplay">user@example.com</div>
          </div>
          <a href="orders.html" class="dropdown-item"><i class="fas fa-box-open"></i> My Orders</a>
          <button class="dropdown-item logout" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Log Out</button>
        </div>
      </div>
    `;
    // Insert before cart button
    const cartBtn = navIcons.querySelector(".cart") || navIcons.querySelector(".cart-btn-wrapper") || navIcons.lastElementChild;
    if(cartBtn) {
        cartBtn.insertAdjacentHTML('beforebegin', authNavHTML);
    } else {
        navIcons.insertAdjacentHTML('beforeend', authNavHTML);
    }
  }

  // --- Modal DOM Elements ---
  const authModal = document.getElementById("authModalOverlay");
  const authClose = document.getElementById("authCloseBtn");
  const navLoginBtn = document.getElementById("navLoginBtn");
  const authTabs = document.querySelectorAll(".auth-tab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginError = document.getElementById("loginError");
  const registerError = document.getElementById("registerError");

  // Profile DOM Elements
  const userMenu = document.getElementById("userProfileMenu");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  // --- Modal Toggle Logic ---
  const toggleModal = (show) => {
    if (show) authModal.classList.add("active");
    else authModal.classList.remove("active");
  };

  if (navLoginBtn) navLoginBtn.addEventListener("click", () => toggleModal(true));
  if (authClose) authClose.addEventListener("click", () => toggleModal(false));
  
  // Close modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === authModal) toggleModal(false);
    // Also handle profile dropdown outside click
    if (profileDropdown && profileDropdown.classList.contains("open") && !userMenu.contains(e.target)) {
      profileDropdown.classList.remove("open");
    }
  });

  if (profileAvatar) {
    profileAvatar.addEventListener("click", () => {
      profileDropdown.classList.toggle("open");
    });
  }

  // --- Tab Switching Logic ---
  authTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      authTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      if (tab.dataset.tab === "login") {
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
        loginError.style.display = "none";
      } else {
        registerForm.classList.add("active");
        loginForm.classList.remove("active");
        registerError.style.display = "none";
      }
    });
  });

  // --- Firebase Auth UI Updates ---
  onAuthStateChanged(auth, async (user) => {
    window.currentUser = user;
    if (user) {
      // User is logged in
      if (navLoginBtn) navLoginBtn.style.display = "none";
      if (userMenu) userMenu.classList.add("active");
      
      const email = user.email;
      document.getElementById("profileEmailDisplay").textContent = email;
      profileAvatar.textContent = email.charAt(0).toUpperCase();

      toggleModal(false);

      // Trigger cart migration/sync via app.js event
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: user } }));
      
    } else {
      // User is logged out
      if (navLoginBtn) navLoginBtn.style.display = "block";
      if (userMenu) userMenu.classList.remove("active");
      if (profileDropdown) profileDropdown.classList.remove("open");

      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
    }
  });

  // --- Firebase Login Logic ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("loginBtn");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
      await signInWithEmailAndPassword(
        auth, 
        document.getElementById("loginEmail").value, 
        document.getElementById("loginPassword").value
      );
      // Success handled by onAuthStateChanged
    } catch (error) {
      console.error(error);
      loginError.textContent = "Invalid email or password.";
      loginError.style.display = "block";
    } finally {
      btn.innerHTML = 'Log In';
      btn.disabled = false;
    }
  });

  // --- Demo Login Logic ---
  const demoLoginBtn = document.getElementById("demoLoginBtn");
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener("click", async () => {
      const btn = demoLoginBtn;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;
      const demoEmail = "demo@shopx.com";
      const demoPass = "password123";
      
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      } catch (err) {
        // If it fails, create it first
        try {
          await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        } catch(e) {
          loginError.textContent = "Demo login failed: " + e.message.replace("Firebase: ", "");
          loginError.style.display = "block";
        }
      } finally {
        btn.innerHTML = 'Demo Sign In';
        btn.disabled = false;
      }
    });
  }

  // --- Firebase Registration Logic ---
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("registerBtn");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
      await createUserWithEmailAndPassword(
        auth, 
        document.getElementById("registerEmail").value, 
        document.getElementById("registerPassword").value
      );
    } catch (error) {
      console.error(error);
      registerError.textContent = error.message.replace("Firebase: ", "");
      registerError.style.display = "block";
    } finally {
      btn.innerHTML = 'Create Account';
      btn.disabled = false;
    }
  });

  // --- Logout Logic ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth);
    });
  }

};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
