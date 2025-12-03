import { profiles } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkString } from "../helpers.js";

export const getProfileByUserId = async (userId) => {
  if (!userId) throw "User ID is required";
  const profileCollection = await profiles();
  const profile = await profileCollection.findOne({ userId: new ObjectId(userId) });
  return profile;
};

export const createOrUpdateProfile = async (userId, data) => {
  if (!userId) throw "User ID is required";

  const profileCollection = await profiles();
  const existing = await profileCollection.findOne({ userId: new ObjectId(userId) });

  const newProfile = {
    name: checkString(data.name || "", "Name"),
    age: parseInt(data.age) || null,
    height: parseFloat(data.height) || null,
    weight: parseFloat(data.weight) || null,
    goal: checkString(data.goal || "", "Goal"),
    dietaryRestrictions: data.dietaryRestrictions,
    foodlog : []
  };

  if (existing && !existing.foodLog) {
    await profileCollection.updateOne(
      { userId: new ObjectId(userId) },
      { $set: { foodLog: [] } }
    );
  }
  
  if (existing) {
    await profileCollection.updateOne(
      { userId: new ObjectId(userId) },
      { $set: newProfile }
    );
    return { updated: true };
  } else {
    await profileCollection.insertOne({
      userId: new ObjectId(userId),
      ...newProfile,
    });
    return { inserted: true };
  }
};
