// ========================================
// Firebase Configuration
// ========================================

// Import Firebase SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDJH_3Sk37uilvPJfURIOWyd2Q3hfrWvCo",
    authDomain: "ai-todo-app-e603b.firebaseapp.com",
    projectId: "ai-todo-app-e603b",
    storageBucket: "ai-todo-app-e603b.firebasestorage.app",
    messagingSenderId: "809119383236",
    appId: "1:809119383236:web:9b3cef5e7d0c410da71391",
    measurementId: "G-V2EX6P1K11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export app for potential future use
export default app;
