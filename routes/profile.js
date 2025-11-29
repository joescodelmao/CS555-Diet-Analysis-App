import { Router } from "express";
import { getProfileByUserId, createOrUpdateProfile } from "../data/profiles.js";
import { checkForNoRestrictions } from "../helpers.js";
import { getUserById } from "../data/users.js";

const router = Router();

// Require login for all profile routes
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
});

// View profile
router.get("/", async (req, res) => {
  try {
    const profile = await getProfileByUserId(req.session.user._id);
    const user = await getUserById(req.session.user._id)
    //console.log(user)
    res.render("profile", {
      profile,
      title: `Your Profile`,
      stylesheet: "/public/css/profile.css",
      user,
      noRestrictions: profile && profile.dietaryRestrictions ? checkForNoRestrictions(profile.dietaryRestrictions) : true
    });
  } catch (error) {
    res.render("profile", {
      profile: null,
      title: "My Profile",
      stylesheet: "/public/css/profile.css",
      user: req.session.user,
      noRestrictions: true,
      error: "Profile not found. Please create your profile."
    });
  }
});

// Edit profile form
router.get("/edit", async (req, res) => {
  const profile = await getProfileByUserId(req.session.user._id);
  res.render("profile_edit", {
    profile,
    title: "Edit Profile",
    stylesheet: "/public/css/profile.css",
    user: req.session.user,
  });
});

// Update profile
router.post("/edit", async (req, res) => {
  const {
    name,
    age,
    height,
    weight,
    goal,
    vegan,
    vegetarian,
    pescatarian,
    gluten_free,
    dairy_free,
    nut_free,
    peanut_free,
    soy_free,
    egg_free,
    shellfish_free,
    halal,
    kosher,
    low_carb,
    low_sodium,
    low_sugar,
  } = req.body;

  const dietaryRestrictions = {
    vegan: vegan ? true : false,
    vegetarian: vegetarian ? true : false,
    pescatarian: pescatarian ? true : false,
    gluten_free: gluten_free ? true : false,
    dairy_free: dairy_free ? true : false,
    nut_free: nut_free ? true : false,
    peanut_free: peanut_free ? true : false,
    soy_free: soy_free ? true : false,
    egg_free: egg_free ? true : false,
    shellfish_free: shellfish_free ? true : false,
    halal: halal ? true : false,
    kosher: kosher ? true : false,
    low_carb: low_carb ? true : false,
    low_sodium: low_sodium ? true : false,
    low_sugar: low_sugar ? true : false,
  };
  let noRestrictions = checkForNoRestrictions(dietaryRestrictions);
  await createOrUpdateProfile(req.session.user._id, {
    name,
    age,
    height,
    weight,
    goal,
    dietaryRestrictions,
    noRestrictions,
  });
  res.redirect("/profile");
});

export default router;
