import recipeService from './recipeService.js';
import userService from './userService.js';
import Navigation from './navigation.js';

document.addEventListener('DOMContentLoaded', async () => {
  await userService.loadUsers();
  const user = await userService.getLoggedInUser();
  console.log('👤 Logged in user:', user);
  

  if (!user || !userService.isChef(user) || userService.isTranslator(user)) {
    return window.location.href = 'login.html';
  }

  Navigation.init('nav-menu', 'user-info', 'logout', 'language-toggle');

  const recipeList = document.getElementById('recipe-list');
  const lang = localStorage.getItem('language') || 'en';

  const t = (en, fr) => lang === 'fr' ? fr : en;

  const parseLine = (line) => {
    const parts = line.trim().split(' ');
    return {
      quantity: parts[0],
      name: parts.slice(1, -1).join(' '),
      type: parts[parts.length - 1]
    };
  };

  const renderRecipeCard = (recipe) => {
    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-xl shadow space-y-4';

    const header = document.createElement('h2');
    header.className = 'text-xl font-semibold';
    header.textContent = `${recipe.name || 'Untitled'}`;

    const nameInput = document.createElement('input');
    nameInput.className = 'w-full p-2 border rounded';
    nameInput.placeholder = t('Name (EN)', 'Nom (EN)');
    nameInput.value = recipe.name || '';

    const nameFRInput = document.createElement('input');
    nameFRInput.className = 'w-full p-2 border rounded';
    nameFRInput.placeholder = t('Name (FR)', 'Nom (FR)');
    nameFRInput.value = recipe.nameFR || '';

    const ingredientsInput = document.createElement('textarea');
    ingredientsInput.className = 'w-full p-2 border rounded';
    ingredientsInput.rows = 4;
    ingredientsInput.placeholder = t('Ingredients (EN)', 'Ingrédients (EN)');
    ingredientsInput.value = (recipe.ingredients || []).map(i => `${i.quantity} ${i.name} ${i.type}`).join('\n');

    const ingredientsFRInput = document.createElement('textarea');
    ingredientsFRInput.className = 'w-full p-2 border rounded';
    ingredientsFRInput.rows = 4;
    ingredientsFRInput.placeholder = t('Ingredients (FR)', 'Ingrédients (FR)');
    ingredientsFRInput.value = (recipe.ingredientsFR || []).map(i => `${i.quantity} ${i.name} ${i.type}`).join('\n');

    const stepsInput = document.createElement('textarea');
    stepsInput.className = 'w-full p-2 border rounded';
    stepsInput.rows = 4;
    stepsInput.placeholder = t('Steps (EN)', 'Étapes (EN)');
    stepsInput.value = (recipe.steps || []).join('\n');

    const stepsFRInput = document.createElement('textarea');
    stepsFRInput.className = 'w-full p-2 border rounded';
    stepsFRInput.rows = 4;
    stepsFRInput.placeholder = t('Steps (FR)', 'Étapes (FR)');
    stepsFRInput.value = (recipe.stepsFR || []).join('\n');

    const imageInput = document.createElement('input');
    imageInput.type = 'text';
    imageInput.className = 'w-full p-2 border rounded';
    imageInput.placeholder = t('Image URL', 'URL de l\'image');
    imageInput.value = recipe.imageURL || '';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 ' + t('Save', 'Enregistrer');
    saveBtn.className = 'bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded';

    saveBtn.addEventListener('click', async () => {
      const updated = {
        ...recipe,
        name: nameInput.value,
        nameFR: nameFRInput.value,
        ingredients: ingredientsInput.value.split('\n').map(parseLine),
        ingredientsFR: ingredientsFRInput.value.split('\n').map(parseLine),
        steps: stepsInput.value.split('\n'),
        stepsFR: stepsFRInput.value.split('\n'),
        imageURL: imageInput.value
      };

      try {
        await recipeService.saveRecipe(updated);
        alert(t('Saved!', 'Enregistré !'));
      } catch (err) {
        console.error(err);
        alert(t('Error saving.', 'Erreur lors de l\'enregistrement.'));
      }
    });

    card.append(
      header,
      nameInput,
      nameFRInput,
      ingredientsInput,
      ingredientsFRInput,
      stepsInput,
      stepsFRInput,
      imageInput,
      saveBtn
    );

    recipeList.appendChild(card);
  };

  const renderAll = async () => {
    recipeList.innerHTML = '';
    const all = await recipeService.getAllRecipes();
    console.log('📦 All recipes loaded:', all);
    const ownRecipes = all.filter(r => r.Author === user.username);
    console.log('📋 My recipes:', ownRecipes);
    console.log(ownRecipes[0].author);
    console.log(user.username);
    ownRecipes.forEach(renderRecipeCard);
  };

  renderAll();
});
