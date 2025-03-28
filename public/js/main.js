import recipeService from './recipeService.js';
import userService from './userService.js';

console.log('main.js script loaded');

document.addEventListener('DOMContentLoaded', async () => {
    const recipesList = document.getElementById('recipes-list');
    if (!recipesList) {
        console.error('Element with id "recipes-list" not found.');
        return;
    }

    const searchInput = document.getElementById('search');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const messageDiv = document.getElementById('message');
    const sortSelect = document.getElementById('sort-recipes');
    const languageToggle = document.getElementById('language-toggle');
    const navMenu = document.getElementById('nav-menu');
    const userInfo = document.getElementById('user-info');
    const logoutButton = document.getElementById('logout');

    let activeFilters = new Set();
    let currentSearch = '';
    let currentSort = 'newest';
    let recipes = [];
    let language = localStorage.getItem('language') || 'en';

    const showMessage = (message, isError = true) => {
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
            if (isError) {
                messageDiv.classList.add('bg-red-100');
                messageDiv.classList.add('text-red-700');
            } else {
                messageDiv.classList.add('bg-green-100');
                messageDiv.classList.add('text-green-700');
            }
            messageDiv.classList.add('animate-fade-in');
            setTimeout(() => messageDiv.classList.add('hidden'), 3000);
        } else {
            console.error('Message element not found:', message);
        }
    };

    const createRecipeCard = (recipe) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 transform hover:-translate-y-1 overflow-hidden animate-fade-in';
        
        const recipeTitle = language === 'en' ? recipe.name : (recipe.nameFR || recipe.name);
        card.innerHTML = `
            <a href="recipe.html?id=${recipe._id}" class="block">
                <div class="relative">
                    <div class="aspect-w-16 aspect-h-9">
                        <img src="${recipe.images?.[0]?.url || 'https://via.placeholder.com/400x225'}" 
                             alt="${recipeTitle}" 
                             class="w-full h-full object-cover">
                    </div>
                    ${recipe.nameFR ? `
                        <div class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                            Translated
                        </div>
                    ` : ''}
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">${recipeTitle}</h3>
                    <p class="text-gray-600 mb-4">By ${recipe.author}</p>
                    <div class="flex flex-wrap gap-2">
                        ${recipe.dietary?.glutenFree ? 
                            '<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Gluten-Free</span>' : ''}
                        ${recipe.dietary?.vegan ? 
                            '<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Vegan</span>' : ''}
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span class="text-gray-500 text-sm">
                            ${new Date(recipe.createdAt).toLocaleDateString()}
                        </span>
                        <button class="text-primary-600 hover:text-primary-500 font-medium text-sm transition-colors duration-200">
                            View Recipe →
                        </button>
                    </div>
                </div>
            </a>
        `;
        return card;
    };

    const updateRecipeDisplay = () => {
        console.log('Recipes to display:', recipes); // Log the recipes being processed

        let filteredRecipes = [...recipes];

        // Apply search filter
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            filteredRecipes = filteredRecipes.filter(recipe => {
                const nameMatch = recipe.name.toLowerCase().includes(searchLower) ||
                                (recipe.nameFR || '').toLowerCase().includes(searchLower);
                const ingredientMatch = recipe.ingredients.some(i => 
                    i.name.toLowerCase().includes(searchLower));
                return nameMatch || ingredientMatch;
            });
        }

        // Apply dietary filters
        if (activeFilters.size > 0) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                if (activeFilters.has('gluten-free') && !recipe.dietary?.glutenFree) return false;
                if (activeFilters.has('vegan') && !recipe.dietary?.vegan) return false;
                if (activeFilters.has('translated') && !recipe.nameFR) return false;
                return true;
            });
        }

        // Apply sorting
        switch (currentSort) {
            case 'newest':
                filteredRecipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filteredRecipes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name-asc':
                filteredRecipes.sort((a, b) => {
                    const aName = language === 'en' ? a.name : (a.nameFR || a.name);
                    const bName = language === 'en' ? b.name : (b.nameFR || b.name);
                    return aName.localeCompare(bName);
                });
                break;
            case 'name-desc':
                filteredRecipes.sort((a, b) => {
                    const aName = language === 'en' ? a.name : (a.nameFR || a.name);
                    const bName = language === 'en' ? b.name : (b.nameFR || b.name);
                    return bName.localeCompare(aName);
                });
                break;
        }

        // Clear and update the recipes list
        while (recipesList.firstChild) {
            if (recipesList.firstChild.classList) {
                recipesList.firstChild.classList.add('animate-fade-out');
            }
            setTimeout(() => recipesList.removeChild(recipesList.firstChild), 200);
        }

        // Add new recipe cards with staggered animation
        filteredRecipes.forEach((recipe, index) => {
            setTimeout(() => {
                const card = createRecipeCard(recipe);
                if (card) {
                    recipesList.appendChild(card);
                }
            }, index * 100);
        });

        // Show message if no recipes found
        if (filteredRecipes.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'col-span-full text-center py-12 text-gray-500 animate-fade-in';
            noResults.innerHTML = `
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="mt-2 text-lg font-medium text-gray-900">No recipes found</h3>
                <p class="mt-1 text-gray-500">Try adjusting your search or filters</p>
            `;
            recipesList.appendChild(noResults);
        }
    };

    // Event Listeners
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value;
            updateRecipeDisplay();
        }, 300);
    });

    // Ensure filter buttons exist before adding event listeners
    filterButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                if (activeFilters.has(filter)) {
                    activeFilters.delete(filter);
                    btn.classList.remove('bg-primary-600', 'text-white');
                    btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
                } else {
                    activeFilters.add(filter);
                    btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
                    btn.classList.add('bg-primary-600', 'text-white');
                }
                updateRecipeDisplay();
            });
        }
    });

    // Ensure clear filters button exists before adding event listener
    clearFiltersBtn?.addEventListener('click', () => {
        activeFilters.clear();
        currentSearch = '';
        if (searchInput) searchInput.value = '';
        filterButtons.forEach(btn => {
            if (btn) {
                btn.classList.remove('bg-primary-600', 'text-white');
                btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
            }
        });
        updateRecipeDisplay();
    });

    sortSelect?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        updateRecipeDisplay();
    });

    languageToggle?.addEventListener('click', () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
        updateRecipeDisplay();
    });

    // Update navigation based on user role
    function updateNavigation() {
        const user = userService.getLoggedInUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Show user info
        userInfo.textContent = user.username;

        // Update navigation menu
        navMenu.innerHTML = `
            <a href="index.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</a>
            ${userService.isAdmin(user.username) ? 
                `<a href="admin.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Admin</a>` : ''}
            ${userService.isChef(user.username) ? 
                `<a href="chef.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Submit Recipe</a>` : ''}
            ${userService.isTranslator(user.username) ? 
                `<a href="translate.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Translate</a>` : ''}
        `;
    }

    // Handle logout
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        userService.logoutUser();
        window.location.href = 'login.html';
    });

    // Listen for user state changes
    window.addEventListener('userStateChanged', (e) => {
        if (!e.detail) {
            window.location.href = 'login.html';
        } else {
            updateNavigation();
        }
    });

    // Initialize navigation
    updateNavigation();

    // Initialize
    try {
        await recipeService.loadRecipes(); // Correctly call loadRecipes
        recipes = await recipeService.getAllRecipes(); // Update the recipes array
        updateRecipeDisplay(); // Display the recipes
    } catch (error) {
        console.error('Error initializing recipes:', error);
        showMessage('Failed to initialize recipes. Please try again later.', true);
    }
});