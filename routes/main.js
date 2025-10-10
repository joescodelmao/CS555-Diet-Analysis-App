import { Router } from "express";
const router = Router();

import { checkUsername, checkPassword, checkString } from "../helpers.js";
import { register, login } from "../data/users.js";

router.route("/").get(async (req, res) => {
  res.render("home", {
    title: "Home Page",
    stylesheet: "/public/css/home.css",
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
      return res.redirect("/"); //Change this to login once created
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
      title: "Register",
      stylesheet: "/public/css/register.css",
      script: "/public/js/register.js",
      hidden: "hidden",
    })
  })
  .post(async (req, res) => {
    let { username, password } = req.body;

    try{
      username = checkString(username);
      password = checkString(password);

      let user = await login(username, password);

      return res.redirect("/home"); //change to app home page once made

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
  })
export default router;
