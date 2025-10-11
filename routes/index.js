import routes from "./main.js";
import profileRoutes from "./profile.js"; 

const constructorMethod = (app) => {
  app.use("/", routes);

  app.use("/profile", profileRoutes);

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
