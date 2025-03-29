import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = userService.getLoggedInUser();
  if (!user || !user.roles.includes('Admin')) {
    document.getElementById('admin-interface').classList.add('hidden');
    document.getElementById('auth-error').classList.remove('hidden');
    return;
  }

  const usersTab = document.getElementById('users-tab');
  const recipesTab = document.getElementById('recipes-tab');
  const usersSection = document.getElementById('users-management');
  const recipesSection = document.getElementById('recipe-validation');

  usersTab.onclick = () => {
    usersTab.classList.add('border-primary-500', 'text-primary-600');
    recipesTab.classList.remove('border-primary-500', 'text-primary-600');
    usersSection.classList.remove('hidden');
    recipesSection.classList.add('hidden');
  };

  recipesTab.onclick = () => {
    recipesTab.classList.add('border-primary-500', 'text-primary-600');
    usersTab.classList.remove('border-primary-500', 'text-primary-600');
    recipesSection.classList.remove('hidden');
    usersSection.classList.add('hidden');
    loadPendingRecipes();
  };

  async function loadPendingUsers() {
    const users = await userService.users;
    const pendingDiv = document.getElementById('pending-requests');
    pendingDiv.innerHTML = '';

    users.filter(u => u.requestedRoles?.length).forEach(user => {
      const container = document.createElement('div');
      container.className = 'bg-white p-4 rounded shadow-card flex justify-between items-center';
      container.innerHTML = `
        <div>
          <p class="font-semibold text-gray-800">${user.username}</p>
          <p class="text-sm text-gray-500">Requested: ${user.requestedRoles.join(', ')}</p>
        </div>
        <div class="flex gap-2">
          ${user.requestedRoles.map(role => `
            <button class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded" data-role="${role}" data-user="${user.username}">
              Approve ${role}
            </button>`).join('')}
        </div>`;

      pendingDiv.appendChild(container);
    });

    document.querySelectorAll('[data-role]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const username = btn.getAttribute('data-user');
        const role = btn.getAttribute('data-role');
        await userService.promoteUser(username, role);
        loadPendingUsers();
      });
    });
  }

  async function loadPendingRecipes() {
    const recipes = await recipeService.getAllRecipes();
    const list = document.getElementById('recipes-list');
    list.innerHTML = '';

    recipes.filter(r => !r.published).forEach(recipe => {
      const missingFields = Object.values(recipe).filter(v => v === null || v === '' || v === undefined).length;
      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl p-4 shadow-card';
      card.innerHTML = `
        <h3 class="text-lg font-bold text-gray-900 mb-2">${recipe.name || 'Untitled'}</h3>
        <p class="text-sm text-gray-500 mb-2">Author: ${recipe.author}</p>
        <p class="text-sm text-red-500">Missing Fields: ${missingFields}</p>
        <button class="mt-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded" data-id="${recipe.id}">Mark as Published</button>
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
