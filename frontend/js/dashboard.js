// frontend/js/dashboard.js
import { auth } from './config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { logoutUser } from './auth.js';
import { loadUserProfile, updateUserProfile } from './profile.js';
import { fetchCropPlans, createCropPlan, deleteCropPlan } from './cropPlanner.js';
import { fetchMarketPrices, fetchRecommendations } from './market.js';
import { fetchCurrentWeather, fetchWeatherForecast, fetchWeatherAdvisory } from './weather.js';
import { fetchSchemes } from './schemes.js';

let currentUser = null;
let authToken = null;
window.currentFarmer = null; // Global state for UI helpers

// Auth check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authToken = await user.getIdToken();
        initDashboard();
    } else {
        window.location.href = 'login.html';
    }
});

// Initialize dashboard
async function initDashboard() {
    console.log('🚀 Initializing dashboard...');
    try {
        updateCurrentDate();
        setupNavigation();
        setupLogout();
        await initUserProfile();
        await initOverviewData();
        setupProfileEdit();
        setupCropPlannerSection();
        setupMarketSection();
        setupWeatherSection();
        setupSchemesSection();
        await setupRecommendations();
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
    }
}

// Update current date
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-IN', options);
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;

            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`${sectionId}Section`).classList.add('active');
        });
    });
}

// Logout
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
}

// User Profile
async function initUserProfile() {
    const farmer = await loadUserProfile(authToken);
    if (farmer) {
        window.currentFarmer = farmer;
        updateProfileUI(farmer);
    }
}

function updateProfileUI(farmer) {
    document.getElementById('welcomeText').textContent = `Welcome back, ${farmer.name}!`;
    document.getElementById('userBadge').textContent = farmer.name;

    // Profile Section
    document.getElementById('profileName').textContent = farmer.name;
    document.getElementById('profileEmail').textContent = farmer.email;
    document.getElementById('profilePhone').textContent = farmer.phone || 'Not provided';
    document.getElementById('profileVillage').textContent = farmer.village || 'Not provided';
    document.getElementById('profileState').textContent = farmer.state || 'Maharashtra';
    document.getElementById('profileLandSize').textContent = farmer.landSize ? `${farmer.landSize} acres` : 'Not provided';
    document.getElementById('profileSoilType').textContent = farmer.soilType || 'Not provided';
}

// Overview Data
async function initOverviewData() {
    // Active Crops Count
    const plans = await fetchCropPlans(authToken);
    document.getElementById('activeCropsCount').textContent = plans?.length || 0;

    // Current Temp
    const location = window.currentFarmer?.village || 'Mumbai';
    const weather = await fetchCurrentWeather(authToken, location);
    if (weather) {
        document.getElementById('currentTemp').textContent = `${weather.temperature}°C`;
    }

    // Best Market Price
    const prices = await fetchMarketPrices(authToken);
    if (prices.length > 0) {
        const best = prices.reduce((max, p) => p.price > max.price ? p : max);
        document.getElementById('bestPrice').textContent = `₹${best.price}`;
    }

    // Schemes Count
    const schemes = await fetchSchemes(authToken);
    document.getElementById('schemesCount').textContent = schemes.length || 0;

    // Advisory
    await loadAdvisory(location);

    // Quick Market
    loadQuickMarket(prices);
}

async function loadAdvisory(location) {
    const advisoryDiv = document.getElementById('todayAdvisory');
    const data = await fetchWeatherAdvisory(authToken, location);

    if (data && data.advisories && data.advisories.length > 0) {
        advisoryDiv.innerHTML = data.advisories.map(adv => `
            <div class="advisory-item" style="padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${adv.type === 'warning' ? '#f39c12' : '#3498db'};">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <span style="font-size: 24px;">${adv.icon}</span>
                    <div style="flex: 1;">
                        <strong style="display: block; margin-bottom: 5px;">${adv.title}</strong>
                        <p style="margin-bottom: 5px; color: #666;">${adv.message}</p>
                        <small style="color: #888;">Action: ${adv.action}</small>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        advisoryDiv.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No advisories for today. Weather conditions are normal.</p>';
    }
}

function loadQuickMarket(prices) {
    const marketDiv = document.getElementById('quickMarket');
    if (prices.length > 0) {
        const topPrices = prices.slice(0, 5);
        marketDiv.innerHTML = topPrices.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee;">
                <span style="font-weight: 600; text-transform: capitalize;">${item.crop}</span>
                <div style="text-align: right;">
                    <span style="font-size: 18px; font-weight: 700; color: #2ecc71;">₹${item.price}</span>
                    <span style="font-size: 12px; color: #888;">/${item.unit}</span>
                    <span style="margin-left: 8px;">${item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '➡️'}</span>
                </div>
            </div>
        `).join('');
    } else {
        marketDiv.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No market data available</p>';
    }
}

