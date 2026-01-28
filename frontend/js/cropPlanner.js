// frontend/js/cropPlanner.js
import { API_URL } from './config.js';

export async function fetchCropPlans(authToken) {
    console.log('🔍 Fetching crop plans from:', `${API_URL}/farmers/crop-plans`);
    try {
        const response = await fetch(`${API_URL}/farmers/crop-plans`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log('📡 Fetch response status:', response.status);

        if (!response.ok) {
            console.error('❌ HTTP error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            return [];
        }

        const data = await response.json();
        console.log('📦 Received data:', data);

        if (data.success) {
            console.log('✅ Crop plans loaded:', data.plans?.length || 0, 'plans');
            return data.plans || [];
        } else {
            console.error('❌ API returned success: false', data);
            return [];
        }
    } catch (error) {
        console.error('❌ Load crop plans error:', error);
        console.error('❌ Error details:', error.message, error.stack);
        return [];
    }
}

export async function createCropPlan(authToken, planData) {
    console.log('📤 Creating crop plan:', planData);
    console.log('📍 API endpoint:', `${API_URL}/farmers/crop-plans`);

    try {
        const response = await fetch(`${API_URL}/farmers/crop-plans`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });

        console.log('📡 Create response status:', response.status);

        if (!response.ok) {
            console.error('❌ HTTP error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const result = await response.json();
        console.log('📥 Create result:', result);
        return result;
    } catch (error) {
        console.error('❌ Create crop plan error:', error);
        console.error('❌ Error details:', error.message, error.stack);
        throw error;
    }
}

export async function deleteCropPlan(authToken, planId) {
    console.log('🗑️ Deleting crop plan:', planId);
    console.log('📍 API endpoint:', `${API_URL}/farmers/crop-plans/${planId}`);

    try {
        const response = await fetch(`${API_URL}/farmers/crop-plans/${planId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('📡 Delete response status:', response.status);

        if (!response.ok) {
            console.error('❌ HTTP error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const result = await response.json();
        console.log('📥 Delete result:', result);
        return result;
    } catch (error) {
        console.error('❌ Delete crop plan error:', error);
        console.error('❌ Error details:', error.message, error.stack);
        throw error;
    }
}
