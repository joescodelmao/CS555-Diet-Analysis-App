// public/js/nutritionalDashboard.js
class NutritionalDashboard {
  constructor() {
    this.currentDate = new Date().toISOString().split('T')[0];
    this.userGoals = null;
    this.dailyAnalysis = null;
    this.init();
  }

  async init() {
    await this.loadUserGoals();
    await this.loadDailyAnalysis();
    this.setupEventListeners();
    this.renderDashboard();
  }

  async loadUserGoals() {
    try {
      const response = await fetch('/api/nutritional/goals');
      if (response.ok) {
        this.userGoals = await response.json();
      } else {
        console.warn('No nutritional goals found');
      }
    } catch (error) {
      console.error('Error loading user goals:', error);
    }
  }

  async loadDailyAnalysis() {
    try {
      const response = await fetch(`/api/nutritional/analysis/${this.currentDate}`);
      if (response.ok) {
        this.dailyAnalysis = await response.json();
      } else {
        console.warn('No daily analysis available');
      }
    } catch (error) {
      console.error('Error loading daily analysis:', error);
    }
  }

  setupEventListeners() {
    // Date picker
    const datePicker = document.getElementById('analysis-date');
    if (datePicker) {
      datePicker.addEventListener('change', (e) => {
        this.currentDate = e.target.value;
        this.loadDailyAnalysis().then(() => this.renderDashboard());
      });
    }

    // Add food button
    const addFoodBtn = document.getElementById('add-food-btn');
    if (addFoodBtn) {
      addFoodBtn.addEventListener('click', () => {
        this.showAddFoodModal();
      });
    }

    // Set goals button
    const setGoalsBtn = document.getElementById('set-goals-btn');
    if (setGoalsBtn) {
      setGoalsBtn.addEventListener('click', () => {
        this.showGoalsModal();
      });
    }
  }

  renderDashboard() {
    this.renderNutritionalSummary();
    this.renderMealBreakdown();
    this.renderProgressBars();
    this.renderRecommendations();
    this.renderTrends();
  }

