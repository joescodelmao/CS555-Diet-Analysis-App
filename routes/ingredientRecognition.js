import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
// import * as tf from '@tensorflow/tfjs-node';
// import mobilenet from '@tensorflow-models/mobilenet';
import apiService from '../services/apiService.js';

const router = express.Router();

// Multer setup for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Load MobileNet model once
// let mobilenetModel;
// mobilenet.load().then(model => {
//   mobilenetModel = model;
//   console.log('mobilenet model loaded.');
// });

// Ensure corrections folder exists
const correctionsDir = path.resolve('data');
if (!fs.existsSync(correctionsDir)) fs.mkdirSync(correctionsDir);

// --- GET route: render ingredient recognition page ---
router.get('/', (req, res) => {
  res.render('ingredientRecognition', {
    layout: 'main',
    title: 'Ingredient Recognition',
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    authToken: req.user ? req.user.authToken : ''
  });
});

// --- POST route: recognize ingredients from uploaded image ---
router.post('/api/recognize', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const tfimage = tf.node.decodeImage(req.file.buffer);
    const predictions = await mobilenetModel.classify(tfimage);
    tfimage.dispose();

    // Top 3 predicted ingredients
    const topIngredients = predictions.slice(0, 3).map(pred =>
      pred.className.split(',')[0].toLowerCase().trim()
    );

    // Search USDA for each ingredient in parallel
    const searchResultsPromises = topIngredients.map(ingredient =>
      apiService.searchUSDAFoods(ingredient).catch(err => ({ foods: [] }))
    );
    const searchResultsArray = await Promise.all(searchResultsPromises);

    // Merge results
    const combinedSearchResults = {
      foods: searchResultsArray.flatMap(result => result.foods),
      totalHits: searchResultsArray.reduce((sum, r) => sum + (r.totalHits || 0), 0)
    };

    res.json({
      recognizedIngredients: topIngredients,
      searchResults: combinedSearchResults
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to recognize ingredient' });
  }
});

// --- POST route: receive user-corrected ingredients ---
router.post('/api/corrections', async (req, res) => {
  const { correctedIngredients } = req.body;
  if (!correctedIngredients || !correctedIngredients.length) {
    return res.status(400).json({ error: 'No ingredients submitted' });
  }

  try {
    // Save corrections to JSON file (append if exists)
    const correctionsFile = path.join(correctionsDir, 'corrections.json');
    let existing = [];
    if (fs.existsSync(correctionsFile)) {
      existing = JSON.parse(fs.readFileSync(correctionsFile));
    }

    const newEntry = {
      correctedIngredients,
      timestamp: new Date().toISOString()
    };
    existing.push(newEntry);
    fs.writeFileSync(correctionsFile, JSON.stringify(existing, null, 2));

    console.log('User corrections saved:', correctedIngredients);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save corrections' });
  }
});

// --- Optional GET route: search USDA directly ---
router.get('/api/search', async (req, res) => {
  const { query, pageSize } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  try {
    const results = await apiService.searchUSDAFoods(query, parseInt(pageSize) || 20);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
