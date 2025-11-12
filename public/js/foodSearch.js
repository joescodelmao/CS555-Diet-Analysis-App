// public/js/foodSearch.js
class FoodSearch {
  constructor() {
    this.currentMeal = "breakfast";
    this.searchTimeout = null;
    this.init();
  }

  init() {
    // Set up modal
    const modal = document.getElementById("foodSearchModal");
    const closeBtn = modal.querySelector(".close");
    
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });

    // Set up search input
    const searchInput = document.getElementById("foodSearchInput");
    searchInput.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length >= 2) {
        this.searchTimeout = setTimeout(() => {
          this.searchFoods(query);
        }, 300);
      } else {
        document.getElementById("foodSearchResults").innerHTML = "";
      }
    });
  }

  openModal(mealType) {
    this.currentMeal = mealType;
    document.getElementById("foodSearchModal").style.display = "block";
    document.getElementById("foodSearchInput").value = "";
    document.getElementById("foodSearchInput").focus();
    document.getElementById("foodSearchResults").innerHTML = "";
  }

  async searchFoods(query) {
    const resultsDiv = document.getElementById("foodSearchResults");
    resultsDiv.innerHTML = "<p>Searching...</p>";

    try {
      const response = await fetch(`/api/nutritional/search-food?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (!data.foods || data.foods.length === 0) {
        resultsDiv.innerHTML = "<p>No foods found. Try a different search term.</p>";
        return;
      }

      let html = "<ul class='food-search-results'>";
      data.foods.forEach(food => {
        html += `
          <li class="food-result-item" data-food-id="${food._id}">
            <div class="food-result-info">
              <strong>${food.name}</strong>
              ${food.brand ? `<span class="brand">${food.brand}</span>` : ""}
              ${food.category ? `<span class="category">${food.category}</span>` : ""}
            </div>
            <div class="food-result-nutrients">
              <span>${food.nutrients.calories || 0} kcal</span>
              <span>${food.nutrients.protein || 0}g protein</span>
              <span>${food.nutrients.carbohydrates || 0}g carbs</span>
              <span>${food.nutrients.fat || 0}g fat</span>
            </div>
            <button class="btn-add-food" data-food-id="${food._id}">Add</button>
          </li>
        `;
      });
      html += "</ul>";

      resultsDiv.innerHTML = html;

      // Add click handlers
      resultsDiv.querySelectorAll(".btn-add-food, .food-result-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const foodId = e.target.dataset.foodId || e.target.closest(".food-result-item")?.dataset.foodId;
          if (foodId) {
            this.addFoodToMeal(foodId);
          }
        });
      });
    } catch (error) {
      resultsDiv.innerHTML = `<p>Error searching: ${error.message}</p>`;
    }
  }

  async addFoodToMeal(foodId) {
    const quantity = prompt("Enter quantity (in serving size units):", "1");
    if (!quantity || isNaN(parseFloat(quantity))) {
      return;
    }

    try {
      const response = await fetch("/api/nutritional/log-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
          foodId: foodId,
          mealType: this.currentMeal,
          quantity: parseFloat(quantity)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        document.getElementById("foodSearchModal").style.display = "none";
        if (window.NutritionalDashboard) {
          window.NutritionalDashboard.loadDashboard();
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error adding food: " + error.message);
    }
  }
}

// Initialize food search
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.FoodSearch = new FoodSearch();
  });
} else {
  window.FoodSearch = new FoodSearch();
}

