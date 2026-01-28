// backend/services/schemeService.js
import axios from 'axios';

// Government schemes data structure
const governmentSchemes = {
  maharashtra: [
    {
      id: 'pm-kisan',
      name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      description: 'Direct income support of ₹6000 per year to all farmer families',
      benefits: '₹2000 per installment (3 times a year)',
      eligibility: 'All landholding farmers across India',
      crops: ['all'],
      farmerType: 'all',
      deadline: 'Open',
      applyLink: 'https://pmkisan.gov.in/',
      category: 'Financial Support'
    },
    {
      id: 'pm-fasal-bima',
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      description: 'Crop insurance scheme providing financial support against crop loss',
      benefits: 'Insurance coverage up to sum insured for crop loss',
      eligibility: 'All farmers growing notified crops',
      crops: ['wheat', 'rice', 'cotton', 'soybean', 'sugarcane'],
      farmerType: 'all',
      deadline: 'Before sowing season',
      applyLink: 'https://pmfby.gov.in/',
      category: 'Insurance'
    },
    {
      id: 'pm-kusum',
      name: 'PM-KUSUM (Solar Agriculture Pump)',
      description: 'Financial support for solar pumps and grid-connected solar power plants',
      benefits: '60% subsidy on solar pump installation',
      eligibility: 'Farmers with irrigation needs',
      crops: ['all'],
      farmerType: 'all',
      deadline: 'Open',
      applyLink: 'https://mnre.gov.in/solar/schemes/',
      category: 'Infrastructure'
    },
    {
      id: 'kisan-credit-card',
      name: 'Kisan Credit Card (KCC)',
      description: 'Credit facility for crop cultivation and other needs',
      benefits: 'Loan up to ₹3 lakh at 7% interest rate',
      eligibility: 'Farmers with land ownership or tenancy',
      crops: ['all'],
      farmerType: 'all',
      deadline: 'Open',
      applyLink: 'https://www.india.gov.in/kisan-credit-card-kcc-scheme',
      category: 'Credit'
    },
    {
      id: 'soil-health-card',
      name: 'Soil Health Card Scheme',
      description: 'Free soil testing and nutrient recommendations',
      benefits: 'Free soil analysis and recommendations',
      eligibility: 'All farmers',
      crops: ['all'],
      farmerType: 'all',
      deadline: 'Open',
      applyLink: 'https://soilhealth.dac.gov.in/',
      category: 'Advisory'
    },
    {
      id: 'maha-organic',
      name: 'Maharashtra Organic Farming Scheme',
      description: 'Promotion of organic farming practices with financial incentives',
      benefits: '₹10,000 per hectare assistance',
      eligibility: 'Farmers adopting organic farming',
      crops: ['all'],
      farmerType: 'organic',
      deadline: 'Open',
      applyLink: 'https://krishi.maharashtra.gov.in/',
      category: 'Organic Farming'
    },
    {
      id: 'drip-irrigation',
      name: 'Drip Irrigation Subsidy',
      description: 'Subsidy for installation of drip irrigation systems',
      benefits: 'Up to 55% subsidy on drip irrigation',
      eligibility: 'All farmers with irrigation needs',
      crops: ['sugarcane', 'cotton', 'vegetables'],
      farmerType: 'all',
      deadline: 'Open',
      applyLink: 'https://pmksy.gov.in/',
      category: 'Water Management'
    },
    {
      id: 'women-farmer',
      name: 'Mahila Kisan Sashaktikaran Pariyojana (MKSP)',
      description: 'Empowerment of women farmers through training and resources',
      benefits: 'Free training, tools, and financial support',
      eligibility: 'Women farmers',
      crops: ['all'],
      farmerType: 'women',
      deadline: 'Open',
      applyLink: 'https://mksp.gov.in/',
      category: 'Women Empowerment'
    }
  ]
};

// Cache for API responses
let schemeCache = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getSchemes(state = 'maharashtra', filters = {}) {
  try {
    const cacheKey = `schemes_${state}_${JSON.stringify(filters)}`;
    const now = Date.now();

    // Check cache
    if (schemeCache[cacheKey] && (now - schemeCache[cacheKey].timestamp) < CACHE_DURATION) {
      return schemeCache[cacheKey].data;
    }

    // Get schemes for the state
    let schemes = governmentSchemes[state.toLowerCase()] || governmentSchemes.maharashtra;

    // Apply filters
    if (filters.crop) {
      const cropLower = filters.crop.toLowerCase();
      schemes = schemes.filter(s => 
        s.crops.includes('all') || s.crops.some(c => c.includes(cropLower))
      );
    }

    if (filters.farmerType && filters.farmerType !== 'all') {
      schemes = schemes.filter(s => 
        s.farmerType === 'all' || s.farmerType === filters.farmerType.toLowerCase()
      );
    }

    if (filters.category) {
      schemes = schemes.filter(s => 
        s.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Cache the result
    schemeCache[cacheKey] = {
      data: schemes,
      timestamp: now
    };

    return schemes;

  } catch (error) {
    console.error('Get schemes error:', error);
    throw error;
  }
}

export async function getSchemeById(schemeId, state = 'maharashtra') {
  try {
    const schemes = governmentSchemes[state.toLowerCase()] || governmentSchemes.maharashtra;
    const scheme = schemes.find(s => s.id === schemeId);

    if (!scheme) {
      throw new Error('Scheme not found');
    }

    return scheme;

  } catch (error) {
    console.error('Get scheme by ID error:', error);
    throw error;
  }
}

export function getSchemeCategories() {
  const allSchemes = Object.values(governmentSchemes).flat();
  const categories = [...new Set(allSchemes.map(s => s.category))];
  return categories;
}

export default { getSchemes, getSchemeById, getSchemeCategories };