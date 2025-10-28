// public/js/foodSearch.js
class FoodSearch {
  constructor() {
    this.searchResults = [];
    this.selectedFoods = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.loadPopularFoods();
  }

  setupEventListeners() {
    const searchInput = document.getElementById('food-search-input');
    const searchBtn = document.getElementById('food-search-btn');
    const usdaSearchBtn = document.getElementById('usda-search-btn');

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchFoods();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchFoods());
    }

    if (usdaSearchBtn) {
      usdaSearchBtn.addEventListener('click', () => this.searchUSDAFoods());
    }
  }

  async searchFoods() {
    const query = document.getElementById('food-search-input')?.value.trim();
    if (!query) return;

    try {
      const response = await fetch(`/api/nutritional/foods/search?q=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        this.searchResults = await response.json();
        this.renderSearchResults();
      } else {
        this.showError('No foods found');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed. Please try again.');
    }
  }

  async searchUSDAFoods() {
    const query = document.getElementById('food-search-input')?.value.trim();
    if (!query) return;

    try {
      const response = await fetch(`/api/nutritional/usda/search?q=${encodeURIComponent(query)}&pageSize=20`);
      if (response.ok) {
        const usdaResults = await response.json();
        this.searchResults = usdaResults.foods || [];
        this.renderSearchResults(true);
      } else {
        this.showError('USDA search failed');
      }
    } catch (error) {
      console.error('USDA search error:', error);
      this.showError('USDA search failed. Please try again.');
    }
  }

  renderSearchResults(isUSDA = false) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (this.searchResults.length === 0) {
      resultsContainer.innerHTML = '<p class="no-results">No foods found</p>';
      return;
    }

    resultsContainer.innerHTML = `
      <div class="search-results-header">
        <h3>Search Results ${isUSDA ? '(USDA)' : ''}</h3>
        <span class="result-count">${this.searchResults.length} foods found</span>
      </div>
      <div class="food-results-grid">
        ${this.searchResults.map(food => this.renderFoodCard(food, isUSDA)).join('')}
      </div>
    `;
  }

  renderFoodCard(food, isUSDA = false) {
    const nutrients = food.nutrients || food.foodNutrients || {};
    const calories = nutrients.calories || nutrients.Energy || 0;
    const protein = nutrients.protein || nutrients.Protein || 0;
    const carbs = nutrients.carbohydrates || nutrients.Carbohydrate || 0;
    const fat = nutrients.fat || nutrients.Fat || 0;

    return `
      <div class="food-card" data-food-id="${food.fdcId || food._id}">
        <div class="food-header">
          <h4 class="food-name">${food.description || food.name}</h4>
          ${food.brandOwner || food.brand ? `<span class="food-brand">${food.brandOwner || food.brand}</span>` : ''}
        </div>
        
        <div class="food-nutrition">
          <div class="nutrition-summary">
            <div class="nutrient">
              <span class="label">Calories:</span>
              <span class="value">${Math.round(calories)}</span>
            </div>
            <div class="nutrient">
              <span class="label">Protein:</span>
              <span class="value">${Math.round(protein * 10) / 10}g</span>
            </div>
            <div class="nutrient">
              <span class="label">Carbs:</span>
              <span class="value">${Math.round(carbs * 10) / 10}g</span>
            </div>
            <div class="nutrient">
              <span class="label">Fat:</span>
              <span class="value">${Math.round(fat * 10) / 10}g</span>
            </div>
          </div>
        </div>
        
        <div class="food-actions">
          <button class="btn btn-primary add-to-log" onclick="foodSearch.addToLog('${food.fdcId || food._id}', '${food.description || food.name}')">
            Add to Log
          </button>
          ${isUSDA ? `
            <button class="btn btn-secondary import-food" onclick="foodSearch.importFromUSDA('${food.fdcId}')">
              Import
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  async addToLog(foodId, foodName) {
    const mealType = this.getSelectedMealType();
    const quantity = this.getQuantity();
    
    if (!mealType || !quantity) {
      this.showError('Please select meal type and quantity');
      return;
    }

    try {
      const response = await fetch('/api/nutritional/food-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          foodId: foodId,
          mealType: mealType,
          quantity: parseFloat(quantity),
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        this.showSuccess(`Added ${foodName} to ${mealType}`);
        this.closeModal();
        // Refresh dashboard if it exists
        if (window.nutritionalDashboard) {
          window.nutritionalDashboard.loadDailyAnalysis().then(() => 
            window.nutritionalDashboard.renderDashboard()
          );
        }
      } else {
        const error = await response.json();
        this.showError(error.error || 'Failed to add food to log');
      }
    } catch (error) {
      console.error('Add to log error:', error);
      this.showError('Failed to add food to log');
    }
  }

  async importFromUSDA(fdcId) {
    try {
      const response = await fetch('/api/nutritional/usda/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fdcId: fdcId })
      });

      if (response.ok) {
        const importedFood = await response.json();
        this.showSuccess(`Imported ${importedFood.name} successfully`);
        // Refresh search results
        this.searchFoods();
      } else {
        const error = await response.json();
        this.showError(error.error || 'Failed to import food');
      }
    } catch (error) {
      console.error('Import error:', error);
      this.showError('Failed to import food');
    }
  }

  getSelectedMealType() {
    const mealSelect = document.getElementById('meal-type-select');
    return mealSelect ? mealSelect.value : null;
  }

  getQuantity() {
    const quantityInput = document.getElementById('food-quantity');
    return quantityInput ? quantityInput.value : null;
  }

  async loadPopularFoods() {
    try {
      const response = await fetch('/api/nutritional/foods/search?q=chicken&limit=8');
      if (response.ok) {
        const popularFoods = await response.json();
        this.renderPopularFoods(popularFoods);
      }
    } catch (error) {
      console.error('Error loading popular foods:', error);
    }
  }

  renderPopularFoods(foods) {
    const container = document.getElementById('popular-foods');
    if (!container || !foods.length) return;

    container.innerHTML = `
      <h3>Popular Foods</h3>
      <div class="popular-foods-grid">
        ${foods.map(food => this.renderFoodCard(food)).join('')}
      </div>
    `;
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  closeModal() {
    const modal = document.getElementById('food-search-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

// Initialize food search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.foodSearch = new FoodSearch();
});
