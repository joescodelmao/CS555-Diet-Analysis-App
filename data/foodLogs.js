// data/foodLogs.js
import { ObjectId } from "mongodb";
import { foodLogs, foods } from "../config/mongoCollections.js";
import { checkString } from "../helpers.js";

export const addFoodLogEntry = async (userId, foodLogData) => {
  const {
    foodId,
    mealType,
    quantity,
    date
  } = foodLogData;

  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");
  checkString(foodId, "Food ID");
  checkString(mealType, "Meal type");

  const validMealTypes = ["breakfast", "lunch", "dinner", "snacks"];
  if (!validMealTypes.includes(mealType.toLowerCase())) {
    throw "Meal type must be one of: breakfast, lunch, dinner, snacks";
  }

  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    throw "Quantity must be a positive number";
  }

  const logDate = date ? new Date(date) : new Date();
  logDate.setHours(0, 0, 0, 0);

  const foodLogCollection = await foodLogs();
  const foodCollection = await foods();

  // Get food details
  const food = await foodCollection.findOne({ _id: new ObjectId(foodId) });
  if (!food) {
    throw "Food not found";
  }

  // Find or create daily log
  const dateStr = logDate.toISOString().split("T")[0];
  let dailyLog = await foodLogCollection.findOne({
    userId: userId,
    date: dateStr
  });

  if (!dailyLog) {
    dailyLog = {
      userId: userId,
      date: dateStr,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const insertInfo = await foodLogCollection.insertOne(dailyLog);
    dailyLog._id = insertInfo.insertedId;
  }

  // Add food entry to meal
  const entry = {
    _id: new ObjectId(),
    foodId: foodId,
    food: {
      _id: food._id.toString(),
      name: food.name,
      brand: food.brand,
      category: food.category,
      nutrients: food.nutrients,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      imageUrl: food.imageUrl
    },
    quantity: quantity,
    addedAt: new Date()
  };

  const mealTypeLower = mealType.toLowerCase();
  dailyLog.meals[mealTypeLower].push(entry);

  await foodLogCollection.updateOne(
    { _id: dailyLog._id },
    {
      $set: {
        meals: dailyLog.meals,
        updatedAt: new Date()
      }
    }
  );

  return await getDailyFoodLog(userId, dateStr);
};

export const getDailyFoodLog = async (userId, date) => {
  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");
  checkString(date, "Date");

  const foodLogCollection = await foodLogs();
  const dailyLog = await foodLogCollection.findOne({
    userId: userId,
    date: date
  });

  if (!dailyLog) {
    return {
      userId: userId,
      date: date,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      },
      totals: {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      }
    };
  }

  // Calculate totals
  const totals = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];
  mealTypes.forEach(mealType => {
    if (dailyLog.meals && dailyLog.meals[mealType]) {
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

  // Round totals
  Object.keys(totals).forEach(key => {
    totals[key] = Math.round(totals[key] * 10) / 10;
  });

  dailyLog._id = dailyLog._id.toString();
  dailyLog.totals = totals;

  return dailyLog;
};

export const getFoodLogByDateRange = async (userId, startDate, endDate) => {
  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");
  checkString(startDate, "Start date");
  checkString(endDate, "End date");

  const foodLogCollection = await foodLogs();
  const logs = await foodLogCollection
    .find({
      userId: userId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .toArray();

  return logs.map(log => {
    log._id = log._id.toString();
    return log;
  });
};

export const updateFoodLogEntry = async (userId, date, entryId, updateData) => {
  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");
  checkString(date, "Date");
  checkString(entryId, "Entry ID");

  const foodLogCollection = await foodLogs();
  const dailyLog = await foodLogCollection.findOne({
    userId: userId,
    date: date
  });

  if (!dailyLog) {
    throw "Food log not found";
  }

  // Find and update entry
  let found = false;
  const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];
  
  for (const mealType of mealTypes) {
    if (dailyLog.meals && dailyLog.meals[mealType]) {
      const entryIndex = dailyLog.meals[mealType].findIndex(
        entry => entry._id.toString() === entryId
      );
      
      if (entryIndex !== -1) {
        dailyLog.meals[mealType][entryIndex] = {
          ...dailyLog.meals[mealType][entryIndex],
          ...updateData,
          _id: new ObjectId(entryId)
        };
        found = true;
        break;
      }
    }
  }

  if (!found) {
    throw "Food log entry not found";
  }

  await foodLogCollection.updateOne(
    { _id: dailyLog._id },
    {
      $set: {
        meals: dailyLog.meals,
        updatedAt: new Date()
      }
    }
  );

  return await getDailyFoodLog(userId, date);
};

export const deleteFoodLogEntry = async (userId, date, entryId) => {
  if (!userId) throw "User ID is required";
  checkString(userId, "User ID");
  checkString(date, "Date");
  checkString(entryId, "Entry ID");

  const foodLogCollection = await foodLogs();
  const dailyLog = await foodLogCollection.findOne({
    userId: userId,
    date: date
  });

  if (!dailyLog) {
    throw "Food log not found";
  }

  // Find and remove entry
  let found = false;
  const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];
  
  for (const mealType of mealTypes) {
    if (dailyLog.meals && dailyLog.meals[mealType]) {
      const entryIndex = dailyLog.meals[mealType].findIndex(
        entry => entry._id.toString() === entryId
      );
      
      if (entryIndex !== -1) {
        dailyLog.meals[mealType].splice(entryIndex, 1);
        found = true;
        break;
      }
    }
  }

  if (!found) {
    throw "Food log entry not found";
  }

  await foodLogCollection.updateOne(
    { _id: dailyLog._id },
    {
      $set: {
        meals: dailyLog.meals,
        updatedAt: new Date()
      }
    }
  );

  return await getDailyFoodLog(userId, date);
};

