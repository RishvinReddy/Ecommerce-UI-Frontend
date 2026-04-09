<div align="center">

<!-- HERO BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,50:764ba2,100:f093fb&height=200&section=header&text=ShopX&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=Premium%20Full-Stack%20E-Commerce%20Experience&descAlignY=58&descSize=20&animation=fadeIn" width="100%"/>

<br/>

<!-- SHIELDS -->
[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-ShopX-667eea?style=for-the-badge&logoColor=white)](https://rishvinreddy.github.io/Ecommerce-UI-Frontend/)
[![GitHub Stars](https://img.shields.io/github/stars/RishvinReddy/Ecommerce-UI-Frontend?style=for-the-badge&color=f093fb&logo=github)](https://github.com/RishvinReddy/Ecommerce-UI-Frontend/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/RishvinReddy/Ecommerce-UI-Frontend?style=for-the-badge&color=764ba2&logo=github)](https://github.com/RishvinReddy/Ecommerce-UI-Frontend/network)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://rishvinreddy.github.io/Ecommerce-UI-Frontend/)
[![Firebase](https://img.shields.io/badge/Firebase-v11-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

> **A production-grade, full-stack e-commerce experience** built with vanilla HTML/CSS/JS and Firebase.  
> Glassmorphic UI · Real-time cart sync · Offline PWA · Multi-step checkout · Zero framework dependencies.

<br/>









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
