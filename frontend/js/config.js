// frontend/js/config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUjAOCG0iAuBzNunjNnGGDvbLYSJ3UN0Q",
    authDomain: "agroconnect-91cb8.firebaseapp.com",
    projectId: "agroconnect-91cb8",
    storageBucket: "agroconnect-91cb8.firebasestorage.app",
    messagingSenderId: "1013303949645",
    appId: "1:1013303949645:web:61a759a6f4013e30fb9f04",
    measurementId: "G-N28XSHY8Y7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// API URL
const API_URL = 'http://localhost:3000/api';

export { app, auth, analytics, API_URL };
