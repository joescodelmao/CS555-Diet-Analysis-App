// public/js/nutritionalDashboard.js
class NutritionalDashboard {
  constructor() {
    this.currentDate = new Date().toISOString().split("T")[0];
    this.currentMeal = "breakfast";
    this.caloriesChart = null;
    this.macrosChart = null;
    this.init();
  }

  async init() {
    // Set up date picker
    document.getElementById("datePicker").value = this.currentDate;
    document.getElementById("datePicker").addEventListener("change", (e) => {
      this.currentDate = e.target.value;
      this.loadDashboard();
    });

    // Set up refresh button
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.loadDashboard();
    });

    // Set up meal tabs
    document.querySelectorAll(".meal-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        document.querySelectorAll(".meal-tab").forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");
        this.currentMeal = e.target.dataset.meal;
        this.renderFoodLog();
      });
    });

    // Set up add food button
    document.getElementById("addFoodBtn").addEventListener("click", () => {
      if (window.FoodSearch) {
        window.FoodSearch.openModal(this.currentMeal);
      }
    });

    // Load initial data
    await this.loadDashboard();
  }

  async loadDashboard() {
    try {
      const response = await fetch(`/api/nutritional/daily-log?date=${this.currentDate}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (!data.hasGoals) {
        document.getElementById("noGoalsMessage").style.display = "block";
        document.getElementById("dashboardContent").style.display = "none";
        return;
      }

      document.getElementById("noGoalsMessage").style.display = "none";
      document.getElementById("dashboardContent").style.display = "block";

      this.goals = data.goals;
      this.dailyLog = data.dailyLog;
      this.totals = data.totals;
      this.deficits = data.deficits;
      this.recommendations = data.recommendations;
      this.progress = data.progress;

      this.updateDailySummary();
      this.renderCharts();
      this.renderFoodLog();
      this.renderRecommendations();
    } catch (error) {
      console.error("Error loading dashboard:", error);
      alert("Error loading dashboard: " + error.message);
    }
  }

  updateDailySummary() {
    // Update calories
    document.getElementById("caloriesConsumed").textContent = Math.round(this.totals.calories);
    document.getElementById("caloriesGoal").textContent = this.goals.calories;
    const caloriesPercent = Math.min((this.totals.calories / this.goals.calories) * 100, 100);
    document.getElementById("caloriesProgress").style.width = `${caloriesPercent}%`;

    // Update protein
    document.getElementById("proteinConsumed").textContent = Math.round(this.totals.protein);
    document.getElementById("proteinGoal").textContent = Math.round(this.goals.macronutrients.protein.grams);
    const proteinPercent = Math.min((this.totals.protein / this.goals.macronutrients.protein.grams) * 100, 100);
    document.getElementById("proteinProgress").style.width = `${proteinPercent}%`;

    // Update carbs
    document.getElementById("carbsConsumed").textContent = Math.round(this.totals.carbohydrates);
    document.getElementById("carbsGoal").textContent = Math.round(this.goals.macronutrients.carbohydrates.grams);
    const carbsPercent = Math.min((this.totals.carbohydrates / this.goals.macronutrients.carbohydrates.grams) * 100, 100);
    document.getElementById("carbsProgress").style.width = `${carbsPercent}%`;

    // Update fat
    document.getElementById("fatConsumed").textContent = Math.round(this.totals.fat);
    document.getElementById("fatGoal").textContent = Math.round(this.goals.macronutrients.fat.grams);
    const fatPercent = Math.min((this.totals.fat / this.goals.macronutrients.fat.grams) * 100, 100);
    document.getElementById("fatProgress").style.width = `${fatPercent}%`;
  }

  renderCharts() {
    // Calories chart
    const caloriesCtx = document.getElementById("caloriesChart").getContext("2d");
    if (this.caloriesChart) {
      this.caloriesChart.destroy();
    }
    this.caloriesChart = new Chart(caloriesCtx, {
      type: "doughnut",
      data: {
        labels: ["Consumed", "Remaining"],
        datasets: [{
          data: [
            Math.round(this.totals.calories),
            Math.max(0, this.goals.calories - Math.round(this.totals.calories))
          ],
          backgroundColor: ["#4CAF50", "#E0E0E0"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Calories: ${Math.round(this.totals.calories)} / ${this.goals.calories}`
          }
        }
      }
    });

    // Macros chart
    const macrosCtx = document.getElementById("macrosChart").getContext("2d");
    if (this.macrosChart) {
      this.macrosChart.destroy();
    }
    this.macrosChart = new Chart(macrosCtx, {
      type: "bar",
      data: {
        labels: ["Protein", "Carbs", "Fat"],
        datasets: [{
          label: "Consumed (g)",
          data: [
            Math.round(this.totals.protein),
            Math.round(this.totals.carbohydrates),
            Math.round(this.totals.fat)
          ],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
        }, {
          label: "Goal (g)",
          data: [
            Math.round(this.goals.macronutrients.protein.grams),
            Math.round(this.goals.macronutrients.carbohydrates.grams),
            Math.round(this.goals.macronutrients.fat.grams)
          ],
          backgroundColor: ["#FFB1C1", "#9DD0F5", "#FFE085"]
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  renderFoodLog() {
    const meal = this.dailyLog.meals[this.currentMeal] || [];
    const logContent = document.getElementById("foodLogContent");
    
    if (meal.length === 0) {
      logContent.innerHTML = "<p>No foods logged for this meal yet.</p>";
      return;
    }

    let html = "<ul class='food-list'>";
    meal.forEach(entry => {
      const multiplier = entry.quantity / (entry.food.servingSize || 1);
      const calories = Math.round((entry.food.nutrients.calories || 0) * multiplier);
      const protein = Math.round((entry.food.nutrients.protein || 0) * multiplier);
      
      html += `
        <li class="food-item">
          <div class="food-info">
            <strong>${entry.food.name}</strong>
            ${entry.food.brand ? `<span class="brand">${entry.food.brand}</span>` : ""}
            <span class="quantity">${entry.quantity} ${entry.food.servingUnit || "g"}</span>
          </div>
          <div class="food-nutrients">
            <span>${calories} kcal</span>
            <span>${protein}g protein</span>
          </div>
          <button class="btn-delete" data-entry-id="${entry._id}">Delete</button>
        </li>
      `;
    });
    html += "</ul>";

    logContent.innerHTML = html;

    // Add delete handlers
    logContent.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const entryId = e.target.dataset.entryId;
        if (confirm("Delete this food entry?")) {
          try {
            const response = await fetch(`/api/nutritional/log-food/${entryId}?date=${this.currentDate}`, {
              method: "DELETE",
              credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
              await this.loadDashboard();
            }
          } catch (error) {
            alert("Error deleting entry: " + error.message);
          }
        }
      });
    });
  }

  renderRecommendations() {
    const recommendationsList = document.getElementById("recommendationsList");
    
    if (!this.recommendations || this.recommendations.length === 0) {
      recommendationsList.innerHTML = "<p>No recommendations at this time.</p>";
      return;
    }

    let html = "<ul class='recommendations-list'>";
    this.recommendations.forEach(rec => {
      html += `<li class="recommendation ${rec.type}">${rec.message}</li>`;
    });
    html += "</ul>";

    recommendationsList.innerHTML = html;
  }
}

// Initialize dashboard when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.NutritionalDashboard = new NutritionalDashboard();
  });
} else {
  window.NutritionalDashboard = new NutritionalDashboard();
}

