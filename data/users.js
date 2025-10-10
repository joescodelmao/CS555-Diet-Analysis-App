import { checkUsername, checkPassword, checkString } from "../helpers.js";

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

export const login = async (username, password) => {

  username = checkString(username);
  password = checkString(password);

  const userCollection = await users();
  //console.log(userCollection)
  let userList = await userCollection.find({}).toArray();

  let user;
  for (let u of userList) {
      if (u.username.toLowerCase() === username.toLowerCase()) {
          user = u;
          break;
      }
  }

  if(!user) throw 'invalid username or password.';

  let compare = await bcrypt.compare(password, user.password);

  if (!compare){
    throw 'invalid username or password.'
  }

  return {
    username: user.username,
    _id: user._id.toString()
  };

}