  renderNutritionalSummary() {
    const summaryContainer = document.getElementById('nutritional-summary');
    if (!summaryContainer || !this.dailyAnalysis) return;

    const { totals, goals } = this.dailyAnalysis;
    const dailyTotals = totals.daily;

    summaryContainer.innerHTML = `
      <div class="summary-cards">
        <div class="summary-card calories">
          <h3>Calories</h3>
          <div class="value">${dailyTotals.calories}</div>
          <div class="goal">Goal: ${goals.calories}</div>
          <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(100, (dailyTotals.calories / goals.calories) * 100)}%"></div>
          </div>
        </div>
        
        <div class="summary-card protein">
          <h3>Protein</h3>
          <div class="value">${dailyTotals.protein}g</div>
          <div class="goal">Goal: ${goals.macronutrients.protein}g</div>
          <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(100, (dailyTotals.protein / goals.macronutrients.protein) * 100)}%"></div>
          </div>
        </div>
        
        <div class="summary-card carbs">
          <h3>Carbs</h3>
          <div class="value">${dailyTotals.carbohydrates}g</div>
          <div class="goal">Goal: ${goals.macronutrients.carbohydrates}g</div>
          <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(100, (dailyTotals.carbohydrates / goals.macronutrients.carbohydrates) * 100)}%"></div>
          </div>
        </div>
        
        <div class="summary-card fat">
          <h3>Fat</h3>
          <div class="value">${dailyTotals.fat}g</div>
          <div class="goal">Goal: ${goals.macronutrients.fat}g</div>
          <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(100, (dailyTotals.fat / goals.macronutrients.fat) * 100)}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderMealBreakdown() {
    const mealContainer = document.getElementById('meal-breakdown');
    if (!mealContainer || !this.dailyAnalysis) return;

    const { dailyLog, totals } = this.dailyAnalysis;
    const mealTotals = totals.byMeal;

    mealContainer.innerHTML = `
      <div class="meals-grid">
        ${Object.entries(mealTotals).map(([mealType, totals]) => `
          <div class="meal-card ${mealType}">
            <h3>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3>
            <div class="meal-stats">
              <div class="stat">
                <span class="label">Calories:</span>
                <span class="value">${totals.calories}</span>
              </div>
              <div class="stat">
                <span class="label">Protein:</span>
                <span class="value">${totals.protein}g</span>
              </div>
              <div class="stat">
                <span class="label">Carbs:</span>
                <span class="value">${totals.carbohydrates}g</span>
              </div>
              <div class="stat">
                <span class="label">Fat:</span>
                <span class="value">${totals.fat}g</span>
              </div>
            </div>
            <div class="meal-foods">
              ${dailyLog.meals[mealType].map(entry => `
                <div class="food-entry">
                  <span class="food-name">${entry.foodName || 'Unknown Food'}</span>
                  <span class="food-quantity">${entry.quantity} ${entry.servingUnit || 'servings'}</span>
                </div>
              `).join('')}
            </div>
            <button class="add-food-btn" onclick="nutritionalDashboard.addFoodToMeal('${mealType}')">
              Add Food
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderProgressBars() {
    const progressContainer = document.getElementById('progress-bars');
    if (!progressContainer || !this.dailyAnalysis) return;

    const { totals, goals } = this.dailyAnalysis;
    const dailyTotals = totals.daily;

    progressContainer.innerHTML = `
      <div class="progress-section">
        <h3>Daily Progress</h3>
        <div class="progress-items">
          <div class="progress-item">
            <label>Calories</label>
            <div class="progress-bar">
              <div class="progress calories" style="width: ${Math.min(100, (dailyTotals.calories / goals.calories) * 100)}%"></div>
            </div>
            <span class="progress-text">${dailyTotals.calories} / ${goals.calories}</span>
          </div>
          
          <div class="progress-item">
            <label>Protein</label>
            <div class="progress-bar">
              <div class="progress protein" style="width: ${Math.min(100, (dailyTotals.protein / goals.macronutrients.protein) * 100)}%"></div>
            </div>
            <span class="progress-text">${dailyTotals.protein}g / ${goals.macronutrients.protein}g</span>
          </div>
          
          <div class="progress-item">
            <label>Carbohydrates</label>
            <div class="progress-bar">
              <div class="progress carbs" style="width: ${Math.min(100, (dailyTotals.carbohydrates / goals.macronutrients.carbohydrates) * 100)}%"></div>
            </div>
            <span class="progress-text">${dailyTotals.carbohydrates}g / ${goals.macronutrients.carbohydrates}g</span>
          </div>
          
          <div class="progress-item">
            <label>Fat</label>
            <div class="progress-bar">
              <div class="progress fat" style="width: ${Math.min(100, (dailyTotals.fat / goals.macronutrients.fat) * 100)}%"></div>
            </div>
            <span class="progress-text">${dailyTotals.fat}g / ${goals.macronutrients.fat}g</span>
          </div>
        </div>
      </div>
    `;
  }

  renderRecommendations() {
    const recommendationsContainer = document.getElementById('recommendations');
    if (!recommendationsContainer || !this.dailyAnalysis) return;

    const { analysis } = this.dailyAnalysis;
    const recommendations = analysis.recommendations || [];
    const warnings = analysis.warnings || [];

    recommendationsContainer.innerHTML = `
      <div class="recommendations-section">
        <h3>Recommendations</h3>
        ${recommendations.length > 0 ? `
          <div class="recommendations-list">
            ${recommendations.map(rec => `
              <div class="recommendation-item">
                <i class="icon">💡</i>
                <span>${rec}</span>
              </div>
            `).join('')}
          </div>
        ` : '<p class="no-recommendations">Great job! You\'re meeting your nutritional goals.</p>'}
        
        ${warnings.length > 0 ? `
          <div class="warnings-section">
            <h4>Warnings</h4>
            <div class="warnings-list">
              ${warnings.map(warning => `
                <div class="warning-item">
                  <i class="icon">⚠️</i>
                  <span>${warning}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderTrends() {
    const trendsContainer = document.getElementById('trends');
    if (!trendsContainer) return;

    // Load trends for the past 7 days
    this.loadTrends().then(trends => {
      if (trends && trends.trends) {
        trendsContainer.innerHTML = `
          <div class="trends-section">
            <h3>7-Day Trends</h3>
            <div class="trends-chart">
              <canvas id="trends-chart" width="400" height="200"></canvas>
            </div>
            <div class="trends-summary">
              <div class="trend-item">
                <span class="label">Avg Calories:</span>
                <span class="value">${trends.averages.calories}</span>
              </div>
              <div class="trend-item">
                <span class="label">Avg Protein:</span>
                <span class="value">${trends.averages.protein}g</span>
              </div>
              <div class="trend-item">
                <span class="label">Avg Carbs:</span>
                <span class="value">${trends.averages.carbohydrates}g</span>
              </div>
              <div class="trend-item">
                <span class="label">Avg Fat:</span>
                <span class="value">${trends.averages.fat}g</span>
              </div>
            </div>
          </div>
        `;
        
        this.renderTrendsChart(trends);
      }
    });
  }

  async loadTrends() {
    try {
      const response = await fetch(`/api/nutritional/trends/${this.currentDate}/7`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    }
    return null;
  }

  renderTrendsChart(trends) {
    const canvas = document.getElementById('trends-chart');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    const dates = trends.trends.dates.map(date => new Date(date).toLocaleDateString());

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Calories',
            data: trends.trends.calories,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            tension: 0.4
          },
          {
            label: 'Protein',
            data: trends.trends.protein,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            tension: 0.4
          }
        ]
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

  showAddFoodModal() {
    // Implementation for add food modal
    console.log('Show add food modal');
  }

  showGoalsModal() {
    // Implementation for goals modal
    console.log('Show goals modal');
  }

  addFoodToMeal(mealType) {
    // Implementation for adding food to specific meal
    console.log(`Add food to ${mealType}`);
  }
}

// Export the class for global access
window.NutritionalDashboard = NutritionalDashboard;
