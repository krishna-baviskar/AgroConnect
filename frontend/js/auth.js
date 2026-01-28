// frontend/js/auth.js
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth, API_URL } from './config.js';

export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', userCredential.user.uid);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
}

export async function signupUser(formData) {
    try {
        // 1. Create user in backend (for Firestore profile)
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        // 2. Sign in with Firebase Auth (backend should have created the user, but we need to sign in on client)
        // Note: The backend signup creates the user in Firebase Admin. 
        // We can sign in directly if we have the password.
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', userCredential.user.uid);

        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Signup Error:", error);
        throw error;
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Logout Error:", error);
        throw error;
    }
}
