import routes from "./main.js";
import profileRoutes from "./profile.js";
import uploadRoutes from "./upload.js";
import gptRoutes from "./gptRoutes.js";
import userRoutes from "./users.js"

const constructorMethod = (app) => {
  app.use("/", routes);

  app.use("/profile", profileRoutes);

  app.use("/upload", uploadRoutes);

  app.use("/gpt", gptRoutes);

  app.use("/users", userRoutes)

  app.get("/exercise", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    return res.render("exercise", {
      user: req.session.user,
      stylesheet: "/public/css/exercise.css"
    });
  });


  app.get("/home", (req, res) => {
    return res.render("home", {
      title: "Home",
      stylesheet: "/public/css/home.css",
      user: req.session.user,
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Route Not found" });
  });
};

export default constructorMethod;
