// data/nutritionalGoals.js
import { ObjectId } from "mongodb";
import { nutritionalGoals } from "../config/mongoCollections.js";
import { checkString } from "../helpers.js";

export const createNutritionalGoals = async (userId, goalsData) => {
  const {
    calories,
    protein,
    carbohydrates,
    fat,
    activityLevel,
    goalType,
    bmr,
    tdee,
    bmi
  } = goalsData;

  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");

  if (!calories || typeof calories !== "number" || calories <= 0) {
    throw "Calories must be a positive number";
  }

  if (!protein || typeof protein !== "number" || protein < 0) {
    throw "Protein must be a non-negative number";
  }

  if (!carbohydrates || typeof carbohydrates !== "number" || carbohydrates < 0) {
    throw "Carbohydrates must be a non-negative number";
  }

  if (!fat || typeof fat !== "number" || fat < 0) {
    throw "Fat must be a non-negative number";
  }

  const goalsCollection = await nutritionalGoals();

  // Check if goals already exist for this user
  const existingGoals = await goalsCollection.findOne({ userId: userId });
  if (existingGoals) {
    throw "Nutritional goals already exist for this user. Use updateNutritionalGoals instead.";
  }

  const newGoals = {
    userId: userId,
    calories: calories,
    macronutrients: {
      protein: {
        grams: protein,
        calories: Math.round(protein * 4)
      },
      carbohydrates: {
        grams: carbohydrates,
        calories: Math.round(carbohydrates * 4)
      },
      fat: {
        grams: fat,
        calories: Math.round(fat * 9)
      }
    },
    activityLevel: activityLevel || null,
    goalType: goalType || null,
    bmr: bmr || null,
    tdee: tdee || null,
    bmi: bmi || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertInfo = await goalsCollection.insertOne(newGoals);
  if (!insertInfo.insertedId) {
    throw "Could not create nutritional goals";
  }

  return await getNutritionalGoalsByUserId(userId);
};

export const getNutritionalGoalsByUserId = async (userId) => {
  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");

  const goalsCollection = await nutritionalGoals();
  const goals = await goalsCollection.findOne({ userId: userId });

  if (!goals) {
    return null;
  }

  goals._id = goals._id.toString();
  return goals;
};

export const updateNutritionalGoals = async (userId, updateData) => {
  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");

  const goalsCollection = await nutritionalGoals();
  const existingGoals = await goalsCollection.findOne({ userId: userId });

  if (!existingGoals) {
    throw "Nutritional goals not found. Use createNutritionalGoals instead.";
  }

  const updateObj = {
    ...updateData,
    updatedAt: new Date()
  };

  // Recalculate macronutrient calories if grams are updated
  if (updateData.macronutrients) {
    if (updateData.macronutrients.protein && typeof updateData.macronutrients.protein.grams === "number") {
      updateObj.macronutrients.protein.calories = Math.round(updateData.macronutrients.protein.grams * 4);
    }
    if (updateData.macronutrients.carbohydrates && typeof updateData.macronutrients.carbohydrates.grams === "number") {
      updateObj.macronutrients.carbohydrates.calories = Math.round(updateData.macronutrients.carbohydrates.grams * 4);
    }
    if (updateData.macronutrients.fat && typeof updateData.macronutrients.fat.grams === "number") {
      updateObj.macronutrients.fat.calories = Math.round(updateData.macronutrients.fat.grams * 9);
    }
  }

  const updateInfo = await goalsCollection.updateOne(
    { userId: userId },
    { $set: updateObj }
  );

  if (updateInfo.modifiedCount === 0) {
    throw "Could not update nutritional goals";
  }

  return await getNutritionalGoalsByUserId(userId);
};

