// config/nutritionalAPIs.js
export const API_CONFIGS = {
  usda: {
    baseUrl: "https://api.nal.usda.gov/fdc/v1",
    apiKey: process.env.USDA_API_KEY || "",
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    },
    timeout: 10000
  }
};

export const API_ENDPOINTS = {
  usda: {
    search: "/foods/search",
    foodDetails: "/food/{fdcId}"
  }
};

