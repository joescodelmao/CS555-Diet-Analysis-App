import { Router } from "express";
const router = Router();

router.use(async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
      } 
    next();
});

router.route("/").get(async (req, res) => {
    const profile = await getProfileByUserId(req.session.user._id);

    res.render("nutritional", {
      title: "Nutritional Page",
      stylesheet: "/public/css/nutritional.css",
      user: req.session.user,
    });
});

export default router;