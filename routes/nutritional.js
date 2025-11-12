// routes/nutritional.js
import express from "express";
import { NutritionalCalculationService } from "../services/nutritionalCalculationService.js";
import nutritionalAnalysisService from "../services/nutritionalAnalysisService.js";
import apiService from "../services/apiService.js";
import { createNutritionalGoals, getNutritionalGoalsByUserId, updateNutritionalGoals } from "../data/nutritionalGoals.js";
import { addFood, getFoodById, searchFoods } from "../data/foods.js";
import { addFoodLogEntry, getDailyFoodLog, deleteFoodLogEntry } from "../data/foodLogs.js";

const router = express.Router();
const calculationService = new NutritionalCalculationService();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/nutritional/goals
 * Get user's nutritional goals
 */
router.get("/goals", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const goals = await getNutritionalGoalsByUserId(userId);
    
    if (!goals) {
      return res.json({ hasGoals: false });
    }
    
    res.json({ hasGoals: true, goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nutritional/goals/setup
 * Set up initial nutritional goals based on user input
 */
router.post("/goals/setup", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { weight, height, age, gender, activityLevel, goalType, weeklyChange } = req.body;

    // Validation
    if (!weight || !height || !age || !gender || !activityLevel || !goalType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Calculate BMR, TDEE, BMI
    const bmr = calculationService.calculateBMR(
      parseFloat(weight),
      parseFloat(height),
      parseInt(age),
      gender
    );

    const tdee = calculationService.calculateTDEE(bmr, activityLevel);
    const bmi = calculationService.calculateBMI(parseFloat(weight), parseFloat(height));

    // Calculate target calories
    const targetCalories = calculationService.calculateTargetCalories(
      tdee,
      goalType,
      parseFloat(weeklyChange) || 1
    );

    // Calculate macronutrients
    const macros = calculationService.calculateMacronutrients(targetCalories);

    // Create goals
    const goals = await createNutritionalGoals(userId, {
      calories: targetCalories,
      protein: macros.protein.grams,
      carbohydrates: macros.carbohydrates.grams,
      fat: macros.fat.grams,
      activityLevel,
      goalType,
      bmr,
      tdee,
      bmi: bmi.value
    });

    res.json({ success: true, goals });
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

    const existingGoals = await getNutritionalGoalsByUserId(userId);
    let goals;

    if (existingGoals) {
      goals = await updateNutritionalGoals(userId, goalsData);
    } else {
      if (!goalsData.calories || !goalsData.protein || !goalsData.carbohydrates || !goalsData.fat) {
        return res.status(400).json({ error: "Missing required fields: calories, protein, carbohydrates, fat" });
      }
      goals = await createNutritionalGoals(userId, goalsData);
    }

    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/daily-log
 * Get daily food log and calculated totals
 */
router.get("/daily-log", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const analysis = await nutritionalAnalysisService.getNutritionalAnalysis(userId, date);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/nutritional/log-food
 * Add a food item to the daily log
 */
router.post("/log-food", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { foodId, mealType, quantity, date } = req.body;

    if (!foodId || !mealType || !quantity) {
      return res.status(400).json({ error: "Missing required fields: foodId, mealType, quantity" });
    }

    const dailyLog = await addFoodLogEntry(userId, {
      foodId,
      mealType,
      quantity: parseFloat(quantity),
      date
    });

    res.json({ success: true, dailyLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/nutritional/log-food/:id
 * Remove a food item from the daily log
 */
router.delete("/log-food/:id", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const entryId = req.params.id;
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const dailyLog = await deleteFoodLogEntry(userId, date, entryId);
    res.json({ success: true, dailyLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/search-food
 * Search for food items
 */
router.get("/search-food", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Try USDA API first
    try {
      const usdaResults = await apiService.searchUSDAFoods(query, 20);
      
      // Save USDA foods to database
      const savedFoods = [];
      for (const food of usdaResults.foods) {
        try {
          const savedFood = await addFood(food);
          savedFoods.push(savedFood);
        } catch (error) {
          // Food might already exist, try to get it
          if (food.sourceId) {
            try {
              const existingFoods = await searchFoods(food.name, 1);
              if (existingFoods.length > 0) {
                savedFoods.push(existingFoods[0]);
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      return res.json({ foods: savedFoods, source: "usda" });
    } catch (usdaError) {
      // Fallback to local database search
      const localFoods = await searchFoods(query, 20);
      return res.json({ foods: localFoods, source: "local" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nutritional/food-details/:id
 * Get detailed nutritional information for a food item
 */
router.get("/food-details/:id", async (req, res) => {
  try {
    const foodId = req.params.id;
    const source = req.query.source || "local";

    if (source === "usda" && foodId.startsWith("fdc")) {
      // Get from USDA API
      const fdcId = foodId.replace("fdc", "");
      const foodData = await apiService.getUSDAFoodDetails(fdcId);
      
      // Save to database
      try {
        const savedFood = await addFood(foodData);
        return res.json(savedFood);
      } catch (error) {
        // Food might already exist
        const existingFoods = await searchFoods(foodData.name, 1);
        if (existingFoods.length > 0) {
          return res.json(existingFoods[0]);
        }
        throw error;
      }
    } else {
      // Get from local database
      const food = await getFoodById(foodId);
      return res.json(food);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

