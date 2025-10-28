import routes from "./main.js";
import profileRoutes from "./profile.js";
import nutritionalRoutes from "./nutritional.js";
import uploadRoutes from "./upload.js";


const constructorMethod = (app) => {
  app.use("/", routes);

  app.use("/profile", profileRoutes);
  app.use("/api", nutritionalRoutes);
  app.use("/upload", uploadRoutes);

  app.get("/home", (req, res) => {
    return res.render("home", {
      title: "Home",
      stylesheet: "/public/css/home.css",
      user: req.session.user,
    });
  });

  app.get("/nutritional", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    return res.render("nutritional", {
      title: "Nutritional Dashboard",
      stylesheet: "/public/css/nutritional.css",
      user: req.session.user,
      currentDate: new Date().toISOString().split('T')[0]
    });
  });

  app.get("/goals-setup", (req, res) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    return res.render("goals_setup", {
      title: "Set Nutritional Goals",
      user: req.session.user
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Route Not found" });
  });
};

export default constructorMethod;
