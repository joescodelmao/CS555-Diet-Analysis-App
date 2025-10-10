import { checkUsername, checkPassword } from "../helpers.js";

import { users } from "../config/mongoCollections.js";
import bcrypt from "bcryptjs";

export const register = async (username, password) => {
  if (!username || !password) {
    throw `Must supply username and password`;
  }

  username = checkUsername(username).toLowerCase();
  password = checkPassword(password);

  const userCollection = await users();
  const usr = await userCollection.findOne({ username: username });
  if (usr) {
    throw `Username is taken`;
  }
  const hashedPassword = await bcrypt.hash(password, 8);

  let newUser = {
    username: username,
    password: hashedPassword,
  };

  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw `Could not create user`;
  }
  return { _id: newUser._id, username: newUser.username };
};
