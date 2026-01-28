// frontend/js/profile.js
import { API_URL } from './config.js';

export async function loadUserProfile(authToken) {
    try {
        const response = await fetch(`${API_URL}/farmers/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        if (data.success) {
            return data.farmer;
        }
        return null;
    } catch (error) {
        console.error('Load profile error:', error);
        throw error;
    }
}

export async function updateUserProfile(authToken, updateData) {
    try {
        const response = await fetch(`${API_URL}/farmers/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        return await response.json();
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}
