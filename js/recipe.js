import recipeService from './recipeService.js';
import userService from './userService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const languageToggle = document.getElementById('language-toggle');
    const recipeContainer = document.getElementById('recipe-container');
    const messageDiv = document.getElementById('message');
    const deleteButton = document.getElementById('delete-recipe');
    const editButton = document.getElementById('edit-recipe');
    
    let recipe = null;
    let language = localStorage.getItem('language') || 'en';

    const showMessage = (message, isError = true) => {
        messageDiv.textContent = message;
        messageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        messageDiv.classList.add(
            isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            'animate-fade-in'
        );
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
    };

    const createIngredientElement = (ingredient, translationFR = '') => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 py-2';
        div.innerHTML = `
            <span class="text-gray-600 min-w-[80px]">${ingredient.quantity} ${ingredient.unit}</span>
            <span class="text-gray-900">${language === 'en' ? ingredient.name : translationFR || ingredient.name}</span>
        `;
        return div;
    };

    const createStepElement = (step, index, translationFR = '') => {
        const div = document.createElement('div');
        div.className = 'flex gap-4 py-4';
        div.innerHTML = `
            <div class="flex-shrink-0">
                <span class="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-medium">
                    ${index + 1}
                </span>
            </div>
            <p class="text-gray-700 flex-grow">${language === 'en' ? step : translationFR || step}</p>
        `;
        return div;
    };

    const loadRecipe = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const recipeId = urlParams.get('id');
            
            if (!recipeId) {
                showMessage('No recipe ID provided');
                return;
            }

            recipe = await recipeService.getRecipeById(recipeId);
            if (!recipe) {
                showMessage('Recipe not found');
                return;
            }

            updateRecipeDisplay();
        } catch (error) {
            showMessage(error.message);
        }
    };

    const updateRecipeDisplay = () => {
        // Update recipe title and metadata
        document.title = `${language === 'en' ? recipe.name : recipe.nameFR || recipe.name} - Recipe Manager`;
        
        recipeContainer.innerHTML = `
            <div class="mb-8">
                <div class="relative rounded-xl overflow-hidden mb-6">
                    <div class="aspect-w-16 aspect-h-9">
                        <img src="${recipe.images?.[0]?.url || 'https://via.placeholder.com/1200x675'}" 
                             alt="${recipe.name}" 
                             class="w-full h-full object-cover">
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                        <h1 class="text-4xl font-bold text-white mb-2">
                            ${language === 'en' ? recipe.name : recipe.nameFR || recipe.name}
                        </h1>
                        <p class="text-gray-200">By ${recipe.author}</p>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3 mb-6">
                    ${recipe.dietary?.glutenFree ? 
                        '<span class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-lg">Gluten-Free</span>' : ''}
                    ${recipe.dietary?.vegan ? 
                        '<span class="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-lg">Vegan</span>' : ''}
                </div>

                <!-- Additional images carousel -->
                ${recipe.images?.length > 1 ? `
                    <div class="grid grid-cols-4 gap-4 mb-8">
                        ${recipe.images.map((image, index) => `
                            <button class="recipe-image-btn relative rounded-lg overflow-hidden ${index === 0 ? 'ring-2 ring-primary-500' : ''}"
                                    data-index="${index}">
                                <img src="${image.url}" 
                                     alt="${recipe.name} image ${index + 1}" 
                                     class="w-full h-24 object-cover">
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Ingredients -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-xl shadow-card p-6">
                        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Ingredients</h2>
                        <div id="ingredients-list" class="divide-y divide-gray-200">
                            ${recipe.ingredients.map((ingredient, index) => `
                                <div class="flex items-center gap-2 py-2">
                                    <span class="text-gray-600 min-w-[80px]">${ingredient.quantity} ${ingredient.unit}</span>
                                    <span class="text-gray-900">${language === 'en' ? 
                                        ingredient.name : 
                                        (recipe.ingredientsFR?.[index] || ingredient.name)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Instructions -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-card p-6">
                        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Instructions</h2>
                        <div id="steps-list" class="divide-y divide-gray-200">
                            ${recipe.steps.map((step, index) => `
                                <div class="flex gap-4 py-4">
                                    <div class="flex-shrink-0">
                                        <span class="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-medium">
                                            ${index + 1}
                                        </span>
                                    </div>
                                    <p class="text-gray-700 flex-grow">${language === 'en' ? 
                                        step : 
                                        (recipe.stepsFR?.[index] || step)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for image carousel
        if (recipe.images?.length > 1) {
            const mainImage = recipeContainer.querySelector('.aspect-w-16 img');
            recipeContainer.querySelectorAll('.recipe-image-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    mainImage.src = recipe.images[index].url;
                    
                    // Update active state
                    recipeContainer.querySelectorAll('.recipe-image-btn').forEach(b => 
                        b.classList.toggle('ring-2', b === btn));
                });
            });
        }
    };

    // Event Listeners
    languageToggle.addEventListener('click', () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
        if (recipe) {
            updateRecipeDisplay();
        }
    });

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (!recipe || !confirm('Are you sure you want to delete this recipe?')) return;

            try {
                await recipeService.deleteRecipe(recipe._id);
                window.location.href = 'index.html';
            } catch (error) {
                showMessage(error.message);
            }
        });
    }

    if (editButton) {
        editButton.addEventListener('click', () => {
            if (recipe) {
                window.location.href = `chef.html?edit=${recipe._id}`;
            }
        });
    }

    // Check user permissions for edit/delete buttons
    await userService.loadUsers();
    const user = userService.getLoggedInUser();
    if (user) {
        const canEdit = user.roles.includes('Chef') && recipe?.author === user.username;
        const canDelete = user.roles.includes('Admin') || (user.roles.includes('Chef') && recipe?.author === user.username);
        
        if (editButton) editButton.style.display = canEdit ? '' : 'none';
        if (deleteButton) deleteButton.style.display = canDelete ? '' : 'none';
    }

    // Initialize
    await loadRecipe();
});