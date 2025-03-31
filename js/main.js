import recipeService from './recipeService.js';
import userService from './userService.js';
import Navigation from './navigation.js';

document.addEventListener('DOMContentLoaded', async () => {
  const recipesList = document.getElementById('recipes-list');
  const searchInput = document.getElementById('search');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const sortSelect = document.getElementById('sort-recipes');

  let activeFilters = new Set();
  let currentSearch = '';
  let currentSort = 'name-asc';
  let language = localStorage.getItem('language') || 'en';
  let recipes = [];

  const createCard = (recipe) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-card p-4 hover:shadow-card-hover transition duration-200 cursor-pointer';

    const title = language === 'fr' && recipe.nameFR ? recipe.nameFR : recipe.name;

    const image = recipe.imageURL
      ? `<img src="${recipe.imageURL}" alt="${title}" class="w-full h-48 object-cover rounded-t-xl">`
      : '';

    card.innerHTML = `
      ${image}
      <h3 class="text-xl font-semibold mt-4">${title}</h3>
      <p class="text-sm text-gray-600">Author: ${recipe.author || recipe.Author || 'Unknown'}</p>
    `;

    card.addEventListener('click', () => {
      showRecipeModal(recipe);
    });

    return card;
  };

  const showRecipeModal = (recipe) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full';

    const title = language === 'fr' && recipe.nameFR ? recipe.nameFR : recipe.name;

    const image = recipe.imageURL
      ? `<img src="${recipe.imageURL}" alt="${title}" class="w-full h-64 object-cover rounded-lg mb-4">`
      : '';

    const ingredients = recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name} (${ing.type})</li>`).join('');
    const steps = recipe.steps.map((step) => `<li> ${step}</li>`).join('');

    modalContent.innerHTML = `
      ${image}
      <h2 class="text-2xl font-bold mb-4">${title}</h2>
      <p class="text-sm text-gray-600 mb-4">Author: ${recipe.author || recipe.Author || 'Unknown'}</p>
      <h3 class="text-lg font-semibold mb-2">Ingredients:</h3>
      <ul class="list-disc list-inside mb-4">${ingredients}</ul>
      <h3 class="text-lg font-semibold mb-2">Steps:</h3>
      <ol class="list-decimal list-inside">${steps}</ol>
      <button id="close-modal" class="mt-4 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded">Close</button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById('close-modal').addEventListener('click', () => {
      modal.remove();
    });
  };

  const filterAndRender = () => {
    let filtered = recipes.filter(r => r.published); // Only include published recipes

    if (currentSearch) {
      filtered = filtered.filter(r => {
        const name = r.name?.toLowerCase() || '';
        const nameFR = r.nameFR?.toLowerCase() || '';
        return name.includes(currentSearch.toLowerCase()) || nameFR.includes(currentSearch.toLowerCase());
      });
    }

    if (activeFilters.size > 0) {
      filtered = filtered.filter(r => {
        const without = r.Without || [];
        if (activeFilters.has('gluten-free') && !without.includes('NoGluten')) return false;
        if (activeFilters.has('vegan') && !without.includes('Vegan')) return false;
        if (activeFilters.has('translated') && !r.nameFR) return false;
        return true;
      });
    }

    switch (currentSort) {
      case 'name-asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
    }

    recipesList.innerHTML = '';
    filtered.forEach(r => recipesList.appendChild(createCard(r)));
  };

  searchInput?.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    filterAndRender();
  });

  filterButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
        btn.classList.remove('bg-primary-600', 'text-white');
      } else {
        activeFilters.add(filter);
        btn.classList.add('bg-primary-600', 'text-white');
      }
      filterAndRender();
    });
  });

  clearFiltersBtn?.addEventListener('click', () => {
    activeFilters.clear();
    currentSearch = '';
    searchInput.value = '';
    filterButtons.forEach(btn => btn.classList.remove('bg-primary-600', 'text-white'));
    filterAndRender();
  });

  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndRender();
  });

  // Initialize navigation
  Navigation.init('nav-menu', 'user-info', 'logout', 'language-toggle');

  await userService.loadUsers();
  const user = userService.getLoggedInUser();
  if (!user) {
    return (window.location.href = 'login.html');
  }
  window.dispatchEvent(new CustomEvent('userStateChanged', { detail: user }));

  await recipeService.ensureRecipesLoaded();
  recipes = await recipeService.getAllRecipes();
  filterAndRender();
});
