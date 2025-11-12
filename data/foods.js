// data/foods.js
import { ObjectId } from "mongodb";
import { foods } from "../config/mongoCollections.js";
import { checkString } from "../helpers.js";

export const addFood = async (foodData) => {
  const {
    name,
    brand,
    category,
    nutrients,
    servingSize,
    servingUnit,
    imageUrl,
    source,
    sourceId
  } = foodData;

  // Validation
  checkString(name, "Food name");
  if (brand) checkString(brand, "Brand");
  if (category) checkString(category, "Category");
  if (servingUnit) checkString(servingUnit, "Serving unit");
  if (source) checkString(source, "Source");
  if (sourceId) checkString(sourceId, "Source ID");

  if (!nutrients || typeof nutrients !== "object") {
    throw "Nutrients must be an object";
  }

  if (!servingSize || typeof servingSize !== "number" || servingSize <= 0) {
    throw "Serving size must be a positive number";
  }

  const foodCollection = await foods();
  
  const newFood = {
    name: name.trim(),
    brand: brand ? brand.trim() : null,
    category: category ? category.trim() : null,
    nutrients: {
      calories: nutrients.calories || 0,
      protein: nutrients.protein || 0,
      carbohydrates: nutrients.carbohydrates || 0,
      fat: nutrients.fat || 0,
      fiber: nutrients.fiber || 0,
      sugar: nutrients.sugar || 0,
      sodium: nutrients.sodium || 0,
      cholesterol: nutrients.cholesterol || 0,
      saturatedFat: nutrients.saturatedFat || 0,
      transFat: nutrients.transFat || 0,
      vitaminA: nutrients.vitaminA || 0,
      vitaminC: nutrients.vitaminC || 0,
      calcium: nutrients.calcium || 0,
      iron: nutrients.iron || 0
    },
    servingSize: servingSize,
    servingUnit: servingUnit ? servingUnit.trim() : "g",
    imageUrl: imageUrl || null,
    source: source || "manual",
    sourceId: sourceId || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertInfo = await foodCollection.insertOne(newFood);
  if (!insertInfo.insertedId) {
    throw "Could not add food";
  }

  return await getFoodById(insertInfo.insertedId.toString());
};

export const getFoodById = async (foodId) => {
  if (!foodId) throw "Food ID is required";
  checkString(foodId, "Food ID");

  const foodCollection = await foods();
  const food = await foodCollection.findOne({ _id: new ObjectId(foodId) });
  
  if (!food) {
    throw "Food not found";
  }

  food._id = food._id.toString();
  return food;
};

export const searchFoods = async (query, limit = 20) => {
  if (!query) throw "Search query is required";
  checkString(query, "Search query");

  const foodCollection = await foods();
  const searchRegex = new RegExp(query.trim(), "i");
  
  const results = await foodCollection
    .find({
      $or: [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex }
      ]
    })
    .limit(parseInt(limit))
    .toArray();

  return results.map(food => {
    food._id = food._id.toString();
    return food;
  });
};

export const updateFood = async (foodId, updateData) => {
  if (!foodId) throw "Food ID is required";
  checkString(foodId, "Food ID");

  const foodCollection = await foods();
  const updateObj = { ...updateData, updatedAt: new Date() };

  const updateInfo = await foodCollection.updateOne(
    { _id: new ObjectId(foodId) },
    { $set: updateObj }
  );

  if (updateInfo.modifiedCount === 0) {
    throw "Could not update food";
  }

  return await getFoodById(foodId);
};

export const deleteFood = async (foodId) => {
  if (!foodId) throw "Food ID is required";
  checkString(foodId, "Food ID");

  const foodCollection = await foods();
  const deletionInfo = await foodCollection.deleteOne({ _id: new ObjectId(foodId) });

  if (deletionInfo.deletedCount === 0) {
    throw "Could not delete food";
  }

  return { deleted: true };
};

