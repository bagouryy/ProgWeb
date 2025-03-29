class RecipeService {
    constructor() {
      this.recipes = [];
      this.loadRecipes();
    }
  
    async loadRecipes() {
      try {
        const response = await $.getJSON('/data/recipes.json');
        const baseRecipes = response.map(r => ({
          ...r,
          source: 'base'
        }));
        const localRecipes = JSON.parse(localStorage.getItem('localRecipes') || '[]');
        const enrichedLocal = localRecipes.map(r => ({
          ...r,
          source: 'local'
        }));
        this.recipes = [...baseRecipes, ...enrichedLocal];
      } catch (error) {
        console.error('Error loading recipes:', error);
        this.recipes = [];
      }
    }
  
    async ensureRecipesLoaded() {
      if (this.recipes.length === 0) {
        await this.loadRecipes();
      }
    }
  
    async getAllRecipes() {
      await this.ensureRecipesLoaded();
      return this.recipes;
    }
  
    async getRecipeById(id) {
      await this.ensureRecipesLoaded();
      return this.recipes.find(recipe => recipe.id === id);
    }
  
    async saveRecipe(recipe) {
      await this.ensureRecipesLoaded();
      if (!recipe.id) {
        recipe.id = Date.now().toString();
      }
  
      const localRecipes = JSON.parse(localStorage.getItem('localRecipes') || '[]');
      const index = localRecipes.findIndex(r => r.id === recipe.id);
  
      if (index >= 0) {
        localRecipes[index] = recipe;
      } else {
        localRecipes.push(recipe);
      }
  
      localStorage.setItem('localRecipes', JSON.stringify(localRecipes));
  
      const memoryIndex = this.recipes.findIndex(r => r.id === recipe.id);
      if (memoryIndex >= 0) {
        this.recipes[memoryIndex] = recipe;
      } else {
        this.recipes.push({ ...recipe, source: 'local' });
      }
  
      try {
        await $.ajax({
          url: '/api/recipes',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(recipe)
        });
      } catch (error) {
        console.warn('Could not persist recipe to JSON file:', error);
      }
  
      return recipe;
    }
  
    async updateRecipeStatus(id, published) {
      const recipe = await this.getRecipeById(id);
      if (recipe) {
        recipe.published = published;
        await this.saveRecipe(recipe);
        return true;
      }
      return false;
    }
  
    async deleteRecipe(id) {
      const localRecipes = JSON.parse(localStorage.getItem('localRecipes') || '[]');
      const updated = localRecipes.filter(r => r.id !== id);
      localStorage.setItem('localRecipes', JSON.stringify(updated));
      this.recipes = this.recipes.filter(r => r.id !== id || r.source !== 'local');
      return true;
    }
  
    async saveTranslation(recipeId, translatedFields, language) {
      const recipe = await this.getRecipeById(recipeId);
      if (!recipe) return false;
  
      const updated = { ...recipe };
  
      if (language === 'fr') {
        if (!updated.nameFR && translatedFields.name) updated.nameFR = translatedFields.name;
        if (!updated.ingredientsFR && translatedFields.ingredients) updated.ingredientsFR = translatedFields.ingredients;
        if (!updated.stepsFR && translatedFields.steps) updated.stepsFR = translatedFields.steps;
      } else {
        if (!updated.name && translatedFields.name) updated.name = translatedFields.name;
        if (!updated.ingredients && translatedFields.ingredients) updated.ingredients = translatedFields.ingredients;
        if (!updated.steps && translatedFields.steps) updated.steps = translatedFields.steps;
      }
  
      await this.saveRecipe(updated);
      return true;
    }
  }
  
  const recipeService = new RecipeService();
  export default recipeService;
  