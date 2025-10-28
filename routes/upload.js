// routes/upload.js
import express from "express";
import multer from "multer";
import foodsData from "../data/foods.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Require login for all upload routes
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
});

/**
 * POST /upload/food
 * Upload food image and add to database
 */
router.post("/food", upload.single('foodImage'), async (req, res) => {
  try {
    const { name, brand, category, servingSize, servingUnit, calories, protein, carbohydrates, fat } = req.body;
    
    // Validate required fields
    if (!name || !servingSize || !calories || !protein || !carbohydrates || !fat) {
      return res.status(400).json({ 
        error: "Missing required fields: name, servingSize, calories, protein, carbohydrates, fat" 
      });
    }
    
    // Create food data
    const foodData = {
      name: name.trim(),
      brand: brand ? brand.trim() : null,
      category: category ? category.trim() : "Other",
      servingSize: parseFloat(servingSize),
      servingUnit: servingUnit ? servingUnit.trim() : "serving",
      nutrients: {
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbohydrates: parseFloat(carbohydrates),
        fat: parseFloat(fat),
        fiber: parseFloat(req.body.fiber) || 0,
        sugar: parseFloat(req.body.sugar) || 0,
        sodium: parseFloat(req.body.sodium) || 0,
        saturatedFat: parseFloat(req.body.saturatedFat) || 0,
        transFat: parseFloat(req.body.transFat) || 0,
        cholesterol: parseFloat(req.body.cholesterol) || 0,
        potassium: parseFloat(req.body.potassium) || 0,
        calcium: parseFloat(req.body.calcium) || 0,
        iron: parseFloat(req.body.iron) || 0,
        vitaminA: parseFloat(req.body.vitaminA) || 0,
        vitaminC: parseFloat(req.body.vitaminC) || 0
      }
    };
    
    // Add image path if uploaded
    if (req.file) {
      foodData.imagePath = `/uploads/${req.file.filename}`;
    }
    
    // Add to database
    const newFood = await foodsData.addFood(foodData);
    
    res.json({
      success: true,
      food: newFood,
      message: "Food added successfully!"
    });
    
  } catch (error) {
    console.error("Food upload error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to add food" 
    });
  }
});

/**
 * GET /upload
 * Redirect to food upload form
 */
router.get("/", (req, res) => {
  res.redirect("/upload/food");
});

/**
 * GET /upload/food
 * Show food upload form
 */
router.get("/food", (req, res) => {
  res.render("food_upload", {
    title: "Add Food",
    stylesheet: "/public/css/food_upload.css",
    user: req.session.user
  });
});

export default router;