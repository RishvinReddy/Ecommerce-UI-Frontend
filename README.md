# 🛒 ShopX — Premium Full-Stack E-Commerce App

A production-ready, full-stack e-commerce experience built with vanilla HTML/CSS/JS and Firebase, featuring glassmorphic UI, real-time cart syncing, and offline PWA support.

## 🌐 Live Demo
**👉 [https://rishvinreddy.github.io/Ecommerce-UI-Frontend/](https://rishvinreddy.github.io/Ecommerce-UI-Frontend/)**

---

## ✅ Features

| Feature | Status |
|---|---|
| Responsive Mobile-First Design | ✅ |
| Glassmorphism UI & Micro-Animations | ✅ |
| Real Product Listing via FakeStore API | ✅ |
| Product Filtering & Search | ✅ |
| Product Detail Page with Zoom | ✅ |
| Floating Cart with Real-Time Updates | ✅ |
| Multi-Step Checkout Flow | ✅ |
| Firebase Authentication (Login/Signup) | ✅ |
| Demo Sign-In Button | ✅ |
| Firestore Cart Sync (persists across devices) | ✅ |
| Order History Page (My Orders) | ✅ |
| Progressive Web App (Offline Support) | ✅ |
| CSS Skeleton Loading UI | ✅ |
| WebP Image Optimization via CDN | ✅ |
| Hero Image Preloading (LCP Optimized) | ✅ |
| Safari/Firefox Cross-Browser Compatibility | ✅ |

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, ES6+ JavaScript (Vanilla, no framework)
- **Backend/Auth**: Firebase v11 (Authentication + Firestore)
- **Performance**: Service Worker (PWA), `wsrv.nl` CDN, `loading="lazy"`, CSS Skeleton UI
- **Hosting**: GitHub Pages
- **Version Control**: Git & GitHub

---

## 📂 Project Structure

```
shopx/
├── index.html          # Homepage with hero & product grid
├── product.html        # Product catalog & detail view
├── cart.html           # Shopping cart page
├── checkout.html       # Multi-step checkout flow
├── orders.html         # My Orders (authenticated)
├── sw.js               # Service Worker for offline PWA caching
├── scripts/
│   ├── firebase-config.js  # Firebase SDK & exports
│   ├── auth.js             # Auth modal, login/signup/logout logic
│   └── app.js              # All core app logic
└── styles/
    ├── main.css            # Complete stylesheet (merged)
    └── main.min.css        # Minified CSS
```

---

## 🚀 Running Locally

Because this project uses ES Modules for Firebase, you must serve it through a local web server:

```bash
python3 -m http.server 5500
```

Then open **http://localhost:5500** in your browser.

---

## 🔐 Demo Account

A demo account is pre-configured for testing. Click the **"Sign In"** button and use the **"Demo Sign In"** to instantly explore all authenticated features (cart sync, order history) without creating an account.

---

## 📜 License

MIT © Rishvin Reddy
