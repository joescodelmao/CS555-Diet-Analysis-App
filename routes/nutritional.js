import { Router } from "express";
const router = Router();

router.use(async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
      } else {
        try{
          const profile = await getProfileByUserId(req.session.user._id);
          if (profile === null){
            return res.redirect("/home");
          }
        } catch (e){
          return res.redirect("/home");
        }
      }
    next();
});

router.route("/").get(async (req, res) => {
    res.render("nutritional", {
      title: "Nutritional Page",
      stylesheet: "/public/css/nutritional.css",
      user: req.session.user,
    });
});

export default router;