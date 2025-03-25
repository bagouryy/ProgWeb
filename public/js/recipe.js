import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const recipeContainer = document.getElementById('recipe-container');
    const editButton = document.getElementById('edit-recipe');
    const deleteButton = document.getElementById('delete-recipe');
    const publishButton = document.getElementById('publish-recipe');
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const languageToggle = document.getElementById('language-toggle');

    let currentRecipe = null;
    let language = localStorage.getItem('language') || 'en';
    const comments = JSON.parse(localStorage.getItem('comments') || '{}');

    // Get recipe ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    // Load and display recipe
    async function loadRecipe() {
        try {
            currentRecipe = await recipeService.getRecipeById(recipeId);
            if (!currentRecipe) {
                recipeContainer.innerHTML = '<p class="text-red-500">Recipe not found</p>';
                return;
            }

            displayRecipe();
            updateActionButtons();
            displayComments();
        } catch (error) {
            console.error('Error loading recipe:', error);
            recipeContainer.innerHTML = '<p class="text-red-500">Error loading recipe</p>';
        }
    }

    // Display recipe content
    function displayRecipe() {
        const name = language === 'en' ? currentRecipe.name : currentRecipe.nameFR;
        const ingredients = language === 'en' ? currentRecipe.ingredients : currentRecipe.ingredientsFR;
        const steps = language === 'en' ? currentRecipe.steps : currentRecipe.stepsFR;

        if (!name || !ingredients || !steps) {
            recipeContainer.innerHTML = '<p class="text-yellow-500">This recipe is not available in the selected language</p>';
            return;
        }

        recipeContainer.innerHTML = `
            <h1 class="text-3xl font-bold mb-6">${name}</h1>
            
            <img src="${currentRecipe.images?.[0]?.url || currentRecipe.imageURL}" alt="${name}" 
                 class="w-full max-w-2xl rounded-lg shadow-lg mb-6">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 class="text-xl font-bold mb-4">Ingredients</h2>
                    <ul class="list-disc list-inside space-y-2">
                        ${ingredients.map(ing => 
                            `<li>${ing.quantity} ${ing.unit || ''} ${ing.name}</li>`
                        ).join('')}
                    </ul>
                </div>

                <div>
                    <h2 class="text-xl font-bold mb-4">Steps</h2>
                    <ol class="list-decimal list-inside space-y-4">
                        ${steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>

            <div class="mt-6 flex gap-2">
                ${currentRecipe.dietary?.vegan ? 
                    '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Vegan</span>' : ''}
                ${currentRecipe.dietary?.glutenFree ? 
                    '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Gluten-Free</span>' : ''}
            </div>
        `;
    }

    // Update action buttons based on user role
    function updateActionButtons() {
        const user = userService.getLoggedInUser();
        if (!user) return;

        // Only show edit button to admins and the recipe's author
        if (userService.isAdmin(user.username) || currentRecipe.author === user.username) {
            editButton.classList.remove('hidden');
        } else {
            editButton.classList.add('hidden');
        }

        // Only show delete and publish buttons to admins
        if (userService.isAdmin(user.username)) {
            deleteButton.classList.remove('hidden');
            publishButton.classList.remove('hidden');
            publishButton.textContent = currentRecipe.published ? 'Unpublish' : 'Publish';
        } else {
            deleteButton.classList.add('hidden');
            publishButton.classList.add('hidden');
        }
    }

    // Handle comments
    function saveComment(text, image = null) {
        if (!comments[recipeId]) {
            comments[recipeId] = [];
        }
        
        const user = userService.getLoggedInUser();
        comments[recipeId].push({
            author: user.username,
            text,
            image,
            date: new Date().toISOString()
        });
        
        localStorage.setItem('comments', JSON.stringify(comments));
    }

    function displayComments() {
        const recipeComments = comments[recipeId] || [];
        commentsList.innerHTML = recipeComments.map(comment => `
            <div class="p-4 border rounded mb-4">
                <div class="flex justify-between mb-2">
                    <strong>${comment.author}</strong>
                    <span class="text-gray-500">${new Date(comment.date).toLocaleDateString()}</span>
                </div>
                <p>${comment.text}</p>
                ${comment.image ? `
                    <img src="${comment.image}" alt="Comment image" class="mt-2 max-w-xs rounded">
                ` : ''}
            </div>
        `).join('');
    }

    // Event handlers
    editButton.addEventListener('click', () => {
        window.location.href = `chef.html?edit=${recipeId}`;
    });

    deleteButton.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this recipe?')) return;
        
        try {
            await recipeService.deleteRecipe(recipeId);
            alert('Recipe deleted successfully');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Error deleting recipe: ' + error.message);
        }
    });

    publishButton.addEventListener('click', async () => {
        try {
            const newStatus = !currentRecipe.published;
            await recipeService.updateRecipeStatus(recipeId, newStatus);
            currentRecipe.published = newStatus;
            publishButton.textContent = newStatus ? 'Unpublish' : 'Publish';
            alert(`Recipe ${newStatus ? 'published' : 'unpublished'} successfully`);
        } catch (error) {
            alert('Error updating recipe status: ' + error.message);
        }
    });

    languageToggle.addEventListener('click', () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
        displayRecipe();
    });

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('comment-text').value;
        const imageFile = document.getElementById('comment-image').files[0];
        
        let imageUrl = null;
        if (imageFile) {
            // Convert image to data URL
            const reader = new FileReader();
            imageUrl = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(imageFile);
            });
        }

        saveComment(text, imageUrl);
        displayComments();
        commentForm.reset();
    });

    // Initialize
    if (recipeId) {
        loadRecipe();
    } else {
        recipeContainer.innerHTML = '<p class="text-red-500">No recipe ID provided</p>';
    }
});