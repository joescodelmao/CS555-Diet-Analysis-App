// services/nutritionalAnalysisService.js
import { NutritionalCalculationService } from "./nutritionalCalculationService.js";
import { getNutritionalGoalsByUserId } from "../data/nutritionalGoals.js";
import { getDailyFoodLog } from "../data/foodLogs.js";

export class NutritionalAnalysisService {
  constructor() {
    this.calculationService = new NutritionalCalculationService();
  }

  /**
   * Get comprehensive nutritional analysis for a user
   */
  async getNutritionalAnalysis(userId, date = null) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const targetDate = date || new Date().toISOString().split("T")[0];
    
    // Get goals and daily log
    const goals = await getNutritionalGoalsByUserId(userId);
    const dailyLog = await getDailyFoodLog(userId, targetDate);

    if (!goals) {
      return {
        hasGoals: false,
        message: "Please set up your nutritional goals first",
        dailyLog: dailyLog
      };
    }

    // Calculate totals from food log
    const totals = this.calculateDailyNutritionTotals(dailyLog);

    // Generate recommendations
    const recommendations = this.generateRecommendations(totals, goals);

    return {
      hasGoals: true,
      goals: goals,
      dailyLog: dailyLog,
      totals: totals,
      deficits: {
        calories: goals.calories - totals.calories,
        protein: goals.macronutrients.protein.grams - totals.protein,
        carbohydrates: goals.macronutrients.carbohydrates.grams - totals.carbohydrates,
        fat: goals.macronutrients.fat.grams - totals.fat
      },
      recommendations: recommendations,
      progress: {
        calories: Math.round((totals.calories / goals.calories) * 100),
        protein: Math.round((totals.protein / goals.macronutrients.protein.grams) * 100),
        carbohydrates: Math.round((totals.carbohydrates / goals.macronutrients.carbohydrates.grams) * 100),
        fat: Math.round((totals.fat / goals.macronutrients.fat.grams) * 100)
      }
    };
  }

  /**
   * Calculate daily nutrition totals from food log
   */
  calculateDailyNutritionTotals(dailyLog) {
    const totals = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    if (!dailyLog || !dailyLog.meals) {
      return totals;
    }

    const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];
    mealTypes.forEach(mealType => {
      if (dailyLog.meals[mealType]) {
        dailyLog.meals[mealType].forEach(entry => {
          if (entry.food && entry.food.nutrients) {
            const multiplier = entry.quantity / (entry.food.servingSize || 1);
            totals.calories += (entry.food.nutrients.calories || 0) * multiplier;
            totals.protein += (entry.food.nutrients.protein || 0) * multiplier;
            totals.carbohydrates += (entry.food.nutrients.carbohydrates || 0) * multiplier;
            totals.fat += (entry.food.nutrients.fat || 0) * multiplier;
            totals.fiber += (entry.food.nutrients.fiber || 0) * multiplier;
            totals.sugar += (entry.food.nutrients.sugar || 0) * multiplier;
            totals.sodium += (entry.food.nutrients.sodium || 0) * multiplier;
          }
        });
      }
    });

    // Round to 1 decimal place
    Object.keys(totals).forEach(key => {
      totals[key] = Math.round(totals[key] * 10) / 10;
    });

    return totals;
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(totals, goals) {
    const recommendations = [];
    const calorieDeficit = goals.calories - totals.calories;
    const proteinDeficit = goals.macronutrients.protein.grams - totals.protein;
    const carbDeficit = goals.macronutrients.carbohydrates.grams - totals.carbohydrates;
    const fatDeficit = goals.macronutrients.fat.grams - totals.fat;

    // Calorie recommendations
    if (calorieDeficit < -200) {
      recommendations.push({
        type: "warning",
        message: "You're over your calorie goal. Consider reducing portion sizes or choosing lower-calorie options."
      });
    } else if (calorieDeficit > 200) {
      recommendations.push({
        type: "info",
        message: "You have room for more calories. Consider adding healthy snacks like nuts, fruits, or yogurt."
      });
    }

    // Protein recommendations
    if (proteinDeficit > 20) {
      recommendations.push({
        type: "info",
        message: "Add more protein to reach your goal. Try lean meats, eggs, legumes, or Greek yogurt."
      });
    } else if (proteinDeficit < -10) {
      recommendations.push({
        type: "success",
        message: "Great job meeting your protein goal!"
      });
    }

    // Carbohydrate recommendations
    if (carbDeficit > 30) {
      recommendations.push({
        type: "info",
        message: "Consider adding whole grains, fruits, or vegetables to meet your carbohydrate goal."
      });
    }

    // Fat recommendations
    if (fatDeficit > 15) {
      recommendations.push({
        type: "info",
        message: "Add healthy fats like avocado, nuts, or olive oil to your meals."
      });
    }

    // General recommendations
    if (totals.fiber < 25) {
      recommendations.push({
        type: "info",
        message: "Increase fiber intake with whole grains, fruits, and vegetables for better digestion."
      });
    }

    if (totals.sodium > 2300) {
      recommendations.push({
        type: "warning",
        message: "Your sodium intake is high. Consider reducing processed foods and adding more fresh ingredients."
      });
    }

    return recommendations;
  }
}

export default new NutritionalAnalysisService();

