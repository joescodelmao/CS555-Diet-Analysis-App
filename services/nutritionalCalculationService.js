// services/nutritionalCalculationService.js
export class NutritionalCalculationService {
  
  /**
   * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
   * @param {number} weight - Weight in kg
   * @param {number} height - Height in cm
   * @param {number} age - Age in years
   * @param {string} gender - 'male' or 'female'
   * @returns {number} BMR in calories
   */
  calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age || !gender) {
      throw new Error('All parameters (weight, height, age, gender) are required');
    }
    
    if (weight <= 0 || height <= 0 || age <= 0) {
      throw new Error('Weight, height, and age must be positive numbers');
    }
    
    const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
    
    return gender.toLowerCase() === 'male' 
      ? baseBMR + 5 
      : baseBMR - 161;
  }

  /**
   * Calculate Total Daily Energy Expenditure
   * @param {number} bmr - Basal Metabolic Rate
   * @param {string} activityLevel - Activity level string
   * @returns {number} TDEE in calories
   */
  calculateTDEE(bmr, activityLevel) {
    if (!bmr || !activityLevel) {
      throw new Error('BMR and activity level are required');
    }
    
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extremely_active': 1.9
    };
    
    const multiplier = activityMultipliers[activityLevel.toLowerCase()];
    if (!multiplier) {
      throw new Error('Invalid activity level. Must be one of: sedentary, lightly_active, moderately_active, very_active, extremely_active');
    }
    
    return Math.round(bmr * multiplier);
  }

  /**
   * Calculate Body Mass Index
   * @param {number} weight - Weight in kg
   * @param {number} height - Height in cm
   * @returns {object} BMI value and category
   */
  calculateBMI(weight, height) {
    if (!weight || !height) {
      throw new Error('Weight and height are required');
    }
    
    if (weight <= 0 || height <= 0) {
      throw new Error('Weight and height must be positive numbers');
    }
    
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category;
    if (bmi < 18.5) {
      category = 'Underweight';
    } else if (bmi < 25) {
      category = 'Normal weight';
    } else if (bmi < 30) {
      category = 'Overweight';
    } else {
      category = 'Obese';
    }
    
    return {
      value: Math.round(bmi * 10) / 10,
      category: category
    };
  }

  /**
   * Calculate macronutrient distribution
   * @param {number} totalCalories - Total daily calories
   * @param {object} distribution - Macronutrient percentages
   * @returns {object} Macronutrient breakdown in grams and calories
   */
  calculateMacronutrients(totalCalories, distribution = {}) {
    if (!totalCalories || totalCalories <= 0) {
      throw new Error('Total calories must be a positive number');
    }
    
    // Default distribution if not provided
    const defaultDistribution = {
      protein: 25,
      carbohydrates: 45,
      fat: 30
    };
    
    const proteinPercent = distribution.protein || defaultDistribution.protein;
    const carbsPercent = distribution.carbohydrates || defaultDistribution.carbohydrates;
    const fatPercent = distribution.fat || defaultDistribution.fat;
    
    // Validate percentages add up to 100
    const totalPercent = proteinPercent + carbsPercent + fatPercent;
    if (Math.abs(totalPercent - 100) > 0.1) {
      throw new Error('Macronutrient percentages must add up to 100%');
    }
    
    const proteinCalories = (totalCalories * proteinPercent) / 100;
    const carbsCalories = (totalCalories * carbsPercent) / 100;
    const fatCalories = (totalCalories * fatPercent) / 100;
    
    return {
      protein: {
        calories: Math.round(proteinCalories),
        grams: Math.round((proteinCalories / 4) * 10) / 10
      },
      carbohydrates: {
        calories: Math.round(carbsCalories),
        grams: Math.round((carbsCalories / 4) * 10) / 10
      },
      fat: {
        calories: Math.round(fatCalories),
        grams: Math.round((fatCalories / 9) * 10) / 10
      }
    };
  }

  /**
   * Calculate calorie deficit/surplus for weight goals
   * @param {number} tdee - Total Daily Energy Expenditure
   * @param {string} goal - Weight goal type
   * @param {number} weeklyChange - Desired weekly weight change in pounds
   * @returns {number} Target daily calories
   */
  calculateTargetCalories(tdee, goal, weeklyChange = 1) {
    if (!tdee || !goal) {
      throw new Error('TDEE and goal are required');
    }
    
    const caloriesPerPound = 3500;
    const dailyCalorieChange = (weeklyChange * caloriesPerPound) / 7;
    
    switch (goal.toLowerCase()) {
      case 'weight_loss':
        return Math.round(tdee - dailyCalorieChange);
      case 'weight_gain':
        return Math.round(tdee + dailyCalorieChange);
      case 'maintenance':
        return Math.round(tdee);
      default:
        throw new Error('Invalid goal. Must be: weight_loss, weight_gain, or maintenance');
    }
  }

  /**
   * Analyze daily nutritional intake
   * @param {object} foodLog - Daily food log
   * @param {object} goals - Nutritional goals
   * @returns {object} Analysis results
   */
  analyzeDailyNutrition(foodLog, goals) {
    if (!foodLog || !goals) {
      throw new Error('Food log and goals are required');
    }
    
    const totals = this.calculateDailyTotals(foodLog);
    const analysis = {
      totals: totals,
      goals: goals,
      deficits: {},
      recommendations: []
    };
    
    // Calculate deficits
    analysis.deficits.calories = goals.calories - totals.calories;
    analysis.deficits.protein = goals.protein - totals.protein;
    analysis.deficits.carbohydrates = goals.carbohydrates - totals.carbohydrates;
    analysis.deficits.fat = goals.fat - totals.fat;
    
    // Generate recommendations
    if (analysis.deficits.calories < 0) {
      analysis.recommendations.push('You are over your calorie goal. Consider reducing portion sizes.');
    } else if (analysis.deficits.calories > 200) {
      analysis.recommendations.push('You are significantly under your calorie goal. Consider adding healthy snacks.');
    }
    
    if (analysis.deficits.protein < 0) {
      analysis.recommendations.push('Consider adding more protein-rich foods like lean meats, eggs, or legumes.');
    }
    
    if (analysis.deficits.fat < 0) {
      analysis.recommendations.push('Consider adding healthy fats like nuts, avocado, or olive oil.');
    }
    
    return analysis;
  }

  /**
   * Calculate daily nutritional totals from food log
   * @param {object} foodLog - Daily food log
   * @returns {object} Daily totals
   */
  calculateDailyTotals(foodLog) {
    const totals = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };
    
    if (foodLog.meals) {
      foodLog.meals.forEach(meal => {
        if (meal.foods) {
          meal.foods.forEach(food => {
            if (food.nutrients) {
              totals.calories += food.nutrients.calories || 0;
              totals.protein += food.nutrients.protein || 0;
              totals.carbohydrates += food.nutrients.carbohydrates || 0;
              totals.fat += food.nutrients.fat || 0;
              totals.fiber += food.nutrients.fiber || 0;
              totals.sugar += food.nutrients.sugar || 0;
              totals.sodium += food.nutrients.sodium || 0;
            }
          });
        }
      });
    }
    
    // Round to 1 decimal place
    Object.keys(totals).forEach(key => {
      totals[key] = Math.round(totals[key] * 10) / 10;
    });
    
    return totals;
  }
}
