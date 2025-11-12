// services/apiService.js
import axios from "axios";
import NodeCache from "node-cache";
import { API_CONFIGS, API_ENDPOINTS } from "../config/nutritionalAPIs.js";

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export class ApiService {
  constructor() {
    this.rateLimitTracker = {
      usda: {
        requests: [],
        lastReset: Date.now()
      }
    };
  }

  /**
   * Check and enforce rate limits
   */
  checkRateLimit(apiName) {
    const config = API_CONFIGS[apiName];
    if (!config || !config.rateLimit) return true;

    const now = Date.now();
    const tracker = this.rateLimitTracker[apiName];
    
    // Remove requests older than 1 minute
    tracker.requests = tracker.requests.filter(
      timestamp => now - timestamp < 60000
    );

    if (tracker.requests.length >= config.rateLimit.requestsPerMinute) {
      throw new Error(`Rate limit exceeded for ${apiName}. Please try again later.`);
    }

    tracker.requests.push(now);
    return true;
  }

  /**
   * Make HTTP request with error handling
   */
  async makeRequest(url, options = {}) {
    try {
      const response = await axios({
        url,
        method: options.method || "GET",
        params: options.params,
        data: options.data,
        headers: options.headers || {},
        timeout: options.timeout || 10000
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error("API request failed. Please check your internet connection.");
      } else {
        throw new Error(`API Error: ${error.message}`);
      }
    }
  }

  /**
   * Get from cache or make request
   */
  getCache(key) {
    return cache.get(key);
  }

  setCache(key, value, ttl = 3600) {
    cache.set(key, value, ttl);
  }

  /**
   * Search USDA foods
   */
  async searchUSDAFoods(query, pageSize = 20) {
    const cacheKey = `usda_search_${query}_${pageSize}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    this.checkRateLimit("usda");

    const config = API_CONFIGS.usda;
    const url = `${config.baseUrl}${API_ENDPOINTS.usda.search}`;
    
    const params = {
      query: query,
      pageSize: pageSize,
      api_key: config.apiKey
    };

    try {
      const data = await this.makeRequest(url, { params });
      
      // Transform USDA response to our format
      const foods = (data.foods || []).map(food => {
        const nutrients = {};
        if (food.foodNutrients) {
          food.foodNutrients.forEach(nutrient => {
            const nutrientName = nutrient.nutrientName?.toLowerCase() || "";
            const value = nutrient.value || 0;
            
            if (nutrientName.includes("energy")) {
              nutrients.calories = value;
            } else if (nutrientName.includes("protein")) {
              nutrients.protein = value;
            } else if (nutrientName.includes("carbohydrate") || nutrientName.includes("carb")) {
              nutrients.carbohydrates = value;
            } else if (nutrientName.includes("total lipid") || nutrientName.includes("fat")) {
              nutrients.fat = value;
            } else if (nutrientName.includes("fiber")) {
              nutrients.fiber = value;
            } else if (nutrientName.includes("sugars")) {
              nutrients.sugar = value;
            } else if (nutrientName.includes("sodium")) {
              nutrients.sodium = value;
            }
          });
        }

        return {
          fdcId: food.fdcId,
          name: food.description || food.brandOwner || "Unknown",
          brand: food.brandOwner || null,
          category: food.brandedFoodCategory || food.foodCategory?.description || null,
          nutrients: nutrients,
          servingSize: 100, // USDA default
          servingUnit: "g",
          source: "usda",
          sourceId: food.fdcId?.toString()
        };
      });

      const result = { foods, totalHits: data.totalHits || 0 };
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(`USDA search failed: ${error.message}`);
    }
  }

  /**
   * Get USDA food details
   */
  async getUSDAFoodDetails(fdcId) {
    const cacheKey = `usda_food_${fdcId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    this.checkRateLimit("usda");

    const config = API_CONFIGS.usda;
    const url = `${config.baseUrl}${API_ENDPOINTS.usda.foodDetails.replace("{fdcId}", fdcId)}`;
    
    const params = {
      api_key: config.apiKey
    };

    try {
      const food = await this.makeRequest(url, { params });
      
      // Transform to our format
      const nutrients = {};
      if (food.foodNutrients) {
        food.foodNutrients.forEach(nutrient => {
          const nutrientName = nutrient.nutrientName?.toLowerCase() || "";
          const value = nutrient.value || 0;
          
          if (nutrientName.includes("energy")) {
            nutrients.calories = value;
          } else if (nutrientName.includes("protein")) {
            nutrients.protein = value;
          } else if (nutrientName.includes("carbohydrate") || nutrientName.includes("carb")) {
            nutrients.carbohydrates = value;
          } else if (nutrientName.includes("total lipid") || nutrientName.includes("fat")) {
            nutrients.fat = value;
          } else if (nutrientName.includes("fiber")) {
            nutrients.fiber = value;
          } else if (nutrientName.includes("sugars")) {
            nutrients.sugar = value;
          } else if (nutrientName.includes("sodium")) {
            nutrients.sodium = value;
          } else if (nutrientName.includes("cholesterol")) {
            nutrients.cholesterol = value;
          } else if (nutrientName.includes("saturated")) {
            nutrients.saturatedFat = value;
          } else if (nutrientName.includes("trans")) {
            nutrients.transFat = value;
          }
        });
      }

      const result = {
        fdcId: food.fdcId,
        name: food.description || food.brandOwner || "Unknown",
        brand: food.brandOwner || null,
        category: food.brandedFoodCategory || food.foodCategory?.description || null,
        nutrients: nutrients,
        servingSize: 100,
        servingUnit: "g",
        source: "usda",
        sourceId: food.fdcId?.toString()
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(`USDA food details failed: ${error.message}`);
    }
  }
}

export default new ApiService();

