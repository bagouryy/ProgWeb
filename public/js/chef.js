import userService from './userService.js';
import recipeService from './recipeService.js';

// Check authentication and role
async function checkChefAccess() {
    const user = userService.getLoggedInUser();
    if (!user || !userService.isChef(user.username)) {
        document.getElementById('auth-error').classList.remove('hidden');
        document.getElementById('recipe-form').classList.add('hidden');
        return false;
    }
    return true;
}

// Handle ingredient rows
function createIngredientRow() {
    const row = document.createElement('div');
    row.className = 'flex gap-2 mb-2';
    row.innerHTML = `
        <input type="text" placeholder="Ingredient name" class="flex-1 shadow border rounded py-2 px-3 text-gray-700" required>
        <input type="number" placeholder="Quantity" class="w-24 shadow border rounded py-2 px-3 text-gray-700" required>
        <select class="w-24 shadow border rounded py-2 px-3 text-gray-700" required>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="cup">cup</option>
            <option value="tbsp">tbsp</option>
            <option value="tsp">tsp</option>
            <option value="piece">piece</option>
        </select>
        <button type="button" class="delete-row bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">×</button>
    `;
    return row;
}

// Handle step rows
function createStepRow() {
    const row = document.createElement('div');
    row.className = 'flex gap-2 mb-2';
    row.innerHTML = `
        <textarea placeholder="Step description" class="flex-1 shadow border rounded py-2 px-3 text-gray-700" required></textarea>
        <input type="number" placeholder="Minutes" class="w-24 shadow border rounded py-2 px-3 text-gray-700" required>
        <button type="button" class="delete-row bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">×</button>
    `;
    return row;
}

// Handle image preview
function createImagePreview(file) {
    const reader = new FileReader();
    const preview = document.createElement('div');
    preview.className = 'relative';
    
    reader.onload = (e) => {
        preview.innerHTML = `
            <img src="${e.target.result}" class="w-full h-32 object-cover rounded">
            <input type="radio" name="main-image" class="absolute top-2 right-2">
            <button type="button" class="delete-image absolute top-2 left-2 bg-red-500 hover:bg-red-700 text-white rounded-full w-6 h-6">×</button>
        `;
    };
    reader.readAsDataURL(file);
    return preview;
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkChefAccess()) return;

    const form = document.getElementById('recipe-form');
    const ingredientsContainer = document.getElementById('ingredients-container');
    const stepsContainer = document.getElementById('steps-container');
    const imageUpload = document.getElementById('image-upload');
    const previewContainer = document.getElementById('preview-container');
    const imageUrl = document.getElementById('image-url');

    // Add initial rows
    ingredientsContainer.appendChild(createIngredientRow());
    stepsContainer.appendChild(createStepRow());

    // Add ingredient button
    document.getElementById('add-ingredient').addEventListener('click', () => {
        ingredientsContainer.appendChild(createIngredientRow());
    });

    // Add step button
    document.getElementById('add-step').addEventListener('click', () => {
        stepsContainer.appendChild(createStepRow());
    });

    // Delete row buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-row')) {
            const container = e.target.closest('div').parentElement;
            if (container.children.length > 1) {
                e.target.closest('div').remove();
            }
        }
    });

    // Handle image upload
    imageUpload.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            previewContainer.appendChild(createImagePreview(file));
        });
    });

    // Handle image URL
    imageUrl.addEventListener('change', (e) => {
        const preview = document.createElement('div');
        preview.className = 'relative';
        preview.innerHTML = `
            <img src="${e.target.value}" class="w-full h-32 object-cover rounded">
            <input type="radio" name="main-image" class="absolute top-2 right-2">
            <button type="button" class="delete-image absolute top-2 left-2 bg-red-500 hover:bg-red-700 text-white rounded-full w-6 h-6">×</button>
        `;
        previewContainer.appendChild(preview);
        e.target.value = '';
    });

    // Handle image deletion
    previewContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-image')) {
            e.target.closest('div').remove();
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = userService.getLoggedInUser();
        
        // Validate form
        const formData = {
            title: {
                en: document.getElementById('title-en').value,
                fr: document.getElementById('title-fr').value
            },
            ingredients: Array.from(ingredientsContainer.children).map(row => ({
                name: row.querySelector('input[type="text"]').value,
                quantity: parseFloat(row.querySelector('input[type="number"]').value),
                unit: row.querySelector('select').value
            })),
            steps: Array.from(stepsContainer.children).map(row => ({
                description: row.querySelector('textarea').value,
                time: parseInt(row.querySelector('input[type="number"]').value)
            })),
            dietary: {
                vegan: document.getElementById('vegan').checked,
                glutenFree: document.getElementById('gluten-free').checked
            },
            images: Array.from(previewContainer.children).map(div => ({
                url: div.querySelector('img').src,
                isMain: div.querySelector('input[type="radio"]').checked
            })),
            author: user.username,
            published: false,
            dateCreated: new Date().toISOString()
        };

        // Validate required fields
        if (!formData.images.some(img => img.isMain)) {
            alert('Please select a main image');
            return;
        }

        try {
            await recipeService.saveRecipe(formData);
            alert('Recipe saved successfully!');
            form.reset();
            previewContainer.innerHTML = '';
            ingredientsContainer.innerHTML = '';
            stepsContainer.innerHTML = '';
            ingredientsContainer.appendChild(createIngredientRow());
            stepsContainer.appendChild(createStepRow());
        } catch (error) {
            alert('Error saving recipe: ' + error.message);
        }
    });
});