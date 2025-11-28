import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import configRoutes from "./routes/index.js";
import ingredientRecognitionRouter from './routes/ingredientRecognition.js';

const app = express();

app.use(
  session({
    name: "AuthenticationState",
    secret: "some secret string!",
    saveUninitialized: false,
    resave: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));
app.use('/ingredient-recognition', ingredientRecognitionRouter);

app.engine("handlebars", exphbs.engine({ defaultLayout: "main", helpers: {
      multiply: (a, b) => (a * b).toFixed(2),
    },}));
app.set("view engine", "handlebars");


configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");
});
