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
            const url = '/data/recipes.json';
            console.log('Fetching recipes from:', url);

            // Load base recipes from JSON file
            const response = await $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json'
            });
            console.log('Fetched recipes:', response);

            const baseRecipes = response;

            // Load any locally stored recipes and merge them
            const localRecipes = JSON.parse(localStorage.getItem('localRecipes') || '[]');
            this.recipes = [...baseRecipes, ...localRecipes];
            console.log('Final recipes array:', this.recipes);
        } catch (error) {
            console.error('Error loading recipes:', error);

            // Fallback data for debugging
            this.recipes = [
                {
                    id: '1',
                    name: 'Fallback Recipe',
                    nameFR: 'Recette de secours',
                    author: 'Unknown',
                    ingredients: [
                        { quantity: '1', name: 'Ingredient 1', type: 'Misc' }
                    ],
                    steps: ['Step 1', 'Step 2'],
                    dietary: { glutenFree: true, vegan: false },
                    images: []
                }
            ];
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

        // Append to recipes.json using AJAX
        try {
            await $.ajax({
                url: '../data/recipes.json',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(recipe)
            });
        } catch (error) {
            console.error('Error appending recipe to recipes.json:', error);
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
        console.log('Ensuring recipes are loaded...');
        if (this.recipes.length === 0) {
            console.log('Recipes array is empty. Loading recipes...');
            await this.loadRecipes();
        } else {
            console.log('Recipes are already loaded.');
        }
    }
}

// Create and export a singleton instance
const recipeService = new RecipeService();
export default recipeService;