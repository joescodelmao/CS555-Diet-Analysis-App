import { Router } from "express";
import { client } from "../openai.js";
import { checkString } from "../helpers.js";
import { getProfileByUserId } from "../data/profiles.js";
import multer from "multer";
import fs from "fs";
import { getProfileByUserId } from "../data/profiles.js";
import { parseFoodMessage } from "../helpers.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.use(async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  } 
  next();
});



export const buildNewProfile = (data) => {
  return {
    name: checkString(data.name || "", "Name"),
    age: parseInt(data.age) || null,
    height: parseFloat(data.height) || null,
    weight: parseFloat(data.weight) || null,
    goal: checkString(data.goal || "", "Goal"),
    dietaryRestrictions: data.dietaryRestrictions
  };
};



router.route("/exercise").post(async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
You are a fitness assistant. 
Your job is to give clear, practical, and safe advice related to exercise goals.
The user will type their fitness or exercise goal (like "build muscle", 
"lose fat", "increase endurance", "tone arms", etc).
Return a straightforward plan or guidance in plain language.
Avoid fluff. Give immediately useful steps. Consider the following user profile features as well.
          `.trim(),
        },
          {
            role: "user",
            content: `
      User Goal: ${prompt}
      User Profile: ${stringified}
            `.trim(),
          },
      ],
    });

    const output = response.choices[0].message.content;
    return res.json({ result: output });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating text");
  }
});

router.post("/food", upload.single("mealImage"), async (req, res) => {
  try {
    let base64Image;

    if (req.body.capturedImage) {
      base64Image = req.body.capturedImage.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
    } else if (req.file) {
      const filePath = req.file.path;
      const fileData = fs.readFileSync(filePath);
      base64Image = fileData.toString("base64");

      fs.unlinkSync(filePath);
    } else {
      return res.status(400).send("No image provided.");
    }

    console.log(req.session.user);
    let userProfile = await getProfileByUserId(req.session.user._id);
    console.log(userProfile);
    const userGoal = userProfile.goal;
    const userRestrictions = userProfile.dietaryRestrictions;
    let restrictionsString = "";
    let keys = Object.keys(userProfile.dietaryRestrictions);
    for (let key of keys) {
      if (userRestrictions[key]) {
        console.log(key);
        restrictionsString += key;
        restrictionsString += " ";
      }
    }

    console.log("Restrictions: " + restrictionsString);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are an expert food and nutrition assistant.

For any image you receive:
1. Identify the food clearly and concisely.
2. List the ingredients that are likely in the food.
3. Provide approximate nutrition information: calories, fat, sugar, protein, carbohydrates.
4. Based on the user's dietary restrictions and health goal, provide a brief explanation on if this food would be recommended to eat and why/why not. Either field may be blank, so just provide a generic statement if that is the case.

Always format the response exactly like this, with each part on its own line:

Food: [name of the food]
Ingredients: [likely ingredients, comma-separated]
Nutrition: Calories [value], Fat [value], Sugar [value], Protein [value], Carbs [value]
Analysis Based on Dietary Restrictions: [explanation for whether the food should be eaten based on dietary restrictions]
Analysis Based on Goal: [explanation for whether the food should be eaten based on goal]

Use a new line for each section. Do not add extra text or explanation. If unsure, give the closest reasonable guess.

Here is the list of the user's dietary restrictions: ${restrictionsString}
Here is the user's goal: ${userGoal}

        `,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64Image}` },
            },
            {
              type: "text",
              text: "What food is this?",
            },
          ],
        },
      ],
    });

    const result = response.choices[0].message.content;

    let parsedFood = parseFoodMessage(result);

    res.render("food", {
      food: parsedFood.food,
      ingredients: parsedFood.ingredients,
      nutrition: parsedFood.nutrition,
      dietaryAnalysis: parsedFood.dietaryAnalysis,
      goalAnalysis: parsedFood.goalAnalysis,
      user : req.session.user, 
      stylesheet: "/public/css/foodrecognition.css",
      imageURL: `data:image/png;base64,${base64Image}`,
      profile: true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error analyzing image");
  }
});

export { client };

export default router;
