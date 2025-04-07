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

  Navigation.init('nav-menu', 'user-info', 'logout', 'language-toggle');

  await userService.loadUsers();
  const user = await userService.getLoggedInUser();
  if (!user) return (window.location.href = 'login.html');
  window.dispatchEvent(new CustomEvent('userStateChanged', { detail: user }));

  await recipeService.ensureRecipesLoaded();
  recipes = await recipeService.getAllRecipes();
  const fullUser = await userService.getUserByUsername(user.username);
  recipes.forEach(recipe => {
    recipe.liked = fullUser?.likedPosts?.includes(recipe.id);
  });

  const createCard = (recipe) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-card p-4 hover:shadow-card-hover transition duration-200 relative';

    const title = language === 'fr' && recipe.nameFR ? recipe.nameFR : recipe.name;
    const image = `
  <img 
    src="${recipe.imageURL || '/data/no-image.jpg'}" 
    alt="${title}" 
    class="w-full h-48 object-cover rounded-t-xl" 
    onerror="this.onerror=null; this.src='/data/no-image.jpg'; this.classList.add('bg-gray-100');"
/>
`;
      card.innerHTML = `
      ${image}
      <h3 class="text-xl font-semibold mt-4">${title}</h3>
      <p class="text-sm text-gray-600">Author: ${recipe.author || recipe.Author || 'Unknown'}</p>
      <p class="text-sm text-gray-600">Comments: <span class="comments-count">${recipe.comments?.length || 0}</span></p>
    
      <div class="absolute bottom-4 right-4 flex items-center gap-1">
        <button class="like-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="${recipe.liked ? 'red' : 'none'}" stroke="${recipe.liked ? 'red' : 'currentColor'}" viewBox="0 0 24 24" stroke-width="2" class="w-6 h-6 transition duration-200">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4c1.74 0 3.41 1.01 4.5 2.09C12.09 5.01 13.76 4 15.5 4 17.99 4 20 6.01 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <span class="likes-count font-bold text-sm">${recipe.likes || 0}</span>
      </div>
    `;
    

    const likeButton = card.querySelector('.like-btn');
    likeButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const response = await userService.toggleLike(user.username, recipe.id);
        recipe.likes = response.recipe.likes;
        recipe.liked = response.likedPosts.includes(recipe.id);

        card.querySelector('.likes-count').textContent = recipe.likes;
        const heartIcon = card.querySelector('.like-btn svg');
        heartIcon.setAttribute('fill', recipe.liked ? 'red' : 'none');
        heartIcon.setAttribute('stroke', recipe.liked ? 'red' : 'currentColor');
      } catch (err) {
        console.error('Error toggling like:', err);
      }
    });

    card.addEventListener('click', () => showRecipeModal(recipe));
    return card;
  };

  const showRecipeModal = (recipe) => {
    if (!recipe) return alert('Error: Recipe not found');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    const modalContent = document.createElement('div');
    modalContent.className = `relative bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in`;

    const lang = localStorage.getItem('language') || 'en';
    const title = lang === 'fr' && recipe.nameFR ? recipe.nameFR : recipe.name || 'Untitled';

    const image = recipe.imageURL
      ? `<img src="${recipe.imageURL}" alt="${title}" class="w-full h-64 object-cover rounded-lg mb-4">`
      : '<p class="text-sm text-red-500">No Image Available</p>';

    const ingredients = (lang === 'fr' && recipe.ingredientsFR)
      ? recipe.ingredientsFR.map(ing => `<li>${ing.quantity} ${ing.name} (${ing.type})</li>`).join('')
      : recipe.ingredients?.map(ing => `<li>${ing.quantity} ${ing.name} (${ing.type})</li>`).join('') || '<p>No Ingredients</p>';

    const steps = (lang === 'fr' && recipe.stepsFR)
      ? recipe.stepsFR.map((step, i) => `<li>${step}${recipe.timers?.[i] ? ` ~ ${recipe.timers[i]} mins` : ''}</li>`).join('')
      : recipe.steps?.map((step, i) => `<li>${step}${recipe.timers?.[i] ? ` ~ ${recipe.timers[i]} mins` : ''}</li>`).join('') || '<p>No Steps</p>';

    const comments = recipe.comments?.map(comment => `<p><strong>${comment.name}:</strong> ${comment.text}</p>`).join('') || '<p>No comments yet.</p>';

    const totalTime = recipe.totalTime ? `<p class="text-sm text-gray-600">Total Time: ${recipe.totalTime} minutes</p>` : '';

    modalContent.innerHTML = `
  <button id="close-modal-top" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">
    &times;
  </button>

  ${image}
  <h2 class="text-3xl font-bold mb-2">${title}</h2>
  <p class="text-sm text-gray-500 mb-4">Author: ${recipe.author || recipe.Author || 'Unknown'}</p>
  ${totalTime}

  <div class="space-y-4">
    <div>
      <h3 class="text-lg font-semibold mb-2 border-b pb-1">Ingredients</h3>
      <ul class="list-disc list-inside text-gray-700">${ingredients}</ul>
    </div>

    <div>
      <h3 class="text-lg font-semibold mb-2 border-b pb-1">Steps</h3>
      <ol class="list-decimal list-inside text-gray-700">${steps}</ol>
    </div>

    <p class="text-sm text-gray-600">Likes: <strong>${recipe.likes || 0}</strong></p>

    <div>
      <h3 class="text-lg font-semibold mb-2 border-b pb-1">Comments</h3>
      <div id="comments-section" class="text-sm space-y-1">${comments}</div>
    </div>

    <form id="comment-form" class="space-y-2">
      <input type="text" id="comment-name" placeholder="Your name" class="w-full p-2 border rounded" required />
      <textarea id="comment-text" placeholder="Your comment" class="w-full p-2 border rounded" rows="3" required></textarea>
      <button type="submit" class="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded w-full">Submit Comment</button>
    </form>

    ${userService.isAdmin(user) ? `
      <button id="unpublish-recipe" class="w-full bg-yellow-500 hover:bg-yellow-400 text-white px-4 py-2 rounded">Unpublish</button>` : ''
    }

    <button id="close-modal" class="w-full bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded">Close</button>
  </div>
`;


    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    

    document.getElementById('close-modal').addEventListener('click', () => modal.remove());
    document.getElementById('close-modal-top').addEventListener('click', () => modal.remove());

    document.getElementById('comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('comment-name').value.trim();
      const text = document.getElementById('comment-text').value.trim();
      if (name && text) {
        try {
          const updatedRecipe = await recipeService.addComment(recipe.id, { name, text });
          recipe.comments = updatedRecipe.comments;
          document.getElementById('comments-section').innerHTML = recipe.comments.map(c => `<p><strong>${c.name}:</strong> ${c.text}</p>`).join('');
          document.getElementById('comment-form').reset();
        } catch (err) {
          console.error('Error adding comment:', err);
        }
      }
    });

    const unpublishBtn = document.getElementById('unpublish-recipe');
    if (unpublishBtn) {
      unpublishBtn.addEventListener('click', async () => {
        try {
          await recipeService.updateRecipeStatus(recipe.id, false);
          unpublishBtn.textContent = 'Unpublished';
          unpublishBtn.disabled = true;
          setTimeout(() => (window.location.href = 'index.html'), 1000);
        } catch (err) {
          console.error('Unpublish error:', err);
          unpublishBtn.textContent = 'Failed to Unpublish';
        }
      });
    }
  };

  const filterAndRender = () => {
    let filtered = recipes.filter(r => r.published);

    if (currentSearch) {
      filtered = filtered.filter(r => {
        const name = r.name?.toLowerCase() || '';
        const nameFR = r.nameFR?.toLowerCase() || '';
        return name.includes(currentSearch.toLowerCase()) || nameFR.includes(currentSearch.toLowerCase());
      });
    }

    if (activeFilters.size) {
      filtered = filtered.filter(r => {
        const without = r.Without || [];
        if (activeFilters.has('gluten-free') && !without.includes('NoGluten')) return false;
        if (activeFilters.has('vegan') && !without.includes('Vegan')) return false;
        if (activeFilters.has('vegetarian') && !without.includes('Vegetarian')) return false;
        if (activeFilters.has('omnivore') && !without.includes('Omnivore')) return false;
        if (activeFilters.has('translated') && !r.nameFR) return false;
        if (activeFilters.has('liked') && !r.liked) return false;
        return true;
      });
    }

    if (currentSort === 'name-asc') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (currentSort === 'name-desc') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (currentSort === 'most-liked') filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    recipesList.innerHTML = '';
    filtered.forEach(r => recipesList.appendChild(createCard(r)));
  };

  searchInput?.addEventListener('input', e => {
    currentSearch = e.target.value;
    filterAndRender();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      btn.classList.toggle('bg-blue-600');
      btn.classList.toggle('text-white');
      activeFilters.has(filter) ? activeFilters.delete(filter) : activeFilters.add(filter);
      filterAndRender();
    });
  });

  clearFiltersBtn?.addEventListener('click', () => {
    activeFilters.clear();
    currentSearch = '';
    searchInput.value = '';
    filterButtons.forEach(btn => btn.classList.remove('bg-blue-600', 'text-white'));
    filterAndRender();
  });

  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndRender();
  });

  filterAndRender();

  const applyDynamicText = () => {
    const lang = localStorage.getItem('language') || 'en';
    searchInput.placeholder = lang === 'fr' ? 'Rechercher des recettes...' : 'Search recipes...';
    const sortLabel = document.getElementById('sort-label');
    if (sortLabel) sortLabel.textContent = lang === 'fr' ? 'Trier par :' : 'Sort by:';

    document.querySelectorAll('#sort-recipes option').forEach(opt => {
      opt.textContent = opt.dataset[lang];
    });
    document.querySelectorAll('.filter-btn, #clear-filters').forEach(btn => {
      const text = btn.dataset[lang];
      if (text) btn.textContent = text;
    });
  };

  applyDynamicText();
});
