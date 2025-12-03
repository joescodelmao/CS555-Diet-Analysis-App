import { Router } from "express";
import { addFoodItemToUser, getUserById } from "../data/users.js";
const router = Router();

router.use(async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
});

router.route("/").get(async (req, res) => {
  const user = await getUserById(req.session.user._id);

  res.render("nutritional", {
    title: "Nutritional Page",
    stylesheet: "/public/css/nutritional.css",
    user: req.session.user,
    profile: true,
    foodLog: user.foodLog,
  });
});

router.route("/").post(async (req, res) => {
  console.log("INSIDE OF POST FOOD");
  console.log(req.body);

  const food = req.body;
  const result = await addFoodItemToUser(req.session.user._id, food);

  res.render("nutritional", {
    title: "Nutritional Page",
    stylesheet: "/public/css/nutritional.css",
    user: req.session.user,
    profile: true,
  });
});

export default router;
