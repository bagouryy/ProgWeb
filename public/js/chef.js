import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authError = document.getElementById('auth-error');
    const chefInterface = document.getElementById('chef-interface');
    const recipeForm = document.getElementById('recipe-form');
    const addIngredientBtn = document.getElementById('add-ingredient');
    const addStepBtn = document.getElementById('add-step');
    const ingredientsList = document.getElementById('ingredients-list');
    const stepsList = document.getElementById('steps-list');
    const imagePreview = document.getElementById('image-preview');
    const messageDiv = document.getElementById('message');
    const pageTitle = document.getElementById('page-title');
    const submitButton = document.getElementById('submit-recipe');
    const languageToggle = document.getElementById('language-toggle');
    const recipeImages = document.getElementById('recipe-images');

    let language = localStorage.getItem('language') || 'en';
    let editMode = false;
    let editRecipeId = null;
    let currentImages = [];

    // Check chef access
    const user = userService.getLoggedInUser();
    if (!user || !user.roles.includes('Chef')) {
        authError.classList.remove('hidden');
        chefInterface.classList.add('hidden');
        return;
    }

    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('edit')) {
        editMode = true;
        editRecipeId = urlParams.get('edit');
        pageTitle.textContent = 'Edit Recipe';
        submitButton.textContent = 'Update Recipe';
        await loadRecipeForEdit(editRecipeId);
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

    const createIngredientElement = (ingredient = { name: '', quantity: '', unit: '' }, nameFR = '') => {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 p-4 rounded-lg animate-fade-in';
        div.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Name (English)</label>
                    <input type="text" class="ingredient-name w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                           value="${ingredient.name}" required>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Name (French)</label>
                    <input type="text" class="ingredient-name-fr w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                           value="${nameFR}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input type="number" step="0.1" class="ingredient-quantity w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                           value="${ingredient.quantity}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input type="text" class="ingredient-unit w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                           value="${ingredient.unit}">
                </div>
            </div>
            <button type="button" class="remove-ingredient mt-4 text-red-600 hover:text-red-900 transition-colors duration-200">
                Remove Ingredient
            </button>
        `;

        div.querySelector('.remove-ingredient').addEventListener('click', () => {
            div.classList.add('animate-fade-out');
            setTimeout(() => div.remove(), 200);
        });

        return div;
    };

    const createStepElement = (step = '', stepFR = '') => {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 p-4 rounded-lg animate-fade-in';
        div.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Step (English)</label>
                    <textarea class="step-text w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                              rows="3" required>${step}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Step (French)</label>
                    <textarea class="step-text-fr w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                              rows="3">${stepFR}</textarea>
                </div>
            </div>
            <button type="button" class="remove-step mt-4 text-red-600 hover:text-red-900 transition-colors duration-200">
                Remove Step
            </button>
        `;

        div.querySelector('.remove-step').addEventListener('click', () => {
            div.classList.add('animate-fade-out');
            setTimeout(() => div.remove(), 200);
        });

        return div;
    };

    // Load recipe data for editing
    async function loadRecipeForEdit(recipeId) {
        try {
            const recipe = await recipeService.getRecipeById(recipeId);
            if (!recipe) {
                showMessage('Recipe not found');
                return;
            }

            // Fill in basic information
            document.getElementById('recipe-name').value = recipe.name;
            document.getElementById('recipe-name-fr').value = recipe.nameFR || '';
            document.getElementById('gluten-free').checked = recipe.dietary?.glutenFree || false;
            document.getElementById('vegan').checked = recipe.dietary?.vegan || false;

            // Load ingredients
            ingredientsList.innerHTML = '';
            recipe.ingredients.forEach((ing, index) => {
                const ingFR = recipe.ingredientsFR?.[index] || '';
                ingredientsList.appendChild(createIngredientElement(ing, ingFR));
            });

            // Load steps
            stepsList.innerHTML = '';
            recipe.steps.forEach((step, index) => {
                const stepFR = recipe.stepsFR?.[index] || '';
                stepsList.appendChild(createStepElement(step, stepFR));
            });

            // Load images
            currentImages = recipe.images || [];
            updateImagePreviews();
        } catch (error) {
            showMessage(error.message);
        }
    }

    // Handle image upload and preview
    const updateImagePreviews = () => {
        imagePreview.innerHTML = currentImages.map((image, index) => `
            <div class="relative group animate-fade-in">
                <img src="${image.url}" alt="Recipe image ${index + 1}" class="w-full h-48 object-cover rounded-lg">
                <button type="button" data-index="${index}" 
                        class="remove-image absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `).join('');

        // Add event listeners for image removal
        imagePreview.querySelectorAll('.remove-image').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                currentImages.splice(index, 1);
                updateImagePreviews();
            });
        });
    };

    recipeImages.addEventListener('change', () => {
        const files = Array.from(recipeImages.files);
        const promises = files.map(file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ url: e.target.result, file });
            reader.readAsDataURL(file);
        }));

        Promise.all(promises).then(newImages => {
            currentImages.push(...newImages);
            updateImagePreviews();
        });
    });

    // Event listeners
    addIngredientBtn.addEventListener('click', () => {
        ingredientsList.appendChild(createIngredientElement());
    });

    addStepBtn.addEventListener('click', () => {
        stepsList.appendChild(createStepElement());
    });

    languageToggle.addEventListener('click', () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
    });

    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${editMode ? 'Updating...' : 'Submitting...'}
        `;

        try {
            const recipeData = {
                name: document.getElementById('recipe-name').value,
                nameFR: document.getElementById('recipe-name-fr').value,
                dietary: {
                    glutenFree: document.getElementById('gluten-free').checked,
                    vegan: document.getElementById('vegan').checked
                },
                ingredients: [],
                ingredientsFR: [],
                steps: [],
                stepsFR: [],
                images: currentImages,
                author: user.username
            };

            // Gather ingredients
            ingredientsList.querySelectorAll('.bg-gray-50').forEach(div => {
                recipeData.ingredients.push({
                    name: div.querySelector('.ingredient-name').value,
                    quantity: parseFloat(div.querySelector('.ingredient-quantity').value),
                    unit: div.querySelector('.ingredient-unit').value
                });
                recipeData.ingredientsFR.push(div.querySelector('.ingredient-name-fr').value);
            });

            // Gather steps
            stepsList.querySelectorAll('.bg-gray-50').forEach(div => {
                recipeData.steps.push(div.querySelector('.step-text').value);
                recipeData.stepsFR.push(div.querySelector('.step-text-fr').value);
            });

            if (editMode) {
                await recipeService.updateRecipe(editRecipeId, recipeData);
                showMessage('Recipe updated successfully!', false);
            } else {
                await recipeService.createRecipe(recipeData);
                showMessage('Recipe submitted successfully!', false);
                recipeForm.reset();
                ingredientsList.innerHTML = '';
                stepsList.innerHTML = '';
                currentImages = [];
                updateImagePreviews();
            }
        } catch (error) {
            showMessage(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = editMode ? 'Update Recipe' : 'Submit Recipe';
        }
    });

    // Initialize with one empty ingredient and step if not in edit mode
    if (!editMode) {
        ingredientsList.appendChild(createIngredientElement());
        stepsList.appendChild(createStepElement());
    }
});