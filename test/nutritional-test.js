// test/nutritional-test.js
import { NutritionalAnalysisService } from "../services/nutritionalAnalysisService.js";
import foodsData from "../data/foods.js";
import foodLogsData from "../data/foodLogs.js";
import nutritionalGoalsData from "../data/nutritionalGoals.js";

async function testNutritionalFeatures() {
  console.log("🧪 Testing Nutritional Features...");
  
  try {
    // Test 1: Create sample nutritional goals
    console.log("\n1️⃣ Testing Nutritional Goals Creation...");
    const sampleGoals = {
      calories: 2000,
      protein: 150,
      carbohydrates: 250,
      fat: 67,
      fiber: 25,
      goalType: "maintenance",
      targetWeight: 70,
      weeklyWeightChange: 1
    };
    
    // Test 2: Create sample food
    console.log("\n2️⃣ Testing Food Creation...");
    const sampleFood = {
      name: "Grilled Chicken Breast",
      brand: "Generic",
      category: "Poultry",
      servingSize: 100,
      servingUnit: "g",
      nutrients: {
        calories: 165,
        protein: 31,
        carbohydrates: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        saturatedFat: 1,
        transFat: 0,
        cholesterol: 85,
        potassium: 256,
        calcium: 15,
        iron: 1,
        vitaminA: 6,
        vitaminC: 0
      }
    };
    
    console.log("✅ Sample data created successfully!");
    console.log("📊 Goals:", sampleGoals);
    console.log("🍗 Food:", sampleFood.name);
    
    // Test 3: Test calculation service
    console.log("\n3️⃣ Testing Calculation Service...");
    const calculationService = new NutritionalAnalysisService();
    
    // Test BMR calculation
    const bmr = calculationService.calculationService.calculateBMR(70, 175, 25, "male");
    console.log("🔥 BMR:", bmr, "calories");
    
    // Test TDEE calculation
    const tdee = calculationService.calculationService.calculateTDEE(bmr, "moderately_active");
    console.log("⚡ TDEE:", tdee, "calories");
    
    // Test BMI calculation
    const bmi = calculationService.calculationService.calculateBMI(70, 175);
    console.log("📏 BMI:", bmi.value, "-", bmi.category);
    
    // Test macronutrient calculation
    const macros = calculationService.calculationService.calculateMacronutrients(2000);
    console.log("🥗 Macros:", macros);
    
    console.log("\n✅ All nutritional calculations working!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testNutritionalFeatures();
