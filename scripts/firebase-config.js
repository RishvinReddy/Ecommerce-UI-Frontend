import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFFcfjDTfYp2f0GP8xNfPDW7oGJS61qD0",
  authDomain: "ecommerce-ui-app-cde8e.firebaseapp.com",
  projectId: "ecommerce-ui-app-cde8e",
  storageBucket: "ecommerce-ui-app-cde8e.firebasestorage.app",
  messagingSenderId: "1073697339121",
  appId: "1:1073697339121:web:8e5e82c00eb72e577f5b50",
  measurementId: "G-YQVS79HXMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable local persistence so users stay logged in
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Auth persistence error:", err));

export {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
};
