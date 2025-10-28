// routes/nutritional.js
import express from "express";
import { NutritionalAnalysisService } from "../services/nutritionalAnalysisService.js";
import { ApiService } from "../services/apiService.js";
import foodsData from "../data/foods.js";
import foodLogsData from "../data/foodLogs.js";
import nutritionalGoalsData from "../data/nutritionalGoals.js";

const router = express.Router();
const analysisService = new NutritionalAnalysisService();
const apiService = new ApiService();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /api/nutritional/analysis/:date
 * Get nutritional analysis for a specific date
 */
router.get("/analysis/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.session.user._id;
    
    const analysis = await analysisService.getNutritionalAnalysis(userId, date);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/goals
 * Get user's nutritional goals
 */
router.get("/goals", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const goals = await nutritionalGoalsData.getNutritionalGoalsByUserId(userId);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nutritional/goals/setup
 * Set up default nutritional goals for new users
 */
router.post("/goals/setup", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { weight, height, age, gender, activityLevel, goalType } = req.body;
    
    // Calculate BMR and TDEE
    const analysisService = new NutritionalAnalysisService();
    const bmr = analysisService.calculationService.calculateBMR(weight, height, age, gender);
    const tdee = analysisService.calculationService.calculateTDEE(bmr, activityLevel);
    
    // Calculate target calories based on goal
    const targetCalories = analysisService.calculationService.calculateTargetCalories(tdee, goalType, 1);
    
    // Calculate macronutrients
    const macros = analysisService.calculationService.calculateMacronutrients(targetCalories);
    
    const goalsData = {
      calories: targetCalories,
      protein: macros.protein.grams,
      carbohydrates: macros.carbohydrates.grams,
      fat: macros.fat.grams,
      fiber: 25,
      goalType: goalType,
      targetWeight: goalType === 'maintenance' ? weight : null,
      weeklyWeightChange: 1
    };
    
    let goals;
    try {
      goals = await nutritionalGoalsData.createNutritionalGoals(userId, goalsData);
    } catch (error) {
      if (error.message.includes("already has nutritional goals")) {
        goals = await nutritionalGoalsData.updateNutritionalGoals(userId, goalsData);
      } else {
        throw error;
      }
    }
    
    res.json({
      success: true,
      goals: goals,
      calculations: {
        bmr: bmr,
        tdee: tdee,
        targetCalories: targetCalories,
        macros: macros
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nutritional/goals
 * Create or update nutritional goals
 */
router.post("/goals", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const goalsData = req.body;
    
    let goals;
    try {
      // Try to update existing goals
      goals = await nutritionalGoalsData.updateNutritionalGoals(userId, goalsData);
    } catch (error) {
      if (error.message.includes("not found")) {
        // Create new goals if none exist
        goals = await nutritionalGoalsData.createNutritionalGoals(userId, goalsData);
      } else {
        throw error;
      }
    }
    
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/foods/search
 * Search for foods
 */
router.get("/foods/search", async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const foods = await foodsData.searchFoods(q, parseInt(limit));
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/foods/:id
 * Get food details by ID
 */
router.get("/foods/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const food = await foodsData.getFoodById(id);
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nutritional/foods
 * Add a new food item
 */
router.post("/foods", async (req, res) => {
  try {
    const foodData = req.body;
    const food = await foodsData.addFood(foodData);
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/food-log/:date
 * Get daily food log
 */
router.get("/food-log/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.session.user._id;
    
    const dailyLog = await foodLogsData.getDailyFoodLog(userId, date);
    res.json(dailyLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nutritional/food-log
 * Add food entry to daily log
 */
router.post("/food-log", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const foodEntry = req.body;
    
    const entry = await foodLogsData.addFoodEntry(userId, foodEntry);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/nutritional/food-log/:id
 * Update food entry
 */
router.put("/food-log/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const entry = await foodLogsData.updateFoodEntry(id, updateData);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/nutritional/food-log/:id
 * Delete food entry
 */
router.delete("/food-log/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await foodLogsData.deleteFoodEntry(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/trends/:endDate/:days
 * Get nutritional trends
 */
router.get("/trends/:endDate/:days", async (req, res) => {
  try {
    const { endDate, days } = req.params;
    const userId = req.session.user._id;
    
    const trends = await analysisService.getNutritionalTrends(userId, endDate, parseInt(days));
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/recommendations/:mealType
 * Get meal recommendations
 */
router.get("/recommendations/:mealType", async (req, res) => {
  try {
    const { mealType } = req.params;
    const { remainingCalories = 500 } = req.query;
    const userId = req.session.user._id;
    
    const recommendations = await analysisService.getMealRecommendations(
      userId, 
      mealType, 
      parseInt(remainingCalories)
    );
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nutritional/usda/import
 * Import food from USDA API
 */
router.post("/usda/import", async (req, res) => {
  try {
    const { fdcId } = req.body;
    
    if (!fdcId) {
      return res.status(400).json({ error: "USDA food ID is required" });
    }
    
    const importedFood = await apiService.importFoodFromUSDA(fdcId, foodsData);
    res.json(importedFood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/usda/search
 * Search USDA API
 */
router.get("/usda/search", async (req, res) => {
  try {
    const { q, pageSize = 25, pageNumber = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const results = await apiService.searchFoodsUSDA(q, parseInt(pageSize), parseInt(pageNumber));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/stats
 * Get API usage statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = apiService.getApiStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
