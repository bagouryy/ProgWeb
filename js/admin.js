import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = userService.getLoggedInUser();
  if (!user || !userService.isAdmin(user.username)) {
    document.body.innerHTML = `<div class="text-center text-red-700 font-bold mt-10">Access denied. Admin only.</div>`;
    return;
  }

  const languageToggle = document.getElementById('language-toggle');
  const userInfo = document.getElementById('user-info');
  const logoutButton = document.getElementById('logout');
  const navMenu = document.getElementById('nav-menu');

  const lang = localStorage.getItem('language') || 'en';
  const t = (en, fr) => lang === 'fr' ? fr : en;

  const applyTranslations = () => {
    document.getElementById('admin-title').textContent = t('Admin Dashboard', 'Tableau de bord administrateur');
    document.getElementById('users-tab').textContent = t('User Management', 'Gestion des utilisateurs');
    document.getElementById('recipes-tab').textContent = t('Recipe Validation', 'Validation des recettes');
    document.getElementById('pending-title').textContent = t('Pending Role Requests', 'Demandes de rôles en attente');
    document.getElementById('user-list-title').textContent = t('All Users', 'Tous les utilisateurs');
    document.getElementById('recipe-validation-title').textContent = t('Pending Recipes', 'Recettes en attente');
    languageToggle.textContent = lang === 'en' ? 'FR' : 'EN';
  };

  const updateNav = () => {
    userInfo.textContent = user.username;
    navMenu.innerHTML = `
      <a href="index.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Home', 'Accueil')}</a>
      <a href="admin.html" class="text-white px-3 py-2 rounded-md text-sm font-medium bg-blue-900">${t('Admin', 'Admin')}</a>
      ${userService.isChef(user.username) ? `<a href="chef.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Submit Recipe', 'Soumettre Recette')}</a>` : ''}
      ${userService.isTranslator(user.username) ? `<a href="translate.html" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">${t('Translate', 'Traduire')}</a>` : ''}
    `;
  };

  languageToggle.addEventListener('click', () => {
    const next = lang === 'en' ? 'fr' : 'en';
    localStorage.setItem('language', next);
    location.reload();
  });

  logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    userService.logoutUser();
    window.location.href = 'login.html';
  });

  applyTranslations();
  updateNav();

  const usersTab = document.getElementById('users-tab');
  const recipesTab = document.getElementById('recipes-tab');
  const usersSection = document.getElementById('users-management');
  const recipesSection = document.getElementById('recipe-validation');

  usersTab.onclick = () => {
    usersTab.classList.add('border-blue-500', 'text-blue-600');
    recipesTab.classList.remove('border-blue-500', 'text-blue-600');
    usersSection.classList.remove('hidden');
    recipesSection.classList.add('hidden');
  };

  recipesTab.onclick = () => {
    recipesTab.classList.add('border-blue-500', 'text-blue-600');
    usersTab.classList.remove('border-blue-500', 'text-blue-600');
    recipesSection.classList.remove('hidden');
    usersSection.classList.add('hidden');
    loadPendingRecipes();
  };

  async function loadPendingUsers() {
    await userService.ensureUsersLoaded();
    const users = userService.users.filter(u => !u.localOnly);
    const pendingDiv = document.getElementById('pending-requests');
    pendingDiv.innerHTML = '';

    users.filter(u => u.requestedRoles?.length).forEach(user => {
      const container = document.createElement('div');
      container.className = 'bg-white p-4 rounded shadow-card flex justify-between items-center';
      container.innerHTML = `
        <div>
          <p class="font-semibold text-gray-800">${user.username}</p>
          <p class="text-sm text-gray-500">${t('Requested', 'Demandé')}: ${user.requestedRoles.join(', ')}</p>
        </div>
        <div class="flex gap-2">
          ${user.requestedRoles.map(role => `
            <button class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded" data-role="${role}" data-user="${user.username}">
              ${t('Approve', 'Approuver')} ${role}
            </button>`).join('')}
        </div>`;
      pendingDiv.appendChild(container);
    });

    document.querySelectorAll('[data-role]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const username = btn.getAttribute('data-user');
        const role = btn.getAttribute('data-role');
        await userService.promoteUser(username, role);
        await loadPendingUsers();
      });
    });
  }

  async function loadPendingRecipes() {
    const recipes = await recipeService.getAllRecipes();
    const list = document.getElementById('recipes-list');
    list.innerHTML = '';

    recipes.filter(r => !r.published).forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl p-4 shadow-card';
      card.innerHTML = `
        <h3 class="text-lg font-bold text-gray-900 mb-2">${recipe.name || 'Untitled'}</h3>
        <p class="text-sm text-gray-500 mb-2">${t('Author', 'Auteur')}: ${recipe.author || recipe.Author || 'N/A'}</p>
        <button class="mt-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded" data-id="${recipe.id}">${t('Mark as Published', 'Marquer comme publié')}</button>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await recipeService.updateRecipeStatus(id, true);
        loadPendingRecipes();
      });
    });
  }

  await loadPendingUsers();
});
