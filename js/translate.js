import recipeService from './recipeService.js';
import userService from './userService.js';
import Navigation from './navigation.js';

const translations = {
  title: {
    en: 'Translate Recipes',
    fr: 'Traduire les Recettes'
  },
  filter: {
    en: 'Filter:',
    fr: 'Filtrer :'
  }
};

function applyPageTranslations() {
  const lang = localStorage.getItem('language') || 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key] && translations[key][lang]) {
      el.textContent = translations[key][lang];
    }
  });
}

function isFullyTranslated(recipe) {
  return recipe.nameFR && recipe.ingredientsFR?.length && recipe.stepsFR?.length;
}

function isPartiallyTranslated(recipe) {
  return recipe.nameFR || (recipe.ingredientsFR?.length > 0) || (recipe.stepsFR?.length > 0);
}

const isAuthor = (recipe, user) => {
  return recipe.author === user.username;
};


document.addEventListener('DOMContentLoaded', async () => {
  await userService.loadUsers();
  const user = userService.getLoggedInUser();
  if (!user || !userService.isTranslator()) {
    return window.location.href = 'login.html';
  }

  const list = document.getElementById('translate-list');
  const filter = document.getElementById('lang-filter');
  
  const language = localStorage.getItem('language') || 'en';
  Navigation.init('nav-menu', 'user-info', 'logout', 'language-toggle');

  applyPageTranslations();


  const renderRecipeCard = (recipe) => {
    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-xl shadow space-y-4';

    const header = document.createElement('h2');
    header.className = 'text-xl font-semibold';
    header.textContent = `${recipe.name} / ${recipe.nameFR || '—'}`;

    const autoSyncWrapper = document.createElement('div');
    autoSyncWrapper.className = 'flex items-center gap-2';
    const autoSyncCheckbox = document.createElement('input');
    autoSyncCheckbox.type = 'checkbox';
    autoSyncCheckbox.id = `sync-${recipe.id}`;
    const autoSyncLabel = document.createElement('label');
    autoSyncLabel.htmlFor = autoSyncCheckbox.id;
    autoSyncLabel.textContent = 'Auto-fill French from English';
    autoSyncLabel.className = 'text-sm text-gray-600';
    autoSyncWrapper.append(autoSyncCheckbox, autoSyncLabel);

    const fieldset = (lang, nameKey, ingKey, stepsKey) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'space-y-2';

      const title = document.createElement('h3');
      title.className = 'font-bold text-gray-700';
      title.textContent = lang;

      const name = document.createElement('input');
      name.className = 'w-full p-2 border rounded';
      name.placeholder = 'Name';
      name.value = recipe[nameKey] || '';

      const ingredients = document.createElement('textarea');
      ingredients.className = 'w-full p-2 border rounded';
      ingredients.rows = 4;
      ingredients.placeholder = 'Ingredients (quantity name type)';
      ingredients.value = (recipe[ingKey] || []).map(i => `${i.quantity} ${i.name} ${i.type}`).join('\n');

      const steps = document.createElement('textarea');
      steps.className = 'w-full p-2 border rounded';
      steps.rows = 4;
      steps.placeholder = 'Steps';
      steps.value = (recipe[stepsKey] || []).join('\n');

      wrapper.append(title, name, ingredients, steps);
      return { wrapper, name, ingredients, steps };
    };

    const enFields = fieldset('🇬🇧 English', 'name', 'ingredients', 'steps');
    const frFields = fieldset('🇫🇷 French', 'nameFR', 'ingredientsFR', 'stepsFR');

    const userIsAuthor = isAuthor(recipe, user);

// Disable only non-empty translated fields if user is not author
if (!userIsAuthor) {
  // Lock English fields if already filled
  if (recipe.name) enFields.name.disabled = true;
  if (recipe.ingredients?.length) enFields.ingredients.disabled = true;
  if (recipe.steps?.length) enFields.steps.disabled = true;

  // Lock French fields if already filled
  if (recipe.nameFR) frFields.name.disabled = true;
  if (recipe.ingredientsFR?.length) frFields.ingredients.disabled = true;
  if (recipe.stepsFR?.length) frFields.steps.disabled = true;
}



    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = '💾 Save';
    saveBtn.className = 'bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded';

  const englishLocked = recipe.name && recipe.ingredients?.length && recipe.steps?.length;
  const frenchLocked = recipe.nameFR && recipe.ingredientsFR?.length && recipe.stepsFR?.length;
  
  if (!userIsAuthor && englishLocked && frenchLocked) {
    saveBtn.disabled = true;
    saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
    saveBtn.title = "No editable fields. You can only translate or modify your own recipes.";
  }
  


    autoSyncCheckbox.addEventListener('change', () => {
      if (autoSyncCheckbox.checked) {
        frFields.name.value = enFields.name.value;
        frFields.ingredients.value = enFields.ingredients.value;
        frFields.steps.value = enFields.steps.value;
      }
    });

    saveBtn.addEventListener('click', async () => {
      const update = {
        name: enFields.name.value,
        ingredients: enFields.ingredients.value.split('\n').map(l => parseLine(l)),
        steps: enFields.steps.value.split('\n'),
        nameFR: frFields.name.value,
        ingredientsFR: frFields.ingredients.value.split('\n').map(l => parseLine(l)),
        stepsFR: frFields.steps.value.split('\n')
      };
      try {
        await recipeService.saveRecipe({ ...recipe, ...update });
        alert('✅ Saved');
      } catch (err) {
        console.error(err);
        alert('❌ Error while saving');
      }
    });

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    grid.append(enFields.wrapper, frFields.wrapper);

    card.append(header, autoSyncWrapper, grid, saveBtn);
    list.appendChild(card);
  };

  const parseLine = (line) => {
    const parts = line.trim().split(' ');
    return {
      quantity: parts[0],
      name: parts.slice(1, -1).join(' '),
      type: parts[parts.length - 1]
    };
  };

  const renderAll = async () => {
    list.innerHTML = '';
    const all = await recipeService.getAllRecipes();
    const val = filter.value;
    const filtered = all.filter(r => {
      if (val === 'published') return r.published;
      if (val === 'unpublished') return !r.published;
      if (val === 'untranslated') return !isPartiallyTranslated(r);
      if (val === 'partial') return isPartiallyTranslated(r) && !isFullyTranslated(r);
      if (val === 'translated') return isFullyTranslated(r);
      return true;
    });
    filtered.forEach(renderRecipeCard);
  };

  filter.addEventListener('change', renderAll);
  await renderAll();
});