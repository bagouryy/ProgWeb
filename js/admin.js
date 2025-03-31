import userService from './userService.js';
import recipeService from './recipeService.js';
import Navigation from './navigation.js';

document.addEventListener('DOMContentLoaded', async () => {
  await userService.loadUsers();
  const user = userService.getLoggedInUser();
  if (!user || !userService.isAdmin(user.username)) {
    document.body.innerHTML = `<div class="text-center text-red-700 font-bold mt-10">Access denied. Admin only.</div>`;
    return;
  }

  Navigation.init('nav-menu', 'user-info', 'logout', 'language-toggle');

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
    const users = userService.users;
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
        btn.disabled = true;
        btn.textContent = 'Approving...';
        await userService.promoteUser(username, role);
        await loadPendingUsers();
      });
    });
  }

  async function loadAllUsers() {
    await userService.ensureUsersLoaded();
    const allDiv = document.getElementById('all-users-list');
    allDiv.innerHTML = '';
  
    const roles = ['Admin', 'Chef', 'Traducteur'];
  
    userService.users.forEach(user => {
      const container = document.createElement('div');
      container.className = 'bg-white p-4 rounded shadow-card flex justify-between items-center';
  
      const roleCheckboxes = roles.map(role => `
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" class="role-toggle" data-user="${user.username}" data-role="${role}" ${user.roles.includes(role) ? 'checked' : ''}>
          ${role}
        </label>
      `).join(' ');
  
      container.innerHTML = `
        <div>
          <p class="font-semibold text-gray-800">${user.username}</p>
          <p class="text-sm text-gray-500">Roles:</p>
          <div class="flex gap-4 mt-1">
            ${roleCheckboxes}
          </div>
        </div>
        <button class="save-user bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded" data-user="${user.username}">
          Save
        </button>
      `;
  
      allDiv.appendChild(container);
    });
  
    document.querySelectorAll('.save-user').forEach(button => {
      button.addEventListener('click', async () => {
        const username = button.getAttribute('data-user');
        const checkboxes = document.querySelectorAll(`.role-toggle[data-user="${username}"]`);
        const user = await userService.getUserByUsername(username);
  
        if (!user) return;
  
        // Get checked roles
        const newRoles = Array.from(checkboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.getAttribute('data-role'));
  
        user.roles = newRoles;
        user.requestedRoles = user.requestedRoles?.filter(r => !newRoles.includes(r));
  
        // Save to backend
        button.disabled = true;
        button.textContent = 'Saving...';
        try {
          await userService.updateUser(user);
          button.textContent = 'Saved';
          setTimeout(() => {
            button.textContent = 'Save';
            button.disabled = false;
          }, 1500);
        } catch (err) {
          console.error('Failed to save user:', err);
          button.textContent = 'Error';
          setTimeout(() => {
            button.textContent = 'Save';
            button.disabled = false;
          }, 2000);
        }
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
        <p class="text-sm text-gray-500 mb-2">Author: ${recipe.author || recipe.Author || 'N/A'}</p>
        <button class="mt-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded publish-btn" data-name="${recipe.name}">
          Mark as Published
        </button>
      `;
      list.appendChild(card);
    });
    

    list.querySelectorAll('.publish-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.getAttribute('data-name');
        btn.disabled = true;
        btn.textContent = 'Publishing...';
    
        try {
          const success = await recipeService.updateRecipeStatus(name, true);
          if (success) {
            btn.textContent = 'Published ✅';
            setTimeout(() => loadPendingRecipes(), 1500); // refresh list
          } else {
            btn.textContent = 'Not Found ❌';
          }
        } catch (err) {
          console.error('Publish error:', err);
          btn.textContent = 'Error ⚠️';
        }
      });
    });
  }

  await loadPendingUsers();
  await loadAllUsers(); 
  
});


