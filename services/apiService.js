// services/apiService.js
import axios from 'axios';
import NodeCache from 'node-cache';
import { API_CONFIGS, API_ENDPOINTS, NUTRIENT_MAPPING } from '../config/nutritionalAPIs.js';

export class ApiService {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour cache
      checkperiod: 600 // Check for expired keys every 10 minutes
    });
    this.requestCounts = new Map();
    this.lastReset = new Date();
  }

  /**
   * Check rate limits and reset counters if needed
   * @param {string} apiName - API name
   */
  checkRateLimit(apiName) {
    const config = API_CONFIGS[apiName];
    if (!config) return;

    const now = new Date();
    const dayDiff = Math.floor((now - this.lastReset) / (1000 * 60 * 60 * 24));
    
    // Reset counters daily
    if (dayDiff >= 1) {
      this.requestCounts.clear();
      this.lastReset = now;
    }

    const currentCount = this.requestCounts.get(apiName) || 0;
    if (currentCount >= config.rateLimit) {
      throw new Error(`Rate limit exceeded for ${apiName} API. Try again tomorrow.`);
    }

    this.requestCounts.set(apiName, currentCount + 1);
  }

  /**
   * Make API request with caching and rate limiting
   * @param {string} apiName - API name
   * @param {string} endpoint - API endpoint
   * @param {object} params - Request parameters
   * @returns {object} API response
   */
  async makeRequest(apiName, endpoint, params = {}) {
    const config = API_CONFIGS[apiName];
    if (!config) {
      throw new Error(`Unknown API: ${apiName}`);
    }

    if (!config.apiKey) {
      throw new Error(`${apiName} API key not configured`);
    }

    // Check rate limits
    this.checkRateLimit(apiName);

    // Create cache key
    const cacheKey = `${apiName}_${endpoint}_${JSON.stringify(params)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      const url = `${config.baseUrl}${endpoint}`;
      const requestParams = {
        ...params,
        api_key: config.apiKey
      };

      const response = await axios.get(url, {
        params: requestParams,
        timeout: config.timeout,
        headers: config.headers
      });

      // Cache successful response
      this.cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`${apiName} API Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error(`${apiName} API Error: Network request failed`);
      } else {
        throw new Error(`${apiName} API Error: ${error.message}`);
      }
    }
  }

  /**
   * Search foods using USDA API
   * @param {string} query - Search query
   * @param {number} pageSize - Number of results per page
   * @param {number} pageNumber - Page number
   * @returns {object} Search results
   */
  async searchFoodsUSDA(query, pageSize = 25, pageNumber = 1) {
    try {
      const params = {
        query: query,
        pageSize: Math.min(pageSize, 200), // USDA max is 200
        pageNumber: pageNumber,
        sortBy: 'dataType.keyword',
        sortOrder: 'asc'
      };

      const response = await this.makeRequest('usda', API_ENDPOINTS.usda.search, params);
      
      return {
        foods: response.foods || [],
        totalHits: response.totalHits || 0,
        currentPage: pageNumber,
        totalPages: Math.ceil((response.totalHits || 0) / pageSize)
      };
    } catch (error) {
      throw new Error(`USDA food search failed: ${error.message}`);
    }
  }

  /**
   * Get detailed food information from USDA API
   * @param {string} fdcId - USDA food ID
   * @returns {object} Detailed food information
   */
  async getFoodDetailsUSDA(fdcId) {
    try {
      const endpoint = API_ENDPOINTS.usda.food.replace('{fdcId}', fdcId);
      const response = await this.makeRequest('usda', endpoint);
      
      return this.parseUSDAFoodData(response);
    } catch (error) {
      throw new Error(`USDA food details failed: ${error.message}`);
    }
  }

  /**
   * Parse USDA food data into our standard format
   * @param {object} usdaData - Raw USDA data
   * @returns {object} Parsed food data
   */
  parseUSDAFoodData(usdaData) {
    const food = {
      fdcId: usdaData.fdcId,
      name: usdaData.description || 'Unknown Food',
      brand: usdaData.brandOwner || null,
      category: usdaData.foodCategory?.description || 'Other',
      servingSize: 100, // USDA default serving size in grams
      servingUnit: 'g',
      nutrients: this.extractNutrients(usdaData.foodNutrients || []),
      dataSource: 'USDA',
      dateAdded: new Date()
    };

    return food;
  }

  /**
   * Extract and map nutrients from USDA data
   * @param {array} foodNutrients - USDA food nutrients array
   * @returns {object} Mapped nutrients
   */
  extractNutrients(foodNutrients) {
    const nutrients = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      saturatedFat: 0,
      transFat: 0,
      cholesterol: 0,
      potassium: 0,
      calcium: 0,
      iron: 0,
      vitaminA: 0,
      vitaminC: 0
    };

    foodNutrients.forEach(nutrient => {
      const nutrientId = nutrient.nutrient?.id;
      const nutrientName = NUTRIENT_MAPPING[nutrientId];
      const amount = nutrient.amount || 0;

      if (nutrientName && nutrients.hasOwnProperty(nutrientName)) {
        nutrients[nutrientName] = Math.round(amount * 100) / 100; // Round to 2 decimal places
      }
    });

    return nutrients;
  }

  /**
   * Import food from USDA API to our database
   * @param {string} fdcId - USDA food ID
   * @param {object} foodsData - Foods data access object
   * @returns {object} Imported food item
   */
  async importFoodFromUSDA(fdcId, foodsData) {
    try {
      // Get detailed food information
      const usdaFood = await this.getFoodDetailsUSDA(fdcId);
      
      // Check if food already exists
      try {
        const existingFood = await foodsData.searchFoods(usdaFood.name, 1);
        if (existingFood.length > 0 && existingFood[0].dataSource === 'USDA') {
          return existingFood[0];
        }
      } catch (error) {
        // Food doesn't exist, continue with import
      }

      // Add to our database
      const importedFood = await foodsData.addFood({
        name: usdaFood.name,
        brand: usdaFood.brand,
        category: usdaFood.category,
        nutrients: usdaFood.nutrients,
        servingSize: usdaFood.servingSize,
        servingUnit: usdaFood.servingUnit,
        dataSource: 'USDA',
        fdcId: usdaFood.fdcId
      });

      return importedFood;
    } catch (error) {
      throw new Error(`Failed to import food from USDA: ${error.message}`);
    }
  }

  /**
   * Search and import foods from USDA
   * @param {string} query - Search query
   * @param {object} foodsData - Foods data access object
   * @param {number} maxResults - Maximum number of results to import
   * @returns {array} Imported food items
   */
  async searchAndImportFoods(query, foodsData, maxResults = 10) {
    try {
      const searchResults = await this.searchFoodsUSDA(query, maxResults);
      const importedFoods = [];

      for (const food of searchResults.foods) {
        try {
          const importedFood = await this.importFoodFromUSDA(food.fdcId, foodsData);
          importedFoods.push(importedFood);
        } catch (error) {
          console.error(`Failed to import food ${food.fdcId}:`, error.message);
        }
      }

      return importedFoods;
    } catch (error) {
      throw new Error(`Failed to search and import foods: ${error.message}`);
    }
  }

  /**
   * Get API usage statistics
   * @returns {object} API usage stats
   */
  getApiStats() {
    const stats = {};
    
    for (const [apiName, count] of this.requestCounts.entries()) {
      const config = API_CONFIGS[apiName];
      stats[apiName] = {
        requestsUsed: count,
        requestsRemaining: config.rateLimit - count,
        rateLimit: config.rateLimit,
        resetTime: new Date(this.lastReset.getTime() + 24 * 60 * 60 * 1000) // Next day
      };
    }

    return stats;
  }

  /**
   * Clear API cache
   * @param {string} pattern - Cache key pattern (optional)
   */
  clearCache(pattern = null) {
    if (pattern) {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      this.cache.del(matchingKeys);
    } else {
      this.cache.flushAll();
    }
  }
}
