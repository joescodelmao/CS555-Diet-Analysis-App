import { Router } from "express";
const router = Router();

import { checkUsername, checkPassword, checkString } from "../helpers.js";
import { register, login } from "../data/users.js";
import { getProfileByUserId } from "../data/profiles.js";

router.route("/").get(async (req, res) => {
  let profile = false;
  if (req.session.user) {
    profile = await getProfileByUserId(req.session.user._id);
  }
  res.render("home", {
    title: "Home Page",
    stylesheet: "/public/css/home.css",
    user: req.session.user,
    profile: profile
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
      registerpage: true,
      profile: false
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
        password: password,
        profile: false
      });
    }
  });

router
  .route("/login")
  .get(async (req, res) => {
    res.render("login", {
      title: "Login",
      stylesheet: "/public/css/login.css",
      script: "/public/js/login.js",
      hidden: "hidden",
      registerpage:false,
      profile: false
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
        username: user.username,
      };
      return res.redirect("/home");
    } catch (e) {
      return res.status(400).render("login", {
        title: "Login",
        stylesheet: "/public/css/login.css",
        script: "/public/js/login.js",
        error_message: e,
        username: username,
        password: password,
        profile: false
      });
    }
  });

router.get("/logout", async (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Logout failed");
      res.clearCookie("AuthenticationState");
      res.render("logout", {
        title: "Logged Out",
        stylesheet: "/public/css/home.css",
      });
    });
  } else {
    return res.redirect("/login");
  }
});

export default router;
