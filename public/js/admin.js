import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authError = document.getElementById('auth-error');
    const adminInterface = document.getElementById('admin-interface');
    const usersTab = document.getElementById('users-tab');
    const recipesTab = document.getElementById('recipes-tab');
    const usersManagement = document.getElementById('users-management');
    const recipeValidation = document.getElementById('recipe-validation');
    const pendingRequests = document.getElementById('pending-requests');
    const userManagement = document.getElementById('user-management');
    const recipesList = document.getElementById('recipes-list');
    const messageDiv = document.getElementById('message');
    const languageToggle = document.getElementById('language-toggle');

    let language = localStorage.getItem('language') || 'en';

    // Check admin access
    const user = userService.getLoggedInUser();
    if (!user || !user.roles.includes('Admin')) {
        authError.classList.remove('hidden');
        adminInterface.classList.add('hidden');
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

    const switchTab = (showUsers = true) => {
        // Update tab styling
        usersTab.classList.toggle('border-primary-500', showUsers);
        usersTab.classList.toggle('text-primary-600', showUsers);
        usersTab.classList.toggle('border-transparent', !showUsers);
        usersTab.classList.toggle('text-gray-500', !showUsers);

        recipesTab.classList.toggle('border-primary-500', !showUsers);
        recipesTab.classList.toggle('text-primary-600', !showUsers);
        recipesTab.classList.toggle('border-transparent', showUsers);
        recipesTab.classList.toggle('text-gray-500', showUsers);

        // Show/hide content
        usersManagement.classList.toggle('hidden', !showUsers);
        recipeValidation.classList.toggle('hidden', showUsers);
    };

    const loadPendingRequests = async () => {
        const requests = await userService.getPendingRoleRequests();
        pendingRequests.innerHTML = requests.length ? requests.map(request => `
            <div class="bg-white rounded-xl shadow-card p-6 animate-fade-in">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${request.username}</h3>
                        <p class="text-gray-600">Requesting: ${request.roles.join(', ')}</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="handleRoleRequest('${request.username}', ${JSON.stringify(request.roles)}, true)"
                                class="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            Approve
                        </button>
                        <button onclick="handleRoleRequest('${request.username}', ${JSON.stringify(request.roles)}, false)"
                                class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            Deny
                        </button>
                    </div>
                </div>
            </div>
        `).join('') : `
            <div class="text-center py-12 bg-white rounded-xl shadow-card">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                <p class="text-gray-500">All role requests have been processed</p>
            </div>
        `;
    };

    const loadUserManagement = async () => {
        const users = await userService.getAllUsers();
        userManagement.innerHTML = `
            <table class="min-w-full">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${users.map(user => `
                        <tr class="hover:bg-gray-50 transition-colors duration-200">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                ${user.username}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div class="flex flex-wrap gap-2">
                                    ${user.roles.map(role => `
                                        <span class="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                                            ${role}
                                        </span>
                                    `).join('')}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button onclick="handleRemoveRole('${user.username}')"
                                        class="text-red-600 hover:text-red-900 transition-colors duration-200">
                                    Remove Roles
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    };

    const loadPendingRecipes = async () => {
        const recipes = await recipeService.getPendingRecipes();
        recipesList.innerHTML = recipes.length ? recipes.map(recipe => `
            <div class="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-200">
                <img src="${recipe.images?.[0]?.url || recipe.imageURL || 'placeholder.jpg'}" 
                     alt="${recipe.name}" 
                     class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${recipe.name}</h3>
                    <p class="text-gray-600 mb-4">By ${recipe.author}</p>
                    <div class="flex justify-between items-center">
                        <button onclick="handleRecipeValidation('${recipe.id}', true)"
                                class="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            Approve
                        </button>
                        <button onclick="handleRecipeValidation('${recipe.id}', false)"
                                class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            Deny
                        </button>
                    </div>
                </div>
            </div>
        `).join('') : `
            <div class="col-span-full text-center py-12 bg-white rounded-xl shadow-card">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Pending Recipes</h3>
                <p class="text-gray-500">All recipes have been reviewed</p>
            </div>
        `;
    };

    // Handle role requests
    window.handleRoleRequest = async (username, roles, approved) => {
        try {
            await userService.handleRoleRequest(username, roles, approved);
            showMessage(`Role request ${approved ? 'approved' : 'denied'} successfully`, false);
            loadPendingRequests();
            loadUserManagement();
        } catch (error) {
            showMessage(error.message);
        }
    };

    // Handle role removal
    window.handleRemoveRole = async (username) => {
        if (!confirm(`Are you sure you want to remove all roles from ${username}?`)) return;
        
        try {
            await userService.removeUserRoles(username);
            showMessage('Roles removed successfully', false);
            loadUserManagement();
        } catch (error) {
            showMessage(error.message);
        }
    };

    // Handle recipe validation
    window.handleRecipeValidation = async (recipeId, approved) => {
        try {
            await recipeService.validateRecipe(recipeId, approved);
            showMessage(`Recipe ${approved ? 'approved' : 'denied'} successfully`, false);
            loadPendingRecipes();
        } catch (error) {
            showMessage(error.message);
        }
    };

    // Event listeners
    usersTab.addEventListener('click', () => switchTab(true));
    recipesTab.addEventListener('click', () => switchTab(false));
    
    languageToggle.addEventListener('click', () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
        loadPendingRecipes(); // Reload to update recipe names
    });

    // Initialize
    await Promise.all([
        loadPendingRequests(),
        loadUserManagement(),
        loadPendingRecipes()
    ]);
});