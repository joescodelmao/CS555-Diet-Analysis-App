// services/nutritionalAnalysisService.js
import { NutritionalCalculationService } from "./nutritionalCalculationService.js";
import foodsData from "../data/foods.js";
import foodLogsData from "../data/foodLogs.js";
import nutritionalGoalsData from "../data/nutritionalGoals.js";

export class NutritionalAnalysisService {
  constructor() {
    this.calculationService = new NutritionalCalculationService();
  }

  /**
   * Get comprehensive nutritional analysis for a user
   * @param {string} userId - User ID
   * @param {string} date - Analysis date (YYYY-MM-DD)
   * @returns {object} Complete nutritional analysis
   */
  async getNutritionalAnalysis(userId, date) {
    try {
      // Get user's nutritional goals
      const goals = await nutritionalGoalsData.getNutritionalGoalsByUserId(userId);
      
      // Get daily food log
      const dailyLog = await foodLogsData.getDailyFoodLog(userId, date);
      
      // Calculate nutritional totals
      const totals = await this.calculateDailyNutritionTotals(dailyLog);
      
      // Perform analysis
      const analysis = this.calculationService.analyzeDailyNutrition(
        { meals: dailyLog.meals }, 
        {
          calories: goals.calories,
          protein: goals.macronutrients.protein,
          carbohydrates: goals.macronutrients.carbohydrates,
          fat: goals.macronutrients.fat
        }
      );
      
      // Add additional insights
      analysis.insights = await this.generateNutritionalInsights(totals, goals);
      analysis.trends = await this.getNutritionalTrends(userId, date, 7);
      
      return {
        date: date,
        goals: goals,
        totals: totals,
        analysis: analysis,
        dailyLog: dailyLog
      };
    } catch (error) {
      throw new Error(`Failed to get nutritional analysis: ${error.message}`);
    }
  }

