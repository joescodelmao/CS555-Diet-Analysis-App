import routes from "./main.js";
import profileRoutes from "./profile.js";
import uploadRoutes from "./upload.js";
import nutritionalRoutes from "./nutritional.js";
import gptRoutes from "./gptRoutes.js";
import userRoutes from "./users.js"

const constructorMethod = (app) => {
  app.use("/", routes);

  app.use("/profile", profileRoutes);

  app.use("/upload", uploadRoutes);

  app.use("/api/nutritional", nutritionalRoutes);

  app.use("/gpt", gptRoutes);

  app.use("/users", userRoutes)
  // Nutritional dashboard page
  app.get("/nutritional", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    return res.render("nutritional", {
      title: "Nutritional Dashboard",
      stylesheet: "/public/css/nutritional.css",
      user: req.session.user,
    });
  });

  app.get("/exercise", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    return res.render("exercise");
  });

  // Goals setup page
  app.get("/goals-setup", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    return res.render("goals_setup", {
      title: "Set Nutritional Goals",
      stylesheet: "/public/css/nutritional.css",
      user: req.session.user,
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
