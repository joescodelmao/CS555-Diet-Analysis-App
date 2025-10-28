// config/nutritionalAPIs.js
export const API_CONFIGS = {
  usda: {
    baseUrl: 'https://api.nal.usda.gov/fdc/v1',
    apiKey: process.env.USDA_API_KEY,
    rateLimit: 1000, // per day
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CS555-Diet-Analysis-App/1.0.0'
    }
  }
};

export const API_ENDPOINTS = {
  usda: {
    search: '/foods/search',
    food: '/food',
    nutrients: '/foods/{fdcId}/nutrients'
  }
};

export const NUTRIENT_MAPPING = {
  // USDA nutrient IDs to our standard names
  1008: 'calories', // Energy
  1003: 'protein', // Protein
  1005: 'carbohydrates', // Carbohydrate, by difference
  1004: 'fat', // Total lipid (fat)
  1079: 'fiber', // Fiber, total dietary
  2000: 'sugar', // Sugars, total including NLEA
  1093: 'sodium', // Sodium, Na
  1258: 'saturatedFat', // Fatty acids, total saturated
  1257: 'transFat', // Fatty acids, total trans
  1253: 'cholesterol', // Cholesterol
  1087: 'potassium', // Potassium, K
  1087: 'calcium', // Calcium, Ca
  1089: 'iron', // Iron, Fe
  1106: 'vitaminA', // Vitamin A, RAE
  1162: 'vitaminC' // Vitamin C, total ascorbic acid
};