  /**
   * Calculate daily nutritional totals from food log
   * @param {object} dailyLog - Daily food log
   * @returns {object} Daily nutritional totals
   */
  async calculateDailyNutritionTotals(dailyLog) {
    const totals = {
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
    
    const mealTotals = {
      breakfast: { ...totals },
      lunch: { ...totals },
      dinner: { ...totals },
      snack: { ...totals }
    };
    
    // Process each meal
    for (const [mealType, entries] of Object.entries(dailyLog.meals)) {
      if (!entries || !Array.isArray(entries)) continue;
      
      for (const entry of entries) {
        try {
          // Use nutrients from the entry if available (already populated by foodLogs.js)
          if (entry.nutrients) {
            const multiplier = entry.quantity / (entry.servingSize || 1);
            
            Object.keys(totals).forEach(nutrient => {
              const nutrientValue = entry.nutrients[nutrient] || 0;
              const consumedAmount = nutrientValue * multiplier;
              
              totals[nutrient] += consumedAmount;
              mealTotals[mealType][nutrient] += consumedAmount;
            });
          } else {
            // Fallback: get food details from database
            const food = await foodsData.getFoodById(entry.foodId);
            const multiplier = entry.quantity / food.servingSize;
            
            Object.keys(totals).forEach(nutrient => {
              const nutrientValue = food.nutrients[nutrient] || 0;
              const consumedAmount = nutrientValue * multiplier;
              
              totals[nutrient] += consumedAmount;
              mealTotals[mealType][nutrient] += consumedAmount;
            });
          }
        } catch (error) {
          console.error(`Error processing food entry ${entry._id}:`, error.message);
        }
      }
    }
    
    // Round all values to 1 decimal place
    Object.keys(totals).forEach(key => {
      totals[key] = Math.round(totals[key] * 10) / 10;
    });
    
    Object.keys(mealTotals).forEach(mealType => {
      Object.keys(mealTotals[mealType]).forEach(key => {
        mealTotals[mealType][key] = Math.round(mealTotals[mealType][key] * 10) / 10;
      });
    });
    
    return {
      daily: totals,
      byMeal: mealTotals
    };
  }

  /**
   * Generate nutritional insights and recommendations
   * @param {object} totals - Daily nutritional totals
   * @param {object} goals - User's nutritional goals
   * @returns {object} Insights and recommendations
   */
  async generateNutritionalInsights(totals, goals) {
    const insights = {
      calorieStatus: 'balanced',
      macronutrientBalance: 'good',
      micronutrientStatus: 'adequate',
      recommendations: [],
      warnings: []
    };
    
    const dailyTotals = totals.daily;
    
    // Calorie analysis
    const calorieDeficit = goals.calories - dailyTotals.calories;
    const caloriePercentage = (dailyTotals.calories / goals.calories) * 100;
    
    if (caloriePercentage < 80) {
      insights.calorieStatus = 'low';
      insights.recommendations.push('Consider adding healthy snacks to meet your calorie goals');
    } else if (caloriePercentage > 120) {
      insights.calorieStatus = 'high';
      insights.warnings.push('You are significantly over your calorie goal');
    }
    
    // Macronutrient analysis
    const proteinPercentage = (dailyTotals.protein / goals.macronutrients.protein) * 100;
    const carbsPercentage = (dailyTotals.carbohydrates / goals.macronutrients.carbohydrates) * 100;
    const fatPercentage = (dailyTotals.fat / goals.macronutrients.fat) * 100;
    
    if (proteinPercentage < 80) {
      insights.macronutrientBalance = 'needs_protein';
      insights.recommendations.push('Increase protein intake with lean meats, eggs, or legumes');
    }
    
    if (carbsPercentage < 70) {
      insights.recommendations.push('Add more complex carbohydrates like whole grains and vegetables');
    }
    
    if (fatPercentage < 70) {
      insights.recommendations.push('Include healthy fats like nuts, avocado, or olive oil');
    }
    
    // Micronutrient analysis
    if (dailyTotals.fiber < 25) {
      insights.micronutrientStatus = 'low_fiber';
      insights.recommendations.push('Increase fiber intake with fruits, vegetables, and whole grains');
    }
    
    if (dailyTotals.sodium > 2300) {
      insights.warnings.push('Sodium intake is high - consider reducing processed foods');
    }
    
    if (dailyTotals.sugar > 50) {
      insights.warnings.push('Sugar intake is high - limit added sugars');
    }
    
    return insights;
  }

  /**
   * Get nutritional trends over time
   * @param {string} userId - User ID
   * @param {string} endDate - End date for trend analysis
   * @param {number} days - Number of days to analyze
   * @returns {object} Nutritional trends
   */
  async getNutritionalTrends(userId, endDate, days = 7) {
    try {
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Get food logs for the period
      const logs = await foodLogsData.getFoodLogRange(userId, startDateStr, endDate);
      
      const trends = {
        calories: [],
        protein: [],
        carbohydrates: [],
        fat: [],
        dates: []
      };
      
      // Calculate daily totals for each day
      for (const log of logs) {
        const totals = await this.calculateDailyNutritionTotals(log);
        
        trends.calories.push(totals.daily.calories);
        trends.protein.push(totals.daily.protein);
        trends.carbohydrates.push(totals.daily.carbohydrates);
        trends.fat.push(totals.daily.fat);
        trends.dates.push(log.date);
      }
      
      // Calculate averages
      const averages = {
        calories: trends.calories.length > 0 ? 
          Math.round(trends.calories.reduce((a, b) => a + b, 0) / trends.calories.length) : 0,
        protein: trends.protein.length > 0 ? 
          Math.round((trends.protein.reduce((a, b) => a + b, 0) / trends.protein.length) * 10) / 10 : 0,
        carbohydrates: trends.carbohydrates.length > 0 ? 
          Math.round((trends.carbohydrates.reduce((a, b) => a + b, 0) / trends.carbohydrates.length) * 10) / 10 : 0,
        fat: trends.fat.length > 0 ? 
          Math.round((trends.fat.reduce((a, b) => a + b, 0) / trends.fat.length) * 10) / 10 : 0
      };
      
      return {
        trends: trends,
        averages: averages,
        period: `${days} days`
      };
    } catch (error) {
      throw new Error(`Failed to get nutritional trends: ${error.message}`);
    }
  }

  /**
   * Get meal recommendations based on nutritional goals
   * @param {string} userId - User ID
   * @param {string} mealType - Type of meal
   * @param {number} remainingCalories - Remaining calories for the day
   * @returns {object} Meal recommendations
   */
  async getMealRecommendations(userId, mealType, remainingCalories) {
    try {
      const goals = await nutritionalGoalsData.getNutritionalGoalsByUserId(userId);
      
      // Calculate target calories for this meal
      const mealCalorieTargets = {
        breakfast: goals.calories * 0.25,
        lunch: goals.calories * 0.35,
        dinner: goals.calories * 0.30,
        snack: goals.calories * 0.10
      };
      
      const targetCalories = Math.min(mealCalorieTargets[mealType] || 0, remainingCalories);
      
      // Search for foods that fit the calorie target
      const recommendations = await this.searchFoodsForMeal(mealType, targetCalories);
      
      return {
        mealType: mealType,
        targetCalories: Math.round(targetCalories),
        remainingCalories: Math.round(remainingCalories),
        recommendations: recommendations
      };
    } catch (error) {
      throw new Error(`Failed to get meal recommendations: ${error.message}`);
    }
  }

  /**
   * Search for foods suitable for a specific meal
   * @param {string} mealType - Type of meal
   * @param {number} targetCalories - Target calories
   * @returns {array} Recommended foods
   */
  async searchFoodsForMeal(mealType, targetCalories) {
    try {
      // Define meal-specific food categories
      const mealCategories = {
        breakfast: ['cereal', 'dairy', 'eggs', 'bread', 'fruit'],
        lunch: ['sandwich', 'salad', 'soup', 'meat', 'vegetables'],
        dinner: ['meat', 'fish', 'poultry', 'vegetables', 'grains'],
        snack: ['nuts', 'fruit', 'yogurt', 'crackers']
      };
      
      const categories = mealCategories[mealType] || ['general'];
      
      // Search for foods in relevant categories
      const allFoods = [];
      for (const category of categories) {
        try {
          const foods = await foodsData.searchFoods(category, 10);
          allFoods.push(...foods);
        } catch (error) {
          console.error(`Error searching foods for category ${category}:`, error.message);
        }
      }
      
      // Filter foods by calorie range (target ± 20%)
      const calorieRange = {
        min: targetCalories * 0.8,
        max: targetCalories * 1.2
      };
      
      const suitableFoods = allFoods.filter(food => {
        const calories = food.nutrients.calories;
        return calories >= calorieRange.min && calories <= calorieRange.max;
      });
      
      // Sort by calorie proximity to target
      suitableFoods.sort((a, b) => {
        const aDiff = Math.abs(a.nutrients.calories - targetCalories);
        const bDiff = Math.abs(b.nutrients.calories - targetCalories);
        return aDiff - bDiff;
      });
      
      return suitableFoods.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      throw new Error(`Failed to search foods for meal: ${error.message}`);
    }
  }

  /**
   * Calculate nutritional score for a day
   * @param {object} totals - Daily nutritional totals
   * @param {object} goals - User's nutritional goals
   * @returns {object} Nutritional score breakdown
   */
  calculateNutritionalScore(totals, goals) {
    const dailyTotals = totals.daily;
    
    const scores = {
      calories: Math.min(100, Math.round((dailyTotals.calories / goals.calories) * 100)),
      protein: Math.min(100, Math.round((dailyTotals.protein / goals.macronutrients.protein) * 100)),
      carbohydrates: Math.min(100, Math.round((dailyTotals.carbohydrates / goals.macronutrients.carbohydrates) * 100)),
      fat: Math.min(100, Math.round((dailyTotals.fat / goals.macronutrients.fat) * 100)),
      fiber: Math.min(100, Math.round((dailyTotals.fiber / 25) * 100)) // 25g daily fiber goal
    };
    
    const overallScore = Math.round(
      (scores.calories + scores.protein + scores.carbohydrates + scores.fat + scores.fiber) / 5
    );
    
    let grade;
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'F';
    
    return {
      overall: overallScore,
      grade: grade,
      breakdown: scores,
      message: this.getScoreMessage(overallScore)
    };
  }

  /**
   * Get score message based on overall score
   * @param {number} score - Overall nutritional score
   * @returns {string} Score message
   */
  getScoreMessage(score) {
    if (score >= 90) {
      return "Excellent! You're meeting all your nutritional goals.";
    } else if (score >= 80) {
      return "Great job! You're doing well with your nutrition.";
    } else if (score >= 70) {
      return "Good progress! A few adjustments could help you reach your goals.";
    } else if (score >= 60) {
      return "You're on the right track, but there's room for improvement.";
    } else {
      return "Consider focusing on meeting your basic nutritional needs.";
    }
  }
}
