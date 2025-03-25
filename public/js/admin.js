import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const adminInterface = document.getElementById('admin-interface');
    const authError = document.getElementById('auth-error');
    const pendingRequestsContainer = document.getElementById('pending-requests');
    const userManagementContainer = document.getElementById('user-management');
    const usersTab = document.getElementById('users-tab');
    const recipesTab = document.getElementById('recipes-tab');
    const usersManagement = document.getElementById('users-management');
    const recipeValidation = document.getElementById('recipe-validation');
    const languageToggle = document.getElementById('language-toggle');
    const usersTable = document.getElementById('users-table');
    const recipesList = document.getElementById('recipes-list');

    let language = localStorage.getItem('language') || 'en';

    const toggleLanguage = () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
        loadUsers();
        loadRecipes();
    };

    const loadUsers = async () => {
        try {
            const response = await fetch('../data/users.json');
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const renderUsers = (users) => {
        usersTable.innerHTML = users.map(user => `
            <tr>
                <td class="border border-gray-300 px-4 py-2">${user.username}</td>
                <td class="border border-gray-300 px-4 py-2">${user.roles.join(', ')}</td>
                <td class="border border-gray-300 px-4 py-2">${user.requestedRole || 'None'}</td>
                <td class="border border-gray-300 px-4 py-2">
                    <button class="px-2 py-1 bg-green-500 text-white rounded">Promote</button>
                </td>
            </tr>
        `).join('');
    };

    const loadRecipes = async () => {
        try {
            const recipes = await recipeService.getAllRecipes();
            const unpublishedRecipes = recipes.filter(recipe => !recipe.published);
            renderRecipes(unpublishedRecipes);
        } catch (error) {
            console.error('Error loading recipes:', error);
            showMessage('Error loading recipes', true);
        }
    };

    const renderRecipes = (recipes) => {
        recipesList.innerHTML = recipes.map(recipe => {
            const name = language === 'en' ? recipe.name : recipe.nameFR;
            return `
                <div class="p-4 border rounded mb-4">
                    <h3 class="text-lg font-bold">${name || 'Untitled Recipe'}</h3>
                    <p>Author: ${recipe.author || 'Unknown'}</p>
                    <p>Status: ${recipe.published ? 'Published' : 'Unpublished'}</p>
                    <div class="flex gap-2 mt-2">
                        <button class="publish-recipe px-2 py-1 bg-green-500 text-white rounded" data-id="${recipe.id}">
                            ${recipe.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button class="edit-recipe px-2 py-1 bg-blue-500 text-white rounded" data-id="${recipe.id}">
                            Edit
                        </button>
                        <button class="delete-recipe px-2 py-1 bg-red-500 text-white rounded" data-id="${recipe.id}">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for recipe actions
        recipesList.addEventListener('click', async (e) => {
            const recipeId = e.target.dataset.id;
            if (!recipeId) return;

            if (e.target.classList.contains('publish-recipe')) {
                try {
                    const recipe = await recipeService.getRecipeById(recipeId);
                    await recipeService.updateRecipeStatus(recipeId, !recipe.published);
                    loadRecipes();
                    showMessage(`Recipe ${recipe.published ? 'unpublished' : 'published'} successfully`, false);
                } catch (error) {
                    showMessage('Error updating recipe status: ' + error.message);
                }
            } else if (e.target.classList.contains('edit-recipe')) {
                window.location.href = `recipe.html?id=${recipeId}`;
            } else if (e.target.classList.contains('delete-recipe')) {
                if (confirm('Are you sure you want to delete this recipe?')) {
                    try {
                        await recipeService.deleteRecipe(recipeId);
                        loadRecipes();
                        showMessage('Recipe deleted successfully', false);
                    } catch (error) {
                        showMessage('Error deleting recipe: ' + error.message);
                    }
                }
            }
        });
    };

    usersTab.addEventListener('click', () => {
        usersManagement.classList.remove('hidden');
        recipeValidation.classList.add('hidden');
    });

    recipesTab.addEventListener('click', () => {
        recipeValidation.classList.remove('hidden');
        usersManagement.classList.add('hidden');
    });

    languageToggle.addEventListener('click', toggleLanguage);

    loadUsers();
    loadRecipes();

    // Check admin access
    function checkAdminAccess() {
        const user = userService.getLoggedInUser();
        if (!user || !userService.isAdmin(user.username)) {
            authError.classList.remove('hidden');
            adminInterface.classList.add('hidden');
            return false;
        }
        return true;
    }

    // Display pending role requests
    async function displayPendingRequests() {
        const users = await userService.loadUsers();
        const pendingUsers = users.filter(user => user.requestedRole);

        pendingRequestsContainer.innerHTML = pendingUsers.length === 0 
            ? '<p class="text-gray-500">No pending requests</p>'
            : pendingUsers.map(user => `
                <div class="bg-white p-4 rounded-lg shadow mb-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-bold">${user.username}</h3>
                            <p class="text-sm text-gray-600">Requested: ${user.requestedRole.join(', ')}</p>
                        </div>
                        <div class="space-x-2">
                            <button class="approve-request bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                    data-username="${user.username}"
                                    data-role="${user.requestedRole}">
                                Approve
                            </button>
                            <button class="deny-request bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                    data-username="${user.username}">
                                Deny
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
    }

    // Display all users for management
    async function displayUsers() {
        const users = await userService.loadUsers();
        userManagementContainer.innerHTML = users.map(user => `
            <div class="bg-white p-4 rounded-lg shadow mb-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold">${user.username}</h3>
                        <p class="text-sm text-gray-600">Roles: ${user.roles.join(', ') || 'None'}</p>
                    </div>
                    <div class="space-x-2">
                        ${!user.roles.includes('Chef') ? `
                            <button class="add-role bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    data-username="${user.username}"
                                    data-role="Chef">
                                Add Chef
                            </button>
                        ` : ''}
                        ${!user.roles.includes('Traducteur') ? `
                            <button class="add-role bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    data-username="${user.username}"
                                    data-role="Traducteur">
                                Add Translator
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Handle role request approval
    async function handleApproveRequest(username, role) {
        try {
            await userService.promoteUser(username, role);
            displayPendingRequests();
            displayUsers();
            showMessage('User role updated successfully', false);
        } catch (error) {
            showMessage('Error updating user role: ' + error.message);
        }
    }

    // Handle role request denial
    async function handleDenyRequest(username) {
        try {
            const user = await userService.getUserByUsername(username);
            user.requestedRole = null;
            displayPendingRequests();
            showMessage('Request denied successfully', false);
        } catch (error) {
            showMessage('Error denying request: ' + error.message);
        }
    }

    // Show message helper
    function showMessage(message, isError = true) {
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.classList.toggle('bg-red-100', isError);
            messageDiv.classList.toggle('text-red-700', isError);
            messageDiv.classList.toggle('bg-green-100', !isError);
            messageDiv.classList.toggle('text-green-700', !isError);
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 3000);
        }
    }

    // Initialize admin interface
    if (checkAdminAccess()) {
        // Display initial data
        await displayPendingRequests();
        await displayUsers();
        loadRecipes();

        // Event listeners for pending requests
        pendingRequestsContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('approve-request')) {
                const { username, role } = e.target.dataset;
                await handleApproveRequest(username, role);
            } else if (e.target.classList.contains('deny-request')) {
                const { username } = e.target.dataset;
                await handleDenyRequest(username);
            }
        });

        // Event listeners for user management
        userManagementContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('add-role')) {
                const { username, role } = e.target.dataset;
                await handleApproveRequest(username, role);
            }
        });
    }
});