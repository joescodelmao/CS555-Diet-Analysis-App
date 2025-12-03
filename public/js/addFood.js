const foodInfo = document.getElementById("foodInfo");
const ingredientsInfo = document.getElementById("ingredientsInfo");
const nutritionInfo = document.getElementById("nutritionInfo");
const dietaryAnalysisInfo = document.getElementById("dietaryAnalysisInfo");
const goalAnalysisInfo = document.getElementById("goalAnalysisInfo");

const addButton = document.getElementById("addButton");
const nutButton = document.getElementById("nutButton");

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
    }else{
        addButton.style.visibility = "hidden";
        nutButton.style.visibility = "visible"
    }


  } catch (e) {
    console.log(error);
  }
});
