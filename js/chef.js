import userService from './userService.js';
import recipeService from './recipeService.js';

document.addEventListener('DOMContentLoaded', () => {
  const user = userService.getLoggedInUser();
  if (!user || !userService.isChef(user.username)) {
    return window.location.href = 'login.html';
  }

  const language = localStorage.getItem('language') || 'en';

  const t = {
    en: {
      title: "Submit a New Recipe",
      nameLabel: "Recipe Name",
      ingLabel: "Ingredients (one per line: quantity name type)",
      stepsLabel: "Preparation Steps (one per line)",
      glutenFree: "Gluten Free",
      vegan: "Vegan",
      imageLabel: "Image URL",
      submitBtn: "Submit"
    },
    fr: {
      title: "Soumettre une Nouvelle Recette",
      nameLabel: "Nom de la recette",
      ingLabel: "Ingrédients (un par ligne : quantité nom type)",
      stepsLabel: "Etapes de préparation (une par ligne)",
      glutenFree: "Sans gluten",
      vegan: "Vegan",
      imageLabel: "URL de l'image",
      submitBtn: "Soumettre"
    }
  };

  const lang = t[language];

  // Update UI labels
  document.querySelector('h1').textContent = lang.title;
  document.querySelector('label[for="recipe-name"]').textContent = lang.nameLabel;
  document.querySelector('label[for="recipe-ingredients"]').textContent = lang.ingLabel;
  document.querySelector('label[for="recipe-steps"]').textContent = lang.stepsLabel;
  document.querySelector('label[for="gluten-free"] span').textContent = lang.glutenFree;
  document.querySelector('label[for="vegan"] span').textContent = lang.vegan;
  document.querySelector('label[for="recipe-image"]').textContent = lang.imageLabel;
  document.querySelector('#recipe-form button[type="submit"]').textContent = lang.submitBtn;

  // Setup form submit
  const form = document.getElementById('recipe-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('recipe-name').value.trim();
    const ingredients = document.getElementById('recipe-ingredients').value.trim().split('\n').map(line => {
      const parts = line.trim().split(' ');
      return {
        quantity: parts[0],
        name: parts.slice(1, -1).join(' '),
        type: parts[parts.length - 1]
      };
    });
    const steps = document.getElementById('recipe-steps').value.trim().split('\n').filter(Boolean);
    const imageURL = document.getElementById('recipe-image').value.trim();
    const dietary = {
      glutenFree: document.getElementById('gluten-free').checked,
      vegan: document.getElementById('vegan').checked
    };

    const newRecipe = {
      author: user.username,
      name,
      ingredients,
      steps,
      imageURL,
      dietary,
      published: false
    };

    try {
      await recipeService.saveRecipe(newRecipe);
      alert(language === 'en' ? 'Recipe submitted!' : 'Recette soumise !');
      form.reset();
    } catch (err) {
      console.error(err);
      alert(language === 'en' ? 'Error saving recipe.' : 'Erreur lors de la sauvegarde.');
    }
  });
});
