// data/nutritionalGoals.js
import { nutritionalGoals } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkString } from "../helpers.js";

const exportedMethods = {
  /**
   * Create nutritional goals for a user
   * @param {string} userId - User ID
   * @param {object} goalsData - Goals data
   * @returns {object} Created nutritional goals
   */
  async createNutritionalGoals(userId, goalsData) {
    const { 
      calories, 
      protein, 
      carbohydrates, 
      fat, 
      fiber, 
      goalType, 
      targetWeight, 
      weeklyWeightChange 
    } = goalsData;
    
    // Validation
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("User ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    if (!calories || typeof calories !== "number" || calories <= 0) {
      throw new Error("Calories must be a positive number");
    }
    
    if (!protein || typeof protein !== "number" || protein < 0) {
      throw new Error("Protein must be a non-negative number");
    }
    
    if (!carbohydrates || typeof carbohydrates !== "number" || carbohydrates < 0) {
      throw new Error("Carbohydrates must be a non-negative number");
    }
    
    if (!fat || typeof fat !== "number" || fat < 0) {
      throw new Error("Fat must be a non-negative number");
    }
    
    if (!goalType || typeof goalType !== "string" || goalType.trim().length === 0) {
      throw new Error("Goal type is required and must be a non-empty string");
    }
    
    const validGoalTypes = ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain'];
    if (!validGoalTypes.includes(goalType.toLowerCase())) {
      throw new Error("Goal type must be one of: weight_loss, weight_gain, maintenance, muscle_gain");
    }
    
    const nutritionalGoalsCollection = await nutritionalGoals();
    
    // Check if user already has goals
    const existingGoals = await nutritionalGoalsCollection.findOne({ 
      userId: new ObjectId(userId) 
    });
    
    if (existingGoals) {
      throw new Error("User already has nutritional goals. Use update method instead.");
    }
    
    const newGoals = {
      userId: new ObjectId(userId),
      calories: calories,
      macronutrients: {
        protein: protein,
        carbohydrates: carbohydrates,
        fat: fat,
        fiber: fiber || 25 // Default fiber goal
      },
      goalType: goalType.toLowerCase(),
      targetWeight: targetWeight || null,
      weeklyWeightChange: weeklyWeightChange || 1,
      isActive: true,
      dateCreated: new Date(),
      dateModified: new Date()
    };
    
    const insertInfo = await nutritionalGoalsCollection.insertOne(newGoals);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
      throw new Error("Could not create nutritional goals");
    }
    
    const insertedGoals = await this.getNutritionalGoalsByUserId(userId);
    return insertedGoals;
  },

  /**
   * Get nutritional goals by user ID
   * @param {string} userId - User ID
   * @returns {object} User's nutritional goals
   */
  async getNutritionalGoalsByUserId(userId) {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("User ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const nutritionalGoalsCollection = await nutritionalGoals();
    const goals = await nutritionalGoalsCollection.findOne({ 
      userId: new ObjectId(userId),
      isActive: true 
    });
    
    if (!goals) {
      throw new Error("No active nutritional goals found for user");
    }
    
    goals._id = goals._id.toString();
    goals.userId = goals.userId.toString();
    
    return goals;
  },

  /**
   * Update nutritional goals
   * @param {string} userId - User ID
   * @param {object} updateData - Updated goals data
   * @returns {object} Updated nutritional goals
   */
  async updateNutritionalGoals(userId, updateData) {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("User ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    if (!updateData || typeof updateData !== "object") {
      throw new Error("Update data is required and must be an object");
    }
    
    const nutritionalGoalsCollection = await nutritionalGoals();
    
    const updateObj = {};
    
    if (updateData.calories !== undefined) {
      if (typeof updateData.calories !== "number" || updateData.calories <= 0) {
        throw new Error("Calories must be a positive number");
      }
      updateObj.calories = updateData.calories;
    }
    
    if (updateData.macronutrients) {
      if (typeof updateData.macronutrients !== "object") {
        throw new Error("Macronutrients must be an object");
      }
      
      const macros = updateData.macronutrients;
      if (macros.protein !== undefined && (typeof macros.protein !== "number" || macros.protein < 0)) {
        throw new Error("Protein must be a non-negative number");
      }
      
      if (macros.carbohydrates !== undefined && (typeof macros.carbohydrates !== "number" || macros.carbohydrates < 0)) {
        throw new Error("Carbohydrates must be a non-negative number");
      }
      
      if (macros.fat !== undefined && (typeof macros.fat !== "number" || macros.fat < 0)) {
        throw new Error("Fat must be a non-negative number");
      }
      
      if (macros.fiber !== undefined && (typeof macros.fiber !== "number" || macros.fiber < 0)) {
        throw new Error("Fiber must be a non-negative number");
      }
      
      updateObj.macronutrients = updateData.macronutrients;
    }
    
    if (updateData.goalType) {
      const validGoalTypes = ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain'];
      if (!validGoalTypes.includes(updateData.goalType.toLowerCase())) {
        throw new Error("Goal type must be one of: weight_loss, weight_gain, maintenance, muscle_gain");
      }
      updateObj.goalType = updateData.goalType.toLowerCase();
    }
    
    if (updateData.targetWeight !== undefined) {
      if (updateData.targetWeight !== null && (typeof updateData.targetWeight !== "number" || updateData.targetWeight <= 0)) {
        throw new Error("Target weight must be a positive number or null");
      }
      updateObj.targetWeight = updateData.targetWeight;
    }
    
    if (updateData.weeklyWeightChange !== undefined) {
      if (typeof updateData.weeklyWeightChange !== "number" || updateData.weeklyWeightChange <= 0) {
        throw new Error("Weekly weight change must be a positive number");
      }
      updateObj.weeklyWeightChange = updateData.weeklyWeightChange;
    }
    
    if (updateData.isActive !== undefined) {
      if (typeof updateData.isActive !== "boolean") {
        throw new Error("isActive must be a boolean");
      }
      updateObj.isActive = updateData.isActive;
    }
    
    updateObj.dateModified = new Date();
    
    const updateInfo = await nutritionalGoalsCollection.updateOne(
      { userId: new ObjectId(userId) },
      { $set: updateObj }
    );
    
    if (updateInfo.modifiedCount === 0) {
      throw new Error("Could not update nutritional goals or goals not found");
    }
    
    return await this.getNutritionalGoalsByUserId(userId);
  },

  /**
   * Deactivate nutritional goals (soft delete)
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async deactivateNutritionalGoals(userId) {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("User ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const nutritionalGoalsCollection = await nutritionalGoals();
    const updateInfo = await nutritionalGoalsCollection.updateOne(
      { userId: new ObjectId(userId) },
      { 
        $set: { 
          isActive: false,
          dateModified: new Date()
        } 
      }
    );
    
    if (updateInfo.modifiedCount === 0) {
      throw new Error("Could not deactivate nutritional goals or goals not found");
    }
    
    return true;
  },

  /**
   * Get all nutritional goals (admin function)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {object} Paginated nutritional goals
   */
  async getAllNutritionalGoals(page = 1, limit = 20) {
    if (typeof page !== "number" || page < 1) {
      throw new Error("Page must be a positive number");
    }
    
    if (typeof limit !== "number" || limit <= 0 || limit > 100) {
      throw new Error("Limit must be a positive number between 1 and 100");
    }
    
    const nutritionalGoalsCollection = await nutritionalGoals();
    const skip = (page - 1) * limit;
    
    const goalsList = await nutritionalGoalsCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ dateCreated: -1 })
      .toArray();
    
    const totalCount = await nutritionalGoalsCollection.countDocuments({});
    
    return {
      goals: goalsList.map(goals => {
        goals._id = goals._id.toString();
        goals.userId = goals.userId.toString();
        return goals;
      }),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    };
  }
};

export default exportedMethods;
