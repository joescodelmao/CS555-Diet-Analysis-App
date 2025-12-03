const foodInfo = document.getElementById("foodInfo");
const ingredientsInfo = document.getElementById("ingredientsInfo");
const nutritionInfo = document.getElementById("nutritionInfo");
const dietaryAnalysisInfo = document.getElementById("dietaryAnalysisInfo");
const goalAnalysisInfo = document.getElementById("goalAnalysisInfo");

const addButton = document.getElementById("addButton");

addButton.addEventListener("click", async (e) => {
  e.preventDefault();
  const foodItem = {
    food: foodInfo.innerHTML,
    ingredients: ingredientsInfo.innerHTML,
    nutrition: nutritionInfo.innerHTML,
  };
  try {
    const response = await fetch("http://localhost:3000/nutritional/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(foodItem),
    });
    if (!response.ok) {
      console.log("error");
    }
  } catch (e) {
    console.log(error);
  }
});
