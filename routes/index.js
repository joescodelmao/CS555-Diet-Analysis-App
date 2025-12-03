import routes from "./main.js";
import profileRoutes from "./profile.js";
import uploadRoutes from "./upload.js";
import gptRoutes from "./gptRoutes.js";
import userRoutes from "./users.js";
import nutritionalRoutes from "./nutritional.js";
import { getProfileByUserId } from "../data/profiles.js";

const constructorMethod = (app) => {
  app.use("/", routes);
  app.use("/profile", profileRoutes);
  app.use("/upload", uploadRoutes);
  app.use("/gpt", gptRoutes);
  app.use("/users", userRoutes);
  app.use("/nutritional", nutritionalRoutes);

  app.get("/exercise", async (req, res) => {
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
    return res.render("exercise", {
      user: req.session.user,
      stylesheet: "/public/css/exercise.css"
    });
  });

  app.get("/home", async (req, res) => {
    let profile = false;
    if (req.session.user) {
      profile = await getProfileByUserId(req.session.user._id);
    }
    return res.render("home", {
      title: "Home",
      stylesheet: "/public/css/home.css",
      user: req.session.user,
      profile: profile
    });
  });

  app.use(async (req, res) => {
    if (!req.session.user) {
      return res.redirect("/home");
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
  });
};

export default constructorMethod;