// Profile Edit
function setupProfileEdit() {
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const profileView = document.getElementById('profileView');
    const profileEdit = document.getElementById('profileEdit');
    const form = document.getElementById('profileEditForm');

    editBtn.addEventListener('click', () => {
        document.getElementById('editName').value = window.currentFarmer.name;
        document.getElementById('editPhone').value = window.currentFarmer.phone || '';
        document.getElementById('editVillage').value = window.currentFarmer.village || '';
        document.getElementById('editLandSize').value = window.currentFarmer.landSize || '';
        document.getElementById('editSoilType').value = window.currentFarmer.soilType || '';

        profileView.style.display = 'none';
        profileEdit.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        profileView.style.display = 'block';
        profileEdit.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            village: document.getElementById('editVillage').value,
            landSize: document.getElementById('editLandSize').value,
            soilType: document.getElementById('editSoilType').value
        };

        try {
            const result = await updateUserProfile(authToken, updateData);
            if (result.success) {
                alert('Profile updated successfully!');
                await initUserProfile();
                profileView.style.display = 'block';
                profileEdit.style.display = 'none';
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            alert('Error updating profile');
        }
    });
}

// Crop Planner
function setupCropPlannerSection() {
    const addBtn = document.getElementById('addCropBtn');
    const modal = document.getElementById('addCropForm');
    const closeBtn = document.getElementById('closeCropFormBtn');
    const form = document.getElementById('newCropForm');

    addBtn.addEventListener('click', () => modal.style.display = 'flex');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Crop plan form submitted');

        const cropData = {
            cropName: document.getElementById('newCropName').value,
            season: document.getElementById('newCropSeason').value,
            landSize: document.getElementById('newCropLandSize').value,
            soilType: document.getElementById('newCropSoilType').value || window.currentFarmer?.soilType || '',
            irrigationType: document.getElementById('newCropIrrigation').value || '',
            waterAvailability: document.getElementById('newCropWater').value || '',
            previousCrop: document.getElementById('newCropPrevious').value || '',
            farmingMethod: document.getElementById('newCropMethod').value || '',
            expectedYield: document.getElementById('newCropYield').value || '',
            budget: document.getElementById('newCropBudget').value || '',
            sowingDate: document.getElementById('newCropSowingDate').value || '',
            notes: document.getElementById('newCropNotes').value || ''
        };

        console.log('📦 Crop data:', cropData);

        // Validation
        if (!cropData.cropName || !cropData.season || !cropData.landSize) {
            alert('❌ Please fill in all required fields (marked with *)');
            return;
        }

        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Creating...';
        submitBtn.disabled = true;

        try {
            console.log('📤 Sending crop plan to server...');
            const result = await createCropPlan(authToken, cropData);
            console.log('📥 Server response:', result);

            if (result && result.success) {
                console.log('✅ Crop plan created successfully!');
                alert('✅ Crop plan created!');
                modal.style.display = 'none';
                form.reset();
                await refreshCropPlans();
                await initOverviewData(); // Update overview stats
                await setupRecommendations(); // Refresh recommendations
            } else {
                console.error('❌ Server returned error:', result);
                alert('❌ Failed to create crop plan: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Crop plan creation error:', error);
            alert('❌ Failed to create crop plan. Check console for details.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    refreshCropPlans();
}

async function refreshCropPlans() {
    console.log('🔄 Refreshing crop plans...');
    const listDiv = document.getElementById('cropPlansList');

    if (!listDiv) {
        console.error('❌ cropPlansList element not found');
        return;
    }

    listDiv.innerHTML = '<div class="loader">Loading crop plans...</div>';

    try {
        const plans = await fetchCropPlans(authToken);
        console.log('📦 Crop plans loaded:', plans?.length || 0);

        if (plans && plans.length > 0) {
            listDiv.innerHTML = plans.map(plan => `
                <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #2ecc71; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-size: 20px;">🌾 ${plan.cropName}</h3>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="background: #2ecc71; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Active</span>
                            <button class="delete-plan-btn" data-plan-id="${plan.id}" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.3s ease;">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 15px;">
                        <p style="margin: 8px 0;"><strong>Season:</strong> ${plan.season}</p>
                        <p style="margin: 8px 0;"><strong>Land Size:</strong> ${plan.landSize || 0} acres</p>
                        ${plan.soilType ? `<p style="margin: 8px 0;"><strong>Soil Type:</strong> ${plan.soilType}</p>` : ''}
                        ${plan.irrigationType ? `<p style="margin: 8px 0;"><strong>Irrigation:</strong> ${plan.irrigationType}</p>` : ''}
                        ${plan.waterAvailability ? `<p style="margin: 8px 0;"><strong>Water:</strong> ${plan.waterAvailability}</p>` : ''}
                        ${plan.farmingMethod ? `<p style="margin: 8px 0;"><strong>Method:</strong> ${plan.farmingMethod}</p>` : ''}
                    </div>
                    
                    ${plan.previousCrop ? `<p style="margin: 12px 0 8px 0;"><strong>Previous Crop:</strong> ${plan.previousCrop}</p>` : ''}
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 12px;">
                        ${plan.expectedYield ? `<p style="margin: 8px 0;"><strong>Expected Yield:</strong> ${plan.expectedYield} quintals</p>` : ''}
                        ${plan.budget ? `<p style="margin: 8px 0;"><strong>Budget:</strong> ₹${plan.budget.toLocaleString()}</p>` : ''}
                        ${plan.sowingDate ? `<p style="margin: 8px 0;"><strong>Sowing Date:</strong> ${new Date(plan.sowingDate).toLocaleDateString()}</p>` : ''}
                    </div>
                    
                    ${plan.notes ? `
                        <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                            <strong>Notes:</strong>
                            <p style="margin: 5px 0 0 0; color: #666;">${plan.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `).join('');

            // Add event listeners for delete buttons using event delegation
            listDiv.addEventListener('click', handleDeletePlan);
        } else {
            listDiv.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="font-size: 64px; margin-bottom: 20px;">🌱</div>
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">No Crop Plans Yet</h3>
                    <p style="color: #7f8c8d; margin-bottom: 20px;">Start planning your crops to get personalized recommendations</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Failed to load crop plans:', error);
        listDiv.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 40px;">Failed to load crop plans</p>';
    }
}

async function handleDeletePlan(event) {
    if (!event.target.classList.contains('delete-plan-btn')) {
        return;
    }

    const planId = event.target.getAttribute('data-plan-id');
    const confirmed = confirm('Are you sure you want to delete this crop plan? This action cannot be undone.');

    if (!confirmed) {
        return;
    }

    console.log('🗑️ Deleting plan:', planId);

    try {
        // Disable button and show loading state
        event.target.disabled = true;
        event.target.textContent = '⏳ Deleting...';

        const result = await deleteCropPlan(authToken, planId);

        if (result && result.success) {
            console.log('✅ Plan deleted successfully');
            alert('Crop plan deleted successfully!');

            // Refresh the crop plans list
            await refreshCropPlans();

            // Update overview stats
            await initOverviewData();
        } else {
            console.error('❌ Delete failed:', result);
            alert('Failed to delete crop plan. Please try again.');
            event.target.disabled = false;
            event.target.textContent = '🗑️ Delete';
        }
    } catch (error) {
        console.error('❌ Delete error:', error);
        alert('An error occurred while deleting the crop plan.');
        event.target.disabled = false;
        event.target.textContent = '🗑️ Delete';
    }
}

// Market Section
function setupMarketSection() {
    document.getElementById('refreshMarketBtn').addEventListener('click', refreshMarketPrices);
    refreshMarketPrices();
}

async function refreshMarketPrices() {
    const listDiv = document.getElementById('marketPricesList');
    listDiv.innerHTML = '<div class="loader">Loading market prices...</div>';

    const prices = await fetchMarketPrices(authToken);

    if (prices.length > 0) {
        listDiv.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">${prices.map(item => `
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h3 style="text-transform: capitalize; margin-bottom: 15px;">${item.crop}</h3>
                <div style="font-size: 32px; font-weight: 700; color: #2ecc71; margin-bottom: 10px;">₹${item.price}</div>
                <p style="color: #888; font-size: 14px;">per ${item.unit}</p>
                <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <span>${item.trend === 'up' ? '📈 Rising' : item.trend === 'down' ? '📉 Falling' : '➡️ Stable'}</span>
                    <small style="color: #888;">${item.source}</small>
                </div>
            </div>
        `).join('')}</div>`;
    } else {
        listDiv.innerHTML = '<p style="color: #e74c3c; text-align: center;">Failed to load market prices</p>';
    }
}

// Weather Section
async function setupWeatherSection() {
    const location = window.currentFarmer?.village || 'Mumbai';
    const contentDiv = document.getElementById('weatherContent');
    contentDiv.innerHTML = '<div class="loader">Loading weather...</div>';

    const [current, forecast] = await Promise.all([
        fetchCurrentWeather(authToken, location),
        fetchWeatherForecast(authToken, location)
    ]);

    if (current && forecast) {
        contentDiv.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h3>Current Weather - ${current.location}</h3>
                <div style="display: flex; align-items: center; gap: 30px; margin-top: 20px;">
                    <div style="font-size: 64px; font-weight: 700; color: #3498db;">${current.temperature}°C</div>
                    <div>
                        <p><strong>Feels like:</strong> ${current.feelsLike}°C</p>
                        <p><strong>Humidity:</strong> ${current.humidity}%</p>
                        <p><strong>Wind:</strong> ${current.windSpeed} m/s</p>
                        <p style="text-transform: capitalize;"><strong>${current.description}</strong></p>
                    </div>
                </div>
            </div>

            <h3 style="margin-bottom: 20px;">5-Day Forecast</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">
                ${forecast.map(day => `
                    <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;">
                        <p style="font-weight: 600; margin-bottom: 10px;">${day.date}</p>
                        <div style="font-size: 28px; font-weight: 700; color: #3498db; margin: 10px 0;">${day.temp}°C</div>
                        <p style="text-transform: capitalize; font-size: 14px; color: #666;">${day.description}</p>
                        <p style="font-size: 12px; color: #888; margin-top: 10px;">💧 ${day.humidity}%</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        contentDiv.innerHTML = '<p style="color: #e74c3c;">Failed to load weather data</p>';
    }
}

// Schemes Section
function setupSchemesSection() {
    document.getElementById('schemeCategory').addEventListener('change', refreshSchemes);
    refreshSchemes();
}

async function refreshSchemes() {
    const category = document.getElementById('schemeCategory').value;
    const listDiv = document.getElementById('schemesList');
    listDiv.innerHTML = '<div class="loader">Loading schemes...</div>';

    const schemes = await fetchSchemes(authToken, category);

    if (schemes.length > 0) {
        listDiv.innerHTML = schemes.map(scheme => `
            <div style="background: white; padding: 25px; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h3 style="flex: 1;">${scheme.name}</h3>
                    <span style="background: #3498db; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px;">${scheme.category}</span>
                </div>
                <p style="color: #666; margin-bottom: 15px;">${scheme.description}</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p><strong>💰 Benefits:</strong> ${scheme.benefits}</p>
                    <p><strong>✅ Eligibility:</strong> ${scheme.eligibility}</p>
                    <p><strong>📅 Deadline:</strong> ${scheme.deadline}</p>
                </div>
                <a href="${scheme.applyLink}" target="_blank" class="btn btn-primary">Apply Now →</a>
            </div>
        `).join('');
    } else {
        listDiv.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">No schemes found for selected category</p>';
    }
}

// Recommendations Section
async function setupRecommendations() {
    console.log('🌟 Setting up crop recommendations...');
    const listDiv = document.getElementById('recommendationsList');

    if (!listDiv) {
        console.warn('⚠️ recommendationsList element not found');
        return;
    }

    listDiv.innerHTML = '<div class="loader">Loading recommendations...</div>';

    try {
        const recommendations = await fetchRecommendations(authToken);

        if (recommendations && recommendations.length > 0) {
            listDiv.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">${recommendations.map(crop => `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <h3 style="margin: 0; font-size: 22px; text-transform: capitalize; color: white;">${crop.crop}</h3>
                        <span style="background: rgba(255,255,255,0.3); padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                            ${crop.trend === 'up' ? '📈 Rising' : crop.trend === 'down' ? '📉 Falling' : '➡️ Stable'}
                        </span>
                    </div>
                    <div style="font-size: 36px; font-weight: 700; margin-bottom: 10px; color: #fff;">₹${crop.price}</div>
                    <p style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">per ${crop.unit}</p>
                    <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; font-size: 13px;">
                        <strong>💡 Why recommended:</strong><br>
                        ${crop.trend === 'up' ? 'Price is rising - good market demand' :
                    crop.trend === 'stable' && crop.price > 2000 ? 'High stable price - reliable income' :
                        'Good market opportunity'}
                    </div>
                </div>
            `).join('')}</div>`;
            console.log('✅ Recommendations displayed');
        } else {
            listDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">No Recommendations Available</h3>
                    <p style="color: #7f8c8d;">Market data is being updated. Check back soon!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Failed to load recommendations:', error);
        listDiv.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 40px;">Failed to load recommendations</p>';
    }
}
