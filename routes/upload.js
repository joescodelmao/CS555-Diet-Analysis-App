import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

//image classification stuff
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { createCanvas, loadImage } from "canvas";

const router = Router();

//mobilenet model
let model;

(async () => {
  model = await mobilenet.load();
  console.log("mobilenet model loaded.");
})();

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
    });
  })
  .post(upload.single("mealImage"), async (req, res) => {
    // Handle base64 image (from camera capture)
    if (req.body.capturedImage) {
      const base64Data = req.body.capturedImage.replace(/^data:image\/png;base64,/, "");
      const filename = `${Date.now()}.png`;
      const uploadPath = path.join("./public/uploads", filename);
      fs.writeFileSync(uploadPath, base64Data, "base64");
      return res.render("upload_success", {
        title: "Upload Success",
        imagePath: `/uploads/${filename}`,
        message: "Meal photo captured successfully!",
      });
    }

    // Handle file upload
    if (!req.file) {
      return res.status(400).render("upload", {
        title: "Upload Meal Photo",
        error_message: "Please upload or capture an image.",
      });
    }

    //load image into model
    try {
      const imagePath = `./public/uploads/${req.file.filename}`;
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, image.width, image.height);
      const predictions = await model.classify(canvas);

    res.render("upload_success", {
      title: "Upload Success",
      imagePath: `/uploads/${req.file.filename}`,
      message: "Meal photo uploaded successfully!",
      predictions,
    });
  } 
  catch (err) {
    console.error("💥 TensorFlow error:", err);
    res.status(500).send("Error processing image.");
  }
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