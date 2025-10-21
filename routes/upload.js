import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = "./public/uploads";
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });

const upload = multer({ storage });

router
  .route("/")
  .get(async (req, res) => {
    res.render("upload", {
      title: "Upload Meal Photo",
      stylesheet: "/public/css/upload.css",
      script: "/public/js/upload.js",
    });
  })
  .post(upload.single("mealImage"), async (req, res) => {
    if (!req.file) {
      return res.status(400).render("upload", {
        title: "Upload Meal Photo",
        error_message: "Please upload or capture an image.",
      });
    }

    res.render("upload_success", {
      title: "Upload Success",
      imagePath: `/uploads/${req.file.filename}`,
      message: "Meal photo uploaded successfully!",
    });
  });

export default router;

//const NodeWebcam = require("node_webcam");

//const opts = {
//    width: 1280,
//    height: 720,
//    delay: 0,
//    quality: 100,
//    output: "jpeg,jpg,png",
//    callbackReturn: "location"
//};

//const Webcam = NodeWebcam.create(opts);

//Webcam.capture("my_picture", function(err,data){
//    if (!err){
//        console.log("Accpeted image");
//    }
//});