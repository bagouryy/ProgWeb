import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', () => {
    const recipeGrid = document.getElementById('recipe-grid');
    const searchBar = document.getElementById('search-bar');
    const filterGlutenFree = document.getElementById('filter-gluten-free');
    const filterVegan = document.getElementById('filter-vegan');
    const filterPublished = document.getElementById('filter-published');
    const languageToggle = document.getElementById('language-toggle');
    const navMenu = document.getElementById('nav-menu');
    const userInfo = document.getElementById('user-info');
    const logoutButton = document.getElementById('logout');

    let recipes = [];
    let language = localStorage.getItem('language') || 'en';

    const loadRecipes = async () => {
        try {
            recipes = await recipeService.getAllRecipes();
            renderRecipes();
        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    };

    const renderRecipes = () => {
        recipeGrid.innerHTML = '';
        const filteredRecipes = recipes.filter(recipe => {
            if (filterGlutenFree.checked && !recipe.dietary?.glutenFree) return false;
            if (filterVegan.checked && !recipe.dietary?.vegan) return false;
            if (filterPublished.checked && !recipe.published) return false;
            
            const searchName = language === 'en' ? recipe.name : recipe.nameFR;
            if (searchBar.value && !searchName?.toLowerCase().includes(searchBar.value.toLowerCase())) return false;
            return true;
        });

        filteredRecipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded shadow cursor-pointer';
            const name = language === 'en' ? recipe.name : recipe.nameFR;
            const mainImage = recipe.images?.find(img => img.isMain)?.url || recipe.imageURL || 'https://via.placeholder.com/150';
            
            card.innerHTML = `
                <img src="${mainImage}" alt="${name}" class="w-full h-32 object-cover rounded mb-2">
                <h2 class="text-lg font-bold">${name}</h2>
                <p>${recipe.author || 'Unknown author'}</p>
                ${recipe.dietary?.vegan ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Vegan</span>' : ''}
                ${recipe.dietary?.glutenFree ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm ml-1">Gluten-Free</span>' : ''}
            `;
            
            card.addEventListener('click', () => {
                window.location.href = `recipe.html?id=${recipe.id}`;
            });
            
            recipeGrid.appendChild(card);
        });
    };

    const toggleLanguage = () => {
        language = language === 'en' ? 'fr' : 'en';
        localStorage.setItem('language', language);
        languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
        renderRecipes();
    };

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

    searchBar.addEventListener('input', renderRecipes);
    filterGlutenFree.addEventListener('change', renderRecipes);
    filterVegan.addEventListener('change', renderRecipes);
    filterPublished.addEventListener('change', renderRecipes);
    languageToggle.addEventListener('click', toggleLanguage);

    loadRecipes();
});