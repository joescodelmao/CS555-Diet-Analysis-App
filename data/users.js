import { checkId, checkUsername, checkPassword, checkString } from "../helpers.js";

import { users } from "../config/mongoCollections.js";
import bcrypt from "bcryptjs";
import {ObjectId} from 'mongodb'
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
    following: [],
    followers: [],
    _id: new ObjectId()
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

export const getUserById = async (id) => {

  // Input validation.
  id = checkId(id, "getUserById");
  // Get users collection.
  let userCollection = await users();
  // Find the user with the given ID.
  let user = await userCollection.findOne({ _id: new ObjectId(id) });
  //user not found
  if (!user) {
      throw 'getUserById error'
  }

  // Return the user object with the _id property converted to a string.
  user._id = user._id.toString();
  return user;
}



export const follow = async (id, friendId) => {

  //input validation
  id = checkId(id);
  friendId = checkId(friendId);


  const user = await getUserById(id);

  const user_to_friend = await getUserById(friendId);

  //check to see if users are already friends
  for (let friend of user.friends){
    if(friend === friendId){
      throw 'already friends!'
    }
  }

  //get user collection
  const userCollection = await users();

  //update friends list since checks passed
  const updateInfo = await userCollection.findOneAndUpdate(
    {_id: new ObjectId(id)},
    {$push: {following: friendId}},
    {returnDocument: 'after'}
  );

  if (!updateInfo) {
    throw `Could not update user's friends list`
  }
  //update second users followers list
  const updateInfo2 = await userCollection.findOneAndUpdate(
    {_id: new ObjectId(friendId)},
    {$push: {followers: id}},
    {returnDocument: 'after'}
);
  
  if (!updateInfo2) {
    throw 'Could not update users friends list'
  }

return true;

}

export const unfollow = async (id, friendId) => {

  //Input validation
  id = checkId(id)
  friendId = checkId(friendId)

  //find user with associated id
  //throws if no user is found
  const user = await getUserById(id)
  
  //find user with associated friendId
  //throws if no user is found
  const friend_to_remove = await getUserById(friendId)

  const userCollection = await users();

  //update users following list
  const updateInfo = await userCollection.findOneAndUpdate(
    {_id: new ObjectId(id)},
    {$pull: {following: friendId}},
    {returnDocument: 'after'} 
  )

  //if update fails
  if (!updateInfo) {
    throw 'error: could not update following'
  }

  //update unfollowed users' followers
  const updateInfo2 = await userCollection.findOneAndUpdate(
    {_id: new ObjectId(friendId)},
    {$pull: {followers: id}},
    {returnDocument: 'after'}
);
  
  //failed to update
  if (!updateInfo2) {
    throw 'failed to remove follower'
}

updateInfo._id = updateInfo._id.toString();

return updateInfo;

}

export const getAllUsers = async () => {
  const userCollection = await users();
        
        //get collection of users
        let userList = await userCollection.find({}).toArray();
        
        //if userList errors
        if (!userList) {
            throw 'userList could not be retrieved'
                
        }
        
        //modify the objectIds to strings for return
        userList = userList.map((element) => {
            element._id = element._id.toString();
            return element;
        });

        return userList

}

//console.log(await getUserById("692a4b946944e90c8b26beca"))