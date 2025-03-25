/**
 * Recipe Service Module
 * Handles recipe management using localStorage for temporary storage
 */
class RecipeService {
    constructor() {
        this.recipes = [];
        this.loadRecipes();
    }

    async loadRecipes() {
        try {
            // Load base recipes from JSON file
            const response = await fetch('../data/recipes.json');
            const baseRecipes = await response.json();
            
            // Load any locally stored recipes and merge them
            const localRecipes = JSON.parse(localStorage.getItem('localRecipes') || '[]');
            this.recipes = [...baseRecipes, ...localRecipes];
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.recipes = [];
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
        
        // Generate new ID for new recipes
        if (!recipe.id) {
            recipe.id = Date.now().toString();
        }

        // Get local recipes
        const localRecipes = JSON.parse(localStorage.getItem('localRecipes') || '[]');

        // Update existing or add new
        const existingIndex = localRecipes.findIndex(r => r.id === recipe.id);
        if (existingIndex >= 0) {
            localRecipes[existingIndex] = recipe;
        } else {
            localRecipes.push(recipe);
        }

        // Save back to localStorage
        localStorage.setItem('localRecipes', JSON.stringify(localRecipes));

        // Update in-memory recipes
        const memoryIndex = this.recipes.findIndex(r => r.id === recipe.id);
        if (memoryIndex >= 0) {
            this.recipes[memoryIndex] = recipe;
        } else {
            this.recipes.push(recipe);
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
        // We can only delete local recipes
        const localRecipes = JSON.parse(localStorage.getItem('localRecipes') || '[]');
        const updatedLocalRecipes = localRecipes.filter(recipe => recipe.id !== id);
        localStorage.setItem('localRecipes', JSON.stringify(updatedLocalRecipes));

        // Update in-memory recipes
        this.recipes = this.recipes.filter(recipe => recipe.id !== id);
        return true;
    }

    async saveTranslation(recipeId, translatedFields, language) {
        const recipe = await this.getRecipeById(recipeId);
        if (!recipe) return false;

        const updatedRecipe = { ...recipe };
        
        if (language === 'fr') {
            updatedRecipe.nameFR = translatedFields.name;
            updatedRecipe.ingredientsFR = translatedFields.ingredients;
            updatedRecipe.stepsFR = translatedFields.steps;
        } else {
            updatedRecipe.name = translatedFields.name;
            updatedRecipe.ingredients = translatedFields.ingredients;
            updatedRecipe.steps = translatedFields.steps;
        }

        await this.saveRecipe(updatedRecipe);
        return true;
    }

    // Helper method to ensure recipes are loaded
    async ensureRecipesLoaded() {
        if (this.recipes.length === 0) {
            await this.loadRecipes();
        }
    }
}

// Create and export a singleton instance
const recipeService = new RecipeService();
export default recipeService;