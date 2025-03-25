import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authError = document.getElementById('auth-error');
    const translationInterface = document.getElementById('translation-interface');
    const recipeSelector = document.getElementById('recipe-selector');
    const languageToggle = document.getElementById('language-toggle');
    const originalTitle = document.getElementById('original-title');
    const translatedTitle = document.getElementById('translated-title');
    const originalIngredients = document.getElementById('original-ingredients');
    const translatedIngredients = document.getElementById('translated-ingredients');
    const originalSteps = document.getElementById('original-steps');
    const translatedSteps = document.getElementById('translated-steps');
    const validationMessage = document.getElementById('validation-message');
    const submitButton = document.getElementById('submit-translation');

    let currentRecipe = null;
    let language = localStorage.getItem('language') || 'en';

    // Check translator access
    function checkTranslatorAccess() {
        const user = userService.getLoggedInUser();
        if (!user || !userService.isTranslator(user.username)) {
            authError.classList.remove('hidden');
            translationInterface.classList.add('hidden');
            return false;
        }
        return true;
    }

    // Toggle interface language
    function toggleLanguage() {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
        loadRecipes();
    }

    // Load recipes that need translation
    async function loadRecipes() {
        try {
            const allRecipes = await recipeService.getAllRecipes();
            const needsTranslation = allRecipes.filter(recipe => {
                const needsEnTranslation = !recipe.name && recipe.nameFR;
                const needsFrTranslation = recipe.name && !recipe.nameFR;
                const needsIngredientTranslation = recipe.ingredients && (!recipe.ingredientsFR || recipe.ingredientsFR.some(ing => !ing.name));
                const needsStepTranslation = recipe.steps && (!recipe.stepsFR || recipe.stepsFR.length !== recipe.steps.length);
                return needsEnTranslation || needsFrTranslation || needsIngredientTranslation || needsStepTranslation;
            });
            updateRecipeSelector(needsTranslation);
        } catch (error) {
            console.error('Error loading recipes:', error);
            showValidationMessage('Error loading recipes', true);
        }
    }

    // Update recipe selector dropdown
    function updateRecipeSelector(recipes) {
        recipeSelector.innerHTML = '<option value="">Select a recipe...</option>' +
            recipes.map(recipe => `
                <option value="${recipe.id}">
                    ${recipe.name || recipe.nameFR}
                </option>
            `).join('');
    }

    // Display recipe content
    function displayRecipe(recipe) {
        currentRecipe = recipe;
        const isToFrench = recipe.name && !recipe.nameFR;

        // Display titles
        originalTitle.textContent = isToFrench ? recipe.name : recipe.nameFR;
        translatedTitle.value = isToFrench ? recipe.nameFR || '' : recipe.name || '';
        translatedTitle.disabled = !originalTitle.textContent;

        // Display ingredients
        const origIngredients = isToFrench ? recipe.ingredients : recipe.ingredientsFR || [];
        const transIngredients = isToFrench ? recipe.ingredientsFR || [] : recipe.ingredients || [];
        
        originalIngredients.innerHTML = origIngredients.map(ing => `
            <div class="p-2 bg-gray-50 rounded border">${ing.quantity} ${ing.name}</div>
        `).join('');

        translatedIngredients.innerHTML = origIngredients.map((ing, i) => `
            <div class="flex gap-2">
                <input type="text" 
                       value="${(transIngredients[i] && transIngredients[i].quantity) || ing.quantity}"
                       class="w-24 p-2 border rounded"
                       placeholder="Quantity"
                       disabled>
                <input type="text"
                       value="${(transIngredients[i] && transIngredients[i].name) || ''}"
                       class="flex-1 p-2 border rounded"
                       placeholder="Name"
                       ${!ing.name ? 'disabled' : ''}>
            </div>
        `).join('');

        // Display steps
        const origSteps = isToFrench ? recipe.steps : recipe.stepsFR || [];
        const transSteps = isToFrench ? recipe.stepsFR || [] : recipe.steps || [];

        originalSteps.innerHTML = origSteps.map(step => `
            <div class="p-2 bg-gray-50 rounded border">${step}</div>
        `).join('');

        translatedSteps.innerHTML = origSteps.map((step, i) => `
            <textarea class="w-full p-2 border rounded"
                      placeholder="Translate this step"
                      ${!step ? 'disabled' : ''}>${transSteps[i] || ''}</textarea>
        `).join('');
    }

    // Validate translation
    function validateTranslation() {
        const translatedTitleValue = translatedTitle.value;
        const translatedIngredientValues = Array.from(translatedIngredients.querySelectorAll('input:nth-child(2)')).map(input => input.value);
        const translatedStepValues = Array.from(translatedSteps.querySelectorAll('textarea')).map(textarea => textarea.value);

        if (!translatedTitleValue.trim()) {
            showValidationMessage('Title translation is required');
            return false;
        }

        const isToFrench = Boolean(currentRecipe.name && !currentRecipe.nameFR);
        const originalIngredients = isToFrench ? currentRecipe.ingredients : currentRecipe.ingredientsFR || [];
        const originalSteps = isToFrench ? currentRecipe.steps : currentRecipe.stepsFR || [];

        if (translatedIngredientValues.some((ing, i) => !ing && originalIngredients[i].name)) {
            showValidationMessage('All ingredients must be translated');
            return false;
        }

        if (translatedStepValues.some((step, i) => !step && originalSteps[i])) {
            showValidationMessage('All steps must be translated');
            return false;
        }

        return true;
    }

    // Show validation message
    function showValidationMessage(message, isError = true) {
        validationMessage.textContent = message;
        validationMessage.classList.remove('hidden');
        validationMessage.classList.toggle('bg-red-100', isError);
        validationMessage.classList.toggle('border-red-400', isError);
        validationMessage.classList.toggle('text-red-700', isError);
        validationMessage.classList.toggle('bg-green-100', !isError);
        validationMessage.classList.toggle('border-green-400', !isError);
        validationMessage.classList.toggle('text-green-700', !isError);
        setTimeout(() => validationMessage.classList.add('hidden'), 5000);
    }

    // Save translation
    async function saveTranslation() {
        if (!validateTranslation()) return;

        const isToFrench = Boolean(currentRecipe.name && !currentRecipe.nameFR);
        const translatedFields = {
            name: translatedTitle.value,
            ingredients: Array.from(translatedIngredients.querySelectorAll('input:nth-child(2)')).map((input, i) => ({
                ...currentRecipe.ingredients[i],
                name: input.value
            })),
            steps: Array.from(translatedSteps.querySelectorAll('textarea')).map(textarea => textarea.value)
        };

        try {
            await recipeService.saveTranslation(currentRecipe.id, translatedFields, isToFrench ? 'fr' : 'en');
            showValidationMessage('Translation saved successfully!', false);
            loadRecipes();
        } catch (error) {
            showValidationMessage(error.message);
        }
    }

    // Event Listeners
    if (checkTranslatorAccess()) {
        languageToggle.addEventListener('click', toggleLanguage);
        recipeSelector.addEventListener('change', async (e) => {
            if (e.target.value) {
                const recipe = await recipeService.getRecipeById(e.target.value);
                if (recipe) displayRecipe(recipe);
            }
        });
        submitButton.addEventListener('click', saveTranslation);
        loadRecipes();
    }
});