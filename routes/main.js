import { Router } from "express";
const router = Router();

import { checkUsername, checkPassword, checkString } from "../helpers.js";
import { register, login } from "../data/users.js";

router.route("/").get(async (req, res) => {
  res.render("home", {
    title: "Home Page",
    stylesheet: "/public/css/home.css",
    user: req.session.user
  });
});

router
  .route("/register")
  .get(async (req, res) => {
    res.render("register", {
      title: "Register",
      stylesheet: "/public/css/register.css",
      script: "/public/js/register.js",
      hidden: "hidden",
    });
  })
  .post(async (req, res) => {
    let { username, password } = req.body;
    try {
      username = checkUsername(username);
      password = checkPassword(password);
      let newUser = await register(username, password);
      return res.redirect("/login");
    } catch (e) {
      return res.status(400).render("register", {
        title: "Register",
        stylesheet: "/public/css/register.css",
        script: "/public/js/register.js",
        error_message: e,
        username: username,
        password: password
      });
    }
  });

router
  .route("/login")
  .get(async(req, res) => {
    res.render("login", {
      title: "Login",
      stylesheet: "/public/css/login.css",
      script: "/public/js/login.js",
      hidden: "hidden",
    });
  })
  .post(async (req, res) => {
    let { username, password } = req.body;

    try {
      username = checkString(username);
      password = checkString(password);

      let user = await login(username, password);

      req.session.user = {
        _id: user._id,
        username: user.username
      };

      return res.redirect("/home");

    } catch (e) {
      return res.status(400).render('login', {
        title: "Login",
        stylesheet: "/public/css/login.css",
        script: "/public/js/login.js",
        error_message: e,
        username: username,
        password: password
      });
    }
  });

router.get("/logout", async (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Failed to destroy session:", err);
        return res.status(500).send("Logout failed");
      }
      res.clearCookie("AuthenticationState");
      return res.redirect("/login");
    });
  } else {
    return res.redirect("/login");
  }
});

export default router;
