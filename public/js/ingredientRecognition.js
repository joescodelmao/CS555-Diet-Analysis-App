document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("image-form");
  const input = document.getElementById("image-input");
  const preview = document.getElementById("preview");
  const resultsSection = document.getElementById("results-section");
  const ingredientsList = document.getElementById("ingredients-list");
  const noResults = document.getElementById("no-results");

  console.log("ingredientRecognition.js loaded"); // debug

  // === NEW ELEMENTS FOR VERIFY / CORRECT ===
  const verifySection = document.getElementById("verify-section");
  const verifyList = document.getElementById("verify-list");
  const addInput = document.getElementById("add-ingredient-input");
  const addBtn = document.getElementById("add-ingredient-btn");
  const submitCorrectionsBtn = document.getElementById(
    "submit-corrections-btn"
  );
  const correctionStatus = document.getElementById("correction-status");
  const removeAllBtn = document.getElementById("remove-all-btn");

  // === HELPER FUNCTION: Populate verify list ===
  function populateVerifyList(predictedIngredients) {
    verifyList.innerHTML = "";
    predictedIngredients.forEach((ingredient) => {
      const li = document.createElement("li");
      li.textContent = ingredient;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.style.marginLeft = "10px";
      removeBtn.addEventListener("click", () => li.remove());

      li.appendChild(removeBtn);
      verifyList.appendChild(li);
    });
    verifySection.hidden = false;
  }

  // === ADD CUSTOM INGREDIENT ===
  addBtn.addEventListener("click", () => {
    const value = addInput.value.trim();
    if (!value) return;
    const li = document.createElement("li");
    li.textContent = value;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.style.marginLeft = "10px";
    removeBtn.addEventListener("click", () => li.remove());
    li.appendChild(removeBtn);

    verifyList.appendChild(li);
    addInput.value = "";
  });

  // === REMOVE ALL BUTTON ===
  removeAllBtn.addEventListener("click", () => {
    // Clear both recognized ingredients and verify list
    ingredientsList.innerHTML = "";
    verifyList.innerHTML = "";

    // Keep verify section visible for manual input
    verifySection.hidden = false;
    resultsSection.hidden = true;
    noResults.hidden = true;
  });

  // === SUBMIT CORRECTIONS TO BACKEND ===
  submitCorrectionsBtn.addEventListener("click", async () => {
    const correctedIngredients = Array.from(verifyList.children).map(
      (li) => li.firstChild.textContent
    );
    try {
      const res = await fetch("/ingredient-recognition/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctedIngredients }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      correctionStatus.textContent = "Corrections submitted!";
      correctionStatus.style.color = "green";
    } catch (err) {
      console.error(err);
      correctionStatus.textContent = "Failed to submit corrections.";
      correctionStatus.style.color = "red";
    }
  });

  // === IMAGE PREVIEW ===
  input.addEventListener("change", () => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" style="max-width: 300px; margin-top: 10px;" />`;
      };
      reader.readAsDataURL(input.files[0]);
    } else {
      preview.innerHTML = "";
    }
  });

  // === FORM SUBMIT ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!input.files.length) return alert("Please upload an image");

    const formData = new FormData();
    formData.append("image", input.files[0]);

    try {
      const res = await fetch("/ingredient-recognition/api/recognize", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();

      // Display recognized ingredients
      ingredientsList.innerHTML = "";
      if (data.searchResults.foods && data.searchResults.foods.length) {
        data.searchResults.foods.forEach((food) => {
          const li = document.createElement("li");
          li.textContent = `${food.name} (${
            food.nutrients.calories || 0
          } kcal)`;
          ingredientsList.appendChild(li);
        });
        resultsSection.hidden = false;
        noResults.hidden = true;
      } else {
        resultsSection.hidden = false;
        noResults.hidden = false;
      }

      // Populate verify list for user corrections
      if (data.recognizedIngredients && data.recognizedIngredients.length) {
        populateVerifyList(data.recognizedIngredients);
      } else {
        verifySection.hidden = true;
      }
    } catch (err) {
      console.error(err);
      alert("Failed to recognize ingredients. Check console.");
    }
  });
});
