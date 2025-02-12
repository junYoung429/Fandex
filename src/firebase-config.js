// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqAgnFDwd7Bkr1VegpGKkR1mxrmJ6fXQc",
  authDomain: "fandextest.firebaseapp.com",
  projectId: "fandextest",
  storageBucket: "fandextest.firebasestorage.app",
  messagingSenderId: "16930056700",
  appId: "1:16930056700:web:5e6471bc9ae8c2028f2a79",
  measurementId: "G-6NCQSKZ0HG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
