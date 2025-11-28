import { Router } from "express";
import { client } from "../openai.js";
import multer from "multer";
import fs from "fs";


const router = Router();
const upload = multer({ dest: "uploads/" });



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
Avoid fluff. Give immediately useful steps.
          `.trim(),
        },
        {
          role: "user",
          content: prompt,
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
      base64Image = req.body.capturedImage.replace(/^data:image\/\w+;base64,/, "");
    }

    else if (req.file) {
      const filePath = req.file.path;
      const fileData = fs.readFileSync(filePath);
      base64Image = fileData.toString("base64");

      fs.unlinkSync(filePath);
    }

    else {
      return res.status(400).send("No image provided.");
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You identify food in images.  
Give the most likely food, concise, no extra text.  
If unsure, give the closest reasonable guess.
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

    res.render("food", { result });

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error analyzing image");
  }
});

export default router;
