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

    async updateRecipeStatus(id, published) {
      const recipe = await this.getRecipeById(id);
      console.log('Updating recipe status:', recipe);
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
    
    async getRecipeById(id) {
      await this.loadRecipes();
      console.log('Fetching recipe with ID:', id);
      console.log('Available recipes:', this.recipes);
      return this.recipes.find(recipe => recipe.id === id);
    }

    async addLike(recipeId) {
      try {
        const response = await $.ajax({
          url: `/api/recipes/${recipeId}/like`,
          method: 'POST'
        });
        return response;
      } catch (error) {
        console.error('Error adding like:', error);
        throw error;
      }
    }

    async removeLike(recipeId) {
        try {
          const response = await $.ajax({
            url: `/api/recipes/${recipeId}/like`,
            method: 'PUT'
          });
          return response;
        } catch (error) {
          console.error('Error adding like:', error);
          throw error;
        }
      }

    async addComment(recipeId, comment) {
      try {
        const response = await $.ajax({
          url: `/api/recipes/${recipeId}/comment`,
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ comment })
        });
        return response;
      } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
      }
    }
}

const recipeService = new RecipeService();
export default recipeService;
