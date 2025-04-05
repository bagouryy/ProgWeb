import userService from './userService.js';
import recipeService from './recipeService.js';
import Navigation from './navigation.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('chef.js: DOMContentLoaded event triggered'); // Debugging log

  await userService.loadUsers();
  const user = userService.getLoggedInUser();
  console.log('chef.js: Logged-in user:', user); // Debugging log

  if (!user || !userService.isChef()) {
    console.log('chef.js: User is not a chef or not logged in'); // Debugging log
    return window.location.href = 'login.html';
  }

  const language = localStorage.getItem('language') || 'en';
  console.log('chef.js: Current language:', language); // Debugging log

  Navigation.init('nav-menu', 'user-info', 'logout', 'language-toggle');

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
    const stepLines = document.getElementById('recipe-steps').value.trim().split('\n').filter(Boolean);
    const steps = [];
    const timers = [];

    stepLines.forEach(line => {
      const match = line.trim().match(/^(.*?)(?:\s+(\d+))?$/);  // captures step + optional number
      if (match) {
        const stepText = match[1].trim();
        const time = match[2] ? parseInt(match[2]) : 0;
        steps.push(stepText);
        timers.push(time);
      }
    });

    const imageURL = document.getElementById('recipe-image').value.trim();
    const originalURL = document.getElementById('recipe-original-url').value.trim();
    const totalTime = parseInt(document.getElementById('total-time').value.trim(), 10);
    const Without = [];
    if (document.getElementById('gluten-free').checked) {
      Without.push('NoGluten');
    }
    if (document.getElementById('vegan').checked) {
      Without.push('Vegan');
    }
    if (document.getElementById('vegetarian').checked) {
      Without.push('Vegetarian');
    }
    if (document.getElementById('omnivore').checked) {
      Without.push('Omnivore');
    }

    const newRecipe = {
      author: user.username,
      name,
      Without,
      ingredients,
      steps,
      timers,
      imageURL,
      originalURL,
      totalTime, // Add total time to the recipe object
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
