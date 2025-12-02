import { ObjectId } from "mongodb";
export const checkString = (val, name = "Variable") => {
  if (typeof val !== "string") {
    throw `${name} must exist and be a string`;
  }
  val = val.trim();
  if (val === "") {
    throw `${name} cannot be empty`;
  }
  return val;
};

export const checkUsername = (username) => {
  username = checkString(username, "username");
  if (username.length < 5) {
    throw `username must be at least 5 characters`;
  }
  let hasLetter = false;
  for (let char of username) {
    if ((char >= "A" && char <= "Z") || (char >= "a" && char <= "z")) {
      hasLetter = true;
    } else if (char >= "0" && char <= "9") {
      // do nothing
    } else {
      throw `Username cannot have any special characters or spaces`;
    }
  }
  if (!hasLetter) {
    throw `Username must have at least 1 letter`;
  }
  return username.toLowerCase();
};

export const checkPassword = (password) => {
  password = checkString(password, "password");
  if (password.length < 8) {
    throw `password must be at least 8 characters`;
  }
  let hasUpper = false;
  let hasLower = false;
  let hasNumber = false;
  let hasSpecial = false;
  for (let char of password) {
    if (char === " ") {
      throw `password cannot contain spaces`;
    } else if (char >= "A" && char <= "Z") {
      hasUpper = true;
    } else if (char >= "a" && char <= "z") {
      hasLower = true;
    } else if (char >= "0" && char <= "9") {
      hasNumber = true;
    } else {
      hasSpecial = true;
    }
  }
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    throw "password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character";
  }
  return password;
};

export const checkForNoRestrictions = (dietaryRestrictions) => {
  let noRestrictions = true;
  for (let o in dietaryRestrictions) {
    if (dietaryRestrictions[o]) {
      noRestrictions = false;
    }
  }
  return noRestrictions;
};

export const checkId = (id) => {
  if (!id || typeof id !== "string") throw "invalid id: not provided";
  id = id.trim();

  if (id === "") throw "invalid id: empty string";

  if (!ObjectId.isValid(id)) throw "invalid id: not proper ObjectId";

  return id;
};

export const parseFoodMessage = (message) => {
  const keyMap = {
    Food: "food",
    Ingredients: "ingredients",
    Nutrition: "nutrition",
    "Analysis Based on Dietary Restrictions": "dietaryAnalysis",
    "Analysis Based on Goal": "goalAnalysis",
  };

  const originalKeys = Object.keys(keyMap);

  const result = {};
  let currentKey = null;
  let startIndex = 0;

  const keyRegex = new RegExp(`(${originalKeys.join("|")}):`, "g");

  const matches = Array.from(message.matchAll(keyRegex));

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const key = match[1];
    const keyIndex = match.index;

    if (currentKey !== null) {
      const previousValue = message.substring(startIndex, keyIndex).trim();
      const simplifiedKey = keyMap[currentKey];
      result[simplifiedKey] = previousValue;
    }

    currentKey = key;
    startIndex = keyIndex + match[0].length;
  }

  if (currentKey !== null) {
    const lastValue = message.substring(startIndex).trim();
    const simplifiedKey = keyMap[currentKey];
    result[simplifiedKey] = lastValue;
  }

  return result;
};
