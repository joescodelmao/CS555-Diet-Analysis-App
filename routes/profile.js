import { Router } from "express";
import { getProfileByUserId, createOrUpdateProfile } from "../data/profiles.js";

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
  const profile = await getProfileByUserId(req.session.user._id);
  res.render("profile", { 
    profile, 
    title: "My Profile", 
    stylesheet: "/public/css/profile.css",
    user: req.session.user
  });
});

// Edit profile form
router.get("/edit", async (req, res) => {
  const profile = await getProfileByUserId(req.session.user._id);
  res.render("profile_edit", { 
    profile, 
    title: "Edit Profile",
    stylesheet: "/public/css/profile.css",
    user: req.session.user
  });
});

// Update profile
router.post("/edit", async (req, res) => {
  const { name, age, height, weight, goal } = req.body;
  await createOrUpdateProfile(req.session.user._id, { name, age, height, weight, goal });
  res.redirect("/profile");
});

export default router;
