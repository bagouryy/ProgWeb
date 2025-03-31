class RecipeService {
    constructor() {
      this.recipes = [];
    }

    async loadRecipes() {
      try {
        const response = await $.getJSON('/data/recipes.json');
        this.recipes = response;
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
      await this.loadRecipes();
      return this.recipes;
    }


    async saveRecipe(recipe) {
      try {
        const response = await $.ajax({
          url: '/api/recipes',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(recipe)
        });
        return response;
      } catch (error) {
        console.error('Error saving recipe:', error);
        throw error;
      }
    }

    async updateRecipeStatus(name, published) {
      const recipe = await this.getRecipeByName(name);
      if (recipe) {
        recipe.published = published;
        await this.updateRecipe(recipe);
        return true;
      }
      return false;
    }

    async updateRecipe(recipe) {
      try {
        const response = await $.ajax({
          url: `/api/recipes/${encodeURIComponent(recipe.name)}`,
          method: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(recipe)
        });
        return response;
      } catch (error) {
        console.error('Error updating recipe:', error);
        throw error;
      }
    }


    async deleteRecipe(name) {
      try {
        await $.ajax({
          url: `/api/recipes/${encodeURIComponent(recipe.name)}`,
          method: 'DELETE'
        });
        return true;
      } catch (error) {
        console.error('Error deleting recipe:', error);
        throw error;
      }
    }
    
    async getRecipeByName(name) {
        await this.loadRecipes();
        return this.recipes.find(r => r.name === name);
    }
}

const recipeService = new RecipeService();
export default recipeService;
