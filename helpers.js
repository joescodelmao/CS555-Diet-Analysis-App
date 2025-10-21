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
  return noRestrictions
}
