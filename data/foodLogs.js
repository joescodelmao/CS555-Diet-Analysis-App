// data/foodLogs.js
import { foodLogs } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkString } from "../helpers.js";

const exportedMethods = {
  /**
   * Add a food entry to user's daily log
   * @param {string} userId - User ID
   * @param {object} foodEntry - Food entry data
   * @returns {object} Created food log entry
   */
  async addFoodEntry(userId, foodEntry) {
    const { foodId, mealType, quantity, date } = foodEntry;
    
    // Validation
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("User ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    if (!foodId || typeof foodId !== "string" || foodId.trim().length === 0) {
      throw new Error("Food ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(foodId)) {
      throw new Error("Invalid food ID");
    }
    
    if (!mealType || typeof mealType !== "string" || mealType.trim().length === 0) {
      throw new Error("Meal type is required and must be a non-empty string");
    }
    
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      throw new Error("Quantity must be a positive number");
    }
    
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType.toLowerCase())) {
      throw new Error("Meal type must be one of: breakfast, lunch, dinner, snack");
    }
    
    const logDate = date ? new Date(date) : new Date();
    if (isNaN(logDate.getTime())) {
      throw new Error("Invalid date format");
    }
    
    const foodLogsCollection = await foodLogs();
    
    const newEntry = {
      userId: new ObjectId(userId),
      foodId: new ObjectId(foodId),
      mealType: mealType.toLowerCase(),
      quantity: quantity,
      date: logDate,
      dateAdded: new Date()
    };
    
    const insertInfo = await foodLogsCollection.insertOne(newEntry);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
      throw new Error("Could not add food entry");
    }
    
    const insertedEntry = await this.getFoodEntryById(insertInfo.insertedId.toString());
    return insertedEntry;
  },

  /**
   * Get food entry by ID
   * @param {string} id - Food entry ID
   * @returns {object} Food entry
   */
  async getFoodEntryById(id) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("Food entry ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid food entry ID");
    }
    
    const foodLogsCollection = await foodLogs();
    const entry = await foodLogsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!entry) {
      throw new Error("Food entry not found");
    }
    
    entry._id = entry._id.toString();
    entry.userId = entry.userId.toString();
    entry.foodId = entry.foodId.toString();
    
    return entry;
  },

  /**
   * Get user's food log for a specific date
   * @param {string} userId - User ID
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {object} Daily food log
   */
  async getDailyFoodLog(userId, date) {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("User ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    if (!date || typeof date !== "string" || date.trim().length === 0) {
      throw new Error("Date is required and must be a non-empty string");
    }
    
    const logDate = new Date(date);
    if (isNaN(logDate.getTime())) {
      throw new Error("Invalid date format");
    }
    
    const foodLogsCollection = await foodLogs();
    
    // Get start and end of day
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const entries = await foodLogsCollection
      .find({
        userId: new ObjectId(userId),
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .sort({ date: 1 })
      .toArray();
    
    // Import foods data to get food details
    const foodsData = await import("../data/foods.js");
    
    // Group entries by meal type and populate food details
    const meals = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };
    
    for (const entry of entries) {
      entry._id = entry._id.toString();
      entry.userId = entry.userId.toString();
      entry.foodId = entry.foodId.toString();
      
      // Get food details
      try {
        const food = await foodsData.default.getFoodById(entry.foodId);
        entry.foodName = food.name;
        entry.foodBrand = food.brand;
        entry.servingUnit = food.servingUnit;
        entry.nutrients = food.nutrients;
      } catch (error) {
        console.error(`Error loading food details for ${entry.foodId}:`, error.message);
        entry.foodName = "Unknown Food";
        entry.servingUnit = "servings";
        entry.nutrients = {};
      }
      
      if (meals[entry.mealType]) {
        meals[entry.mealType].push(entry);
      }
    }
    
    return {
      date: date,
      meals: meals,
      totalEntries: entries.length
    };
  },

  /**
   * Get user's food log for a date range
   * @param {string} userId - User ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {array} Array of daily food logs
   */
  async getFoodLogRange(userId, startDate, endDate) {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new Error("User ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid date format");
    }
    
    if (start > end) {
      throw new Error("Start date must be before end date");
    }
    
    const foodLogsCollection = await foodLogs();
    
    const entries = await foodLogsCollection
      .find({
        userId: new ObjectId(userId),
        date: {
          $gte: start,
          $lte: end
        }
      })
      .sort({ date: 1 })
      .toArray();
    
    // Group by date
    const dailyLogs = {};
    entries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      
      if (!dailyLogs[dateKey]) {
        dailyLogs[dateKey] = {
          date: dateKey,
          meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
          },
          totalEntries: 0
        };
      }
      
      entry._id = entry._id.toString();
      entry.userId = entry.userId.toString();
      entry.foodId = entry.foodId.toString();
      
      dailyLogs[dateKey].meals[entry.mealType].push(entry);
      dailyLogs[dateKey].totalEntries++;
    });
    
    return Object.values(dailyLogs);
  },

  /**
   * Update food entry
   * @param {string} id - Food entry ID
   * @param {object} updateData - Updated entry data
   * @returns {object} Updated food entry
   */
  async updateFoodEntry(id, updateData) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("Food entry ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid food entry ID");
    }
    
    if (!updateData || typeof updateData !== "object") {
      throw new Error("Update data is required and must be an object");
    }
    
    const foodLogsCollection = await foodLogs();
    
    const updateObj = {};
    
    if (updateData.mealType) {
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validMealTypes.includes(updateData.mealType.toLowerCase())) {
        throw new Error("Meal type must be one of: breakfast, lunch, dinner, snack");
      }
      updateObj.mealType = updateData.mealType.toLowerCase();
    }
    
    if (updateData.quantity) {
      if (typeof updateData.quantity !== "number" || updateData.quantity <= 0) {
        throw new Error("Quantity must be a positive number");
      }
      updateObj.quantity = updateData.quantity;
    }
    
    if (updateData.date) {
      const newDate = new Date(updateData.date);
      if (isNaN(newDate.getTime())) {
        throw new Error("Invalid date format");
      }
      updateObj.date = newDate;
    }
    
    updateObj.dateModified = new Date();
    
    const updateInfo = await foodLogsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateObj }
    );
    
    if (updateInfo.modifiedCount === 0) {
      throw new Error("Could not update food entry or entry not found");
    }
    
    return await this.getFoodEntryById(id);
  },

  /**
   * Delete food entry
   * @param {string} id - Food entry ID
   * @returns {boolean} Success status
   */
  async deleteFoodEntry(id) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("Food entry ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid food entry ID");
    }
    
    const foodLogsCollection = await foodLogs();
    const deletionInfo = await foodLogsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (deletionInfo.deletedCount === 0) {
      throw new Error("Could not delete food entry or entry not found");
    }
    
    return true;
  }
};

export default exportedMethods;
