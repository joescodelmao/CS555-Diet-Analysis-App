import { profiles } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { checkString } from "../helpers.js";

export const getProfileByUserId = async (userId) => {
  if (!userId) throw "User ID is required";
  const profileCollection = await profiles();
  const profile = await profileCollection.findOne({
    userId: new ObjectId(userId),
  });
  return profile;
};

export const createOrUpdateProfile = async (userId, data) => {
  if (!userId) throw "User ID is required";

  const profileCollection = await profiles();
  const existing = await profileCollection.findOne({
    userId: new ObjectId(userId),
  });

  if (data.name) data.name = data.name.trim();
  if (data.age) data.age = parseInt(data.age);
  if (data.height) data.height = parseFloat(data.height);
  if (data.weight) data.weight = parseFloat(data.weight);
  if (data.goal) data.goal = data.goal.trim();

  const newProfile = {
    name: data.name,
    age: data.age,
    height: data.height,
    weight: data.weight,
    goal: data.goal,
    dietaryRestrictions: data.dietaryRestrictions,
  };

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
