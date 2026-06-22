// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2LJbnqANXiWWQbO2cPRA_y0XFbXD88CU",
  authDomain: "bozheman-49829.firebaseapp.com",
  projectId: "bozheman-49829",
  storageBucket: "bozheman-49829.firebasestorage.app",
  messagingSenderId: "1084606630914",
  appId: "1:1084606630914:web:3ce2b0d77863538af32b1b",
  measurementId: "G-JDDVL385CQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithPopup, GoogleAuthProvider, collection, addDoc, serverTimestamp, query, where, getDocs };
