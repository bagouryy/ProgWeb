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
    card.className = 'bg-white rounded-xl shadow-card p-4 hover:shadow-card-hover transition duration-200 relative';

    const title = language === 'fr' && recipe.nameFR ? recipe.nameFR : recipe.name;

    const image = recipe.imageURL
      ? `<img src="${recipe.imageURL}" alt="${title}" class="w-full h-48 object-cover rounded-t-xl">`
      : '';

    card.innerHTML = `
      ${image}
      <h3 class="text-xl font-semibold mt-4">${title}</h3>
      <p class="text-sm text-gray-600">Author: ${recipe.author || recipe.Author || 'Unknown'}</p>
      <p class="text-sm text-gray-600">Likes: <span class="likes-count">${recipe.likes || 0}</span></p>
      <button class="like-btn absolute bottom-4 right-4 bg-transparent transition duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="${recipe.liked ? 'red' : 'none'}" viewBox="0 0 24 24" stroke="red" stroke-width="2" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 
            4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 
            14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 
            3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
    `;
    

    card.querySelector('.like-btn').addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent opening the modal
      try {
        let updatedRecipe = null;
        if (recipe.liked) {
            updatedRecipe = await recipeService.removeLike(recipe.id);
        }else {
            updatedRecipe = await recipeService.addLike(recipe.id);
        }
        recipe.likes = updatedRecipe.likes;
        recipe.liked = !recipe.liked; // Toggle liked state
        const likesCount = card.querySelector('.likes-count');
        likesCount.textContent = recipe.likes;
        const likeIcon = card.querySelector('.like-btn svg');
        likeIcon.setAttribute('fill', recipe.liked ? 'currentColor' : 'none');
      } catch (error) {
        console.error('Error liking recipe:', error);
      }
    });

    card.addEventListener('click', () => {
      showRecipeModal(recipe);
    });

    return card;
  };

  const showRecipeModal = (recipe) => {
    if (!recipe) {
      console.error('showRecipeModal: Recipe is undefined');
      alert('Error: Recipe not found');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-full overflow-y-auto';

    const lang = localStorage.getItem('language') || 'en';
    const title = lang === 'fr' && recipe.nameFR ? recipe.nameFR : recipe.name || 'Untitled';

    const image = recipe.imageURL
      ? `<img src="${recipe.imageURL}" alt="${title}" class="w-full h-64 object-cover rounded-lg mb-4">`
      : '<p class="text-sm text-red-500">No Image Available</p>';

    const ingredients = (lang === 'fr' && recipe.ingredientsFR)
      ? recipe.ingredientsFR.map(ing => `<li>${ing.quantity} ${ing.name} (${ing.type})</li>`).join('')
      : recipe.ingredients?.map(ing => `<li>${ing.quantity} ${ing.name} (${ing.type})</li>`).join('') || '<p class="text-sm text-red-500">No Ingredients Available</p>';

    const steps = (lang === 'fr' && recipe.stepsFR)
      ? recipe.stepsFR.map((step, index) => {
        const timer = recipe.timers && recipe.timers[index] && recipe.timers[index] !== 0 ? ` ~ ${recipe.timers[index]} mins` : '';
        return `<li>${step}${timer}</li>`;
      }).join('')
      : recipe.steps?.map((step, index) => {
        const timer = recipe.timers && recipe.timers[index] && recipe.timers[index] !== 0 ? ` ~ ${recipe.timers[index]} mins` : '';
        return `<li>${step}${timer}</li>`;
      }).join('') || '<p class="text-sm text-red-500">No Steps Available</p>';


    const comments = recipe.comments?.map(comment => `<p><strong>${comment.name}:</strong> ${comment.text}</p>`).join('') || '<p class="text-sm text-gray-500">No comments yet.</p>';

    modalContent.innerHTML = `
      ${image}
      <h2 class="text-2xl font-bold mb-4">${title}</h2>
      <p class="text-sm text-gray-600 mb-4">Author: ${recipe.author || recipe.Author || 'Unknown'}</p>
      <h3 class="text-lg font-semibold mb-2">Ingredients:</h3>
      <ul class="list-disc list-inside mb-4">${ingredients}</ul>
      <h3 class="text-lg font-semibold mb-2">Steps:</h3>
      <ol class="list-decimal list-inside">${steps}</ol>
      <p class="text-sm text-gray-600">Likes: ${recipe.likes || 0}</p>
      <h3 class="text-lg font-semibold mb-2">Comments:</h3>
      <div id="comments-section" class="mb-4">${comments}</div>
      <form id="comment-form" class="space-y-2">
        <input type="text" id="comment-name" placeholder="Your name" class="w-full p-2 border rounded" required />
        <textarea id="comment-text" placeholder="Your comment" class="w-full p-2 border rounded" rows="3" required></textarea>
        <button type="submit" class="bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded">Submit Comment</button>
      </form>
      <button id="close-modal" class="mt-4 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded">Close</button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById('comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('comment-name').value.trim();
      const text = document.getElementById('comment-text').value.trim();

      if (name && text) {
        try {
          const updatedRecipe = await recipeService.addComment(recipe.id, { name, text });
          recipe.comments = updatedRecipe.comments;
          const commentsSection = document.getElementById('comments-section');
          commentsSection.innerHTML = recipe.comments.map(comment => `<p><strong>${comment.name}:</strong> ${comment.text}</p>`).join('');
          document.getElementById('comment-form').reset();
        } catch (error) {
          console.error('Error adding comment:', error);
        }
      }
    });

    const closeModal = () => {
      modal.remove();
    };

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById('close-modal').addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    }, { once: true });
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
