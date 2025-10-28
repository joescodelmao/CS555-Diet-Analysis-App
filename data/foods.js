// data/foods.js
import { foods } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkString } from "../helpers.js";

const exportedMethods = {
  /**
   * Add a new food item to the database
   * @param {object} foodData - Food information
   * @returns {object} Created food item
   */
  async addFood(foodData) {
    const { name, brand, category, nutrients, servingSize, servingUnit } = foodData;
    
    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error("Food name is required and must be a non-empty string");
    }
    
    if (!nutrients || typeof nutrients !== "object") {
      throw new Error("Nutrients information is required");
    }
    
    if (!servingSize || typeof servingSize !== "number" || servingSize <= 0) {
      throw new Error("Serving size must be a positive number");
    }
    
    if (!servingUnit || typeof servingUnit !== "string" || servingUnit.trim().length === 0) {
      throw new Error("Serving unit is required and must be a non-empty string");
    }
    
    // Validate nutrients
    const requiredNutrients = ['calories', 'protein', 'carbohydrates', 'fat'];
    for (const nutrient of requiredNutrients) {
      if (typeof nutrients[nutrient] !== "number" || nutrients[nutrient] < 0) {
        throw new Error(`${nutrient} must be a non-negative number`);
      }
    }
    
    const foodsCollection = await foods();
    
    const newFood = {
      name: name.trim(),
      brand: brand ? brand.trim() : null,
      category: category ? category.trim() : "Other",
      nutrients: {
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbohydrates: nutrients.carbohydrates,
        fat: nutrients.fat,
        fiber: nutrients.fiber || 0,
        sugar: nutrients.sugar || 0,
        sodium: nutrients.sodium || 0,
        saturatedFat: nutrients.saturatedFat || 0,
        transFat: nutrients.transFat || 0,
        cholesterol: nutrients.cholesterol || 0,
        potassium: nutrients.potassium || 0,
        calcium: nutrients.calcium || 0,
        iron: nutrients.iron || 0,
        vitaminA: nutrients.vitaminA || 0,
        vitaminC: nutrients.vitaminC || 0
      },
      servingSize: servingSize,
      servingUnit: servingUnit.trim(),
      dateAdded: new Date(),
      isVerified: false
    };
    
    const insertInfo = await foodsCollection.insertOne(newFood);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
      throw new Error("Could not add food item");
    }
    
    const insertedFood = await this.getFoodById(insertInfo.insertedId.toString());
    return insertedFood;
  },

  /**
   * Get food item by ID
   * @param {string} id - Food ID
   * @returns {object} Food item
   */
  async getFoodById(id) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("Food ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid food ID");
    }
    
    const foodsCollection = await foods();
    const food = await foodsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!food) {
      throw new Error("Food item not found");
    }
    
    food._id = food._id.toString();
    return food;
  },

  /**
   * Search for food items by name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum number of results
   * @returns {array} Array of food items
   */
  async searchFoods(searchTerm, limit = 20) {
    if (!searchTerm || typeof searchTerm !== "string" || searchTerm.trim().length === 0) {
      throw new Error("Search term is required and must be a non-empty string");
    }
    
    if (typeof limit !== "number" || limit <= 0 || limit > 100) {
      throw new Error("Limit must be a positive number between 1 and 100");
    }
    
    const foodsCollection = await foods();
    const searchRegex = new RegExp(searchTerm.trim(), "i");
    
    const foodList = await foodsCollection
      .find({
        $or: [
          { name: searchRegex },
          { brand: searchRegex },
          { category: searchRegex }
        ]
      })
      .limit(limit)
      .toArray();
    
    return foodList.map(food => {
      food._id = food._id.toString();
      return food;
    });
  },

  /**
   * Get all food items with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {object} Paginated food items
   */
  async getAllFoods(page = 1, limit = 20) {
    if (typeof page !== "number" || page < 1) {
      throw new Error("Page must be a positive number");
    }
    
    if (typeof limit !== "number" || limit <= 0 || limit > 100) {
      throw new Error("Limit must be a positive number between 1 and 100");
    }
    
    const foodsCollection = await foods();
    const skip = (page - 1) * limit;
    
    const foodList = await foodsCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .toArray();
    
    const totalCount = await foodsCollection.countDocuments({});
    
    return {
      foods: foodList.map(food => {
        food._id = food._id.toString();
        return food;
      }),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    };
  },

  /**
   * Update food item
   * @param {string} id - Food ID
   * @param {object} updateData - Updated food data
   * @returns {object} Updated food item
   */
  async updateFood(id, updateData) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("Food ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid food ID");
    }
    
    if (!updateData || typeof updateData !== "object") {
      throw new Error("Update data is required and must be an object");
    }
    
    const foodsCollection = await foods();
    
    // Build update object
    const updateObj = {};
    if (updateData.name) {
      if (typeof updateData.name !== "string" || updateData.name.trim().length === 0) {
        throw new Error("Food name must be a non-empty string");
      }
      updateObj.name = updateData.name.trim();
    }
    
    if (updateData.brand !== undefined) {
      updateObj.brand = updateData.brand ? updateData.brand.trim() : null;
    }
    
    if (updateData.category) {
      if (typeof updateData.category !== "string" || updateData.category.trim().length === 0) {
        throw new Error("Category must be a non-empty string");
      }
      updateObj.category = updateData.category.trim();
    }
    
    if (updateData.nutrients) {
      updateObj.nutrients = updateData.nutrients;
    }
    
    if (updateData.servingSize) {
      if (typeof updateData.servingSize !== "number" || updateData.servingSize <= 0) {
        throw new Error("Serving size must be a positive number");
      }
      updateObj.servingSize = updateData.servingSize;
    }
    
    if (updateData.servingUnit) {
      if (typeof updateData.servingUnit !== "string" || updateData.servingUnit.trim().length === 0) {
        throw new Error("Serving unit must be a non-empty string");
      }
      updateObj.servingUnit = updateData.servingUnit.trim();
    }
    
    updateObj.dateModified = new Date();
    
    const updateInfo = await foodsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateObj }
    );
    
    if (updateInfo.modifiedCount === 0) {
      throw new Error("Could not update food item or food item not found");
    }
    
    return await this.getFoodById(id);
  },

  /**
   * Delete food item
   * @param {string} id - Food ID
   * @returns {boolean} Success status
   */
  async deleteFood(id) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("Food ID is required and must be a non-empty string");
    }
    
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid food ID");
    }
    
    const foodsCollection = await foods();
    const deletionInfo = await foodsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (deletionInfo.deletedCount === 0) {
      throw new Error("Could not delete food item or food item not found");
    }
    
    return true;
  }
};

export default exportedMethods;
