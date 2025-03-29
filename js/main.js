import recipeService from './recipeService.js';
import userService from './userService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const recipesList = document.getElementById('recipes-list');
  const searchInput = document.getElementById('search');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const sortSelect = document.getElementById('sort-recipes');
  const languageToggle = document.getElementById('language-toggle');
  const navMenu = document.getElementById('nav-menu');
  const userInfo = document.getElementById('user-info');
  const logoutButton = document.getElementById('logout');

  let activeFilters = new Set();
  let currentSearch = '';
  let currentSort = 'name-asc';
  let language = localStorage.getItem('language') || 'en';
  let recipes = [];

  const createCard = (recipe) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-card p-4 hover:shadow-card-hover transition duration-200';
    const title = language === 'fr' && recipe.nameFR ? recipe.nameFR : recipe.name;
    card.innerHTML = `
      <h3 class="text-xl font-semibold">${title}</h3>
      <p class="text-sm text-gray-600">Author: ${recipe.author || recipe.Author || 'Unknown'}</p>
    `;
    return card;
  };

  const filterAndRender = () => {
    let filtered = [...recipes];

    if (currentSearch) {
      filtered = filtered.filter(r => {
        const name = r.name?.toLowerCase() || '';
        const nameFR = r.nameFR?.toLowerCase() || '';
        return name.includes(currentSearch.toLowerCase()) || nameFR.includes(currentSearch.toLowerCase());
      });
    }

    if (activeFilters.size > 0) {
      filtered = filtered.filter(r => {
        const dietary = r.dietary || {};
        if (activeFilters.has('gluten-free') && !dietary.glutenFree) return false;
        if (activeFilters.has('vegan') && !dietary.vegan) return false;
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

  languageToggle?.addEventListener('click', () => {
    language = language === 'en' ? 'fr' : 'en';
    localStorage.setItem('language', language);
    languageToggle.textContent = language === 'en' ? 'FR' : 'EN';
    filterAndRender();
  });

  logoutButton?.addEventListener('click', () => {
    userService.logoutUser();
    window.location.href = 'login.html';
  });

  window.addEventListener('userStateChanged', (e) => {
    const user = e.detail;
    if (!user) return (window.location.href = 'login.html');
    userInfo.textContent = user.username;
    navMenu.innerHTML = `
      <a href="index.html" class="text-white px-3 py-2">Home</a>
      ${userService.isAdmin(user.username) ? '<a href="admin.html" class="text-white px-3 py-2">Admin</a>' : ''}
      ${userService.isChef(user.username) ? '<a href="chef.html" class="text-white px-3 py-2">Submit Recipe</a>' : ''}
      ${userService.isTranslator(user.username) ? '<a href="translate.html" class="text-white px-3 py-2">Translate</a>' : ''}
    `;
  });

  const user = userService.getLoggedInUser();
  if (!user) {
    return (window.location.href = 'login.html');
  }
  userInfo.textContent = user.username;
  window.dispatchEvent(new CustomEvent('userStateChanged', { detail: user }));

  await recipeService.ensureRecipesLoaded();
  recipes = await recipeService.getAllRecipes();
  filterAndRender();
});
