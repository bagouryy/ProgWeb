import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authError = document.getElementById('auth-error');
    const translatorInterface = document.getElementById('translator-interface');
    const recipesList = document.getElementById('recipes-list');
    const translationModal = document.getElementById('translation-modal');
    const translationForm = document.getElementById('translation-form');
    const closeModalBtn = document.getElementById('close-modal');
    const showAllBtn = document.getElementById('show-all');
    const showPendingBtn = document.getElementById('show-pending');
    const messageDiv = document.getElementById('message');
    const languageToggle = document.getElementById('language-toggle');

    let currentRecipe = null;
    let showOnlyPending = false;
    let language = localStorage.getItem('language') || 'en';

    // Check translator access
    const user = userService.getLoggedInUser();
    if (!user || !user.roles.includes('Traducteur')) {
        authError.classList.remove('hidden');
        translatorInterface.classList.add('hidden');
        return;
    }

    const showMessage = (message, isError = true) => {
        messageDiv.textContent = message;
        messageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        messageDiv.classList.add(
            isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            'animate-fade-in'
        );
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
    };

    const createRecipeCard = (recipe) => {
        const hasTranslation = recipe.nameFR && recipe.ingredientsFR?.length && recipe.stepsFR?.length;
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden';
        card.innerHTML = `
            <div class="relative">
                <img src="${recipe.images?.[0]?.url || 'https://via.placeholder.com/400x200'}" 
                     alt="${recipe.name}" 
                     class="w-full h-48 object-cover">
                ${hasTranslation ? `
                    <div class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                        Translated
                    </div>
                ` : ''}
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">${recipe.name}</h3>
                <p class="text-gray-600 mb-4">By ${recipe.author}</p>
                <div class="flex gap-2">
                    ${recipe.dietary?.glutenFree ? '<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Gluten-Free</span>' : ''}
                    ${recipe.dietary?.vegan ? '<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Vegan</span>' : ''}
                </div>
                <button class="translate-btn mt-4 w-full bg-primary-600 hover:bg-primary-500 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                    ${hasTranslation ? 'Edit Translation' : 'Translate Recipe'}
                </button>
            </div>
        `;

        card.querySelector('.translate-btn').addEventListener('click', () => {
            openTranslationModal(recipe);
        });

        return card;
    };

    const createIngredientTranslationElement = (ingredient, index, translationFR = '') => {
        const div = document.createElement('div');
        div.className = 'grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg animate-fade-in';
        div.innerHTML = `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ingredient ${index + 1} (English)</label>
                <p class="text-gray-900 p-2 bg-white rounded-lg">${ingredient.name}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Ingredient ${index + 1} (French)</label>
                <input type="text" class="ingredient-fr w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                       value="${translationFR}" required>
            </div>
        `;
        return div;
    };

    const createStepTranslationElement = (step, index, translationFR = '') => {
        const div = document.createElement('div');
        div.className = 'grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg animate-fade-in';
        div.innerHTML = `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Step ${index + 1} (English)</label>
                <p class="text-gray-900 p-2 bg-white rounded-lg whitespace-pre-wrap">${step}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Step ${index + 1} (French)</label>
                <textarea class="step-fr w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                          rows="3" required>${translationFR}</textarea>
            </div>
        `;
        return div;
    };

    const openTranslationModal = (recipe) => {
        currentRecipe = recipe;
        
        // Update form fields
        document.getElementById('recipe-name').textContent = recipe.name;
        document.getElementById('recipe-name-fr').value = recipe.nameFR || '';

        // Update ingredients
        const ingredientsList = document.getElementById('ingredients-list');
        ingredientsList.innerHTML = '';
        recipe.ingredients.forEach((ingredient, index) => {
            const translationFR = recipe.ingredientsFR?.[index] || '';
            ingredientsList.appendChild(createIngredientTranslationElement(ingredient, index, translationFR));
        });

        // Update steps
        const stepsList = document.getElementById('steps-list');
        stepsList.innerHTML = '';
        recipe.steps.forEach((step, index) => {
            const translationFR = recipe.stepsFR?.[index] || '';
            stepsList.appendChild(createStepTranslationElement(step, index, translationFR));
        });

        // Show modal with animation
        translationModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeTranslationModal = () => {
        translationModal.classList.add('hidden');
        document.body.style.overflow = '';
        currentRecipe = null;
    };

    const loadRecipes = async () => {
        try {
            const recipes = await recipeService.getAllRecipes();
            recipesList.innerHTML = '';
            
            recipes
                .filter(recipe => !showOnlyPending || !(recipe.nameFR && recipe.ingredientsFR?.length && recipe.stepsFR?.length))
                .forEach(recipe => {
                    recipesList.appendChild(createRecipeCard(recipe));
                });
        } catch (error) {
            showMessage(error.message);
        }
    };

    // Event Listeners
    translationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentRecipe) return;

        const submitBtn = document.getElementById('submit-translation');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
        `;

        try {
            const updatedRecipe = {
                ...currentRecipe,
                nameFR: document.getElementById('recipe-name-fr').value,
                ingredientsFR: Array.from(document.querySelectorAll('.ingredient-fr')).map(input => input.value),
                stepsFR: Array.from(document.querySelectorAll('.step-fr')).map(textarea => textarea.value)
            };

            await recipeService.updateRecipe(currentRecipe._id, updatedRecipe);
            showMessage('Translation saved successfully!', false);
            closeTranslationModal();
            loadRecipes();
        } catch (error) {
            showMessage(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Translation';
        }
    });

    closeModalBtn.addEventListener('click', closeTranslationModal);
    translationModal.addEventListener('click', (e) => {
        if (e.target === translationModal) closeTranslationModal();
    });

    showAllBtn.addEventListener('click', () => {
        showOnlyPending = false;
        showAllBtn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
        showAllBtn.classList.add('bg-primary-600', 'text-white');
        showPendingBtn.classList.remove('bg-primary-600', 'text-white');
        showPendingBtn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        loadRecipes();
    });

    showPendingBtn.addEventListener('click', () => {
        showOnlyPending = true;
        showPendingBtn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
        showPendingBtn.classList.add('bg-primary-600', 'text-white');
        showAllBtn.classList.remove('bg-primary-600', 'text-white');
        showAllBtn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        loadRecipes();
    });

    languageToggle.addEventListener('click', () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
    });

    // Initialize
    loadRecipes();
});