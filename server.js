import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));
app.use(express.json());

// Load data path
const recipesFile = path.join(__dirname, 'data', 'recipes.json');
const usersFile = path.join(__dirname, 'data', 'users.json');

// --- Helper functions ---
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Failed to read ${filePath}:`, err);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`❌ Failed to write to ${filePath}:`, err);
    return false;
  }
}

// --- USERS ---

// Append new recipe
app.post('/api/recipes', (req, res) => {
  const newRecipe = req.body;

  fs.readFile(recipesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read recipes.json' });

    let recipes = [];
    try {
      recipes = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in recipes.json' });
    }

    recipes.push(newRecipe);
    fs.writeFile(recipesFile, JSON.stringify(recipes, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to recipes.json' });
      res.status(201).json(newRecipe);
    });
  });
});

// Append new user
app.post('/api/users', (req, res) => {
  const newUser = req.body;

  fs.readFile(usersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read users.json' });

    let users = [];
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in users.json' });
    }

    users.push(newUser);
    fs.writeFile(usersFile, JSON.stringify(users, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to users.json' });
      res.status(201).json(newUser);
    });
  });
});

// Update existing user
app.put('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const updatedUser = req.body;

  if (!updatedUser || updatedUser.username !== username) {
    return res.status(400).json({ error: 'Username in URL and body must match' });
  }

  fs.readFile(usersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read users.json' });

    let users;
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON in users.json' });
    }

    const index = users.findIndex(u => u.username === username);
    if (index === -1) return res.status(404).json({ error: 'User not found' });

    users[index] = updatedUser;

    fs.writeFile(usersFile, JSON.stringify(users, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to users.json' });
      res.status(200).json(updatedUser);
    });
  });
});

app.post('/api/recipes', (req, res) => {
  const newRecipe = req.body;
  let recipes = readJsonFile(recipesFile);

  const index = recipes.findIndex(r => r.name === newRecipe.name); // 🔁 use name
  if (index !== -1) {
    recipes[index] = newRecipe; // ✅ Update existing
  } else {
    recipes.push(newRecipe); // ✅ Add new
  }

  if (writeJsonFile(recipesFile, recipes)) {
    res.status(200).json({ success: true, recipe: newRecipe });
  } else {
    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

app.put('/api/recipes/:name', (req, res) => {
  const { name } = req.params;
  const updatedRecipe = req.body;

  if (!updatedRecipe || updatedRecipe.name?.trim().toLowerCase() !== name.trim().toLowerCase()) {
    return res.status(400).json({ error: 'Name in URL and body must match' });
  }

  let recipes = readJsonFile(recipesFile);
  const index = recipes.findIndex(r => r.name?.trim().toLowerCase() === name.trim().toLowerCase());

  if (index === -1) return res.status(404).json({ error: 'Recipe not found' });

  recipes[index] = updatedRecipe;

  if (writeJsonFile(recipesFile, recipes)) {
    res.status(200).json(updatedRecipe);
  } else {
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Add like to a recipe
app.post('/api/recipes/:id/like', (req, res) => {
  const { id } = req.params;

  fs.readFile(recipesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read recipes.json' });

    let recipes = [];
    try {
      recipes = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in recipes.json' });
    }

    const recipe = recipes.find(r => r.id === id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    recipe.likes = (recipe.likes || 0) + 1;

    fs.writeFile(recipesFile, JSON.stringify(recipes, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to recipes.json' });
      res.status(200).json(recipe);
    });
  });
});

app.put('/api/recipes/:id/like', (req, res) => {
  const { id } = req.params;

  fs.readFile(recipesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read recipes.json' });

    let recipes = [];
    try {
      recipes = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in recipes.json' });
    }

    const recipe = recipes.find(r => r.id === id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    recipe.likes = (recipe.likes || 0) - 1;

    fs.writeFile(recipesFile, JSON.stringify(recipes, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to recipes.json' });
      res.status(200).json(recipe);
    });
  });
});

// Add comment to a recipe
app.post('/api/recipes/:id/comment', (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: 'Comment is required' });
  }

  fs.readFile(recipesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read recipes.json' });

    let recipes = [];
    try {
      recipes = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in recipes.json' });
    }

    const recipe = recipes.find(r => r.id === id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    recipe.comments = recipe.comments || [];
    recipe.comments.push(comment);

    fs.writeFile(recipesFile, JSON.stringify(recipes, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to recipes.json' });
      res.status(200).json(recipe);
    });
  });
});

// Add API endpoint to fetch liked posts for a user
app.get('/api/users/:username/liked-posts', (req, res) => {
  const { username } = req.params;

  fs.readFile(usersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read users.json' });

    let users = [];
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in users.json' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ likedPosts: user.likedPosts || [] });
  });
});

app.put('/api/users/:username/liked-posts', (req, res) => {
  const { username } = req.params;
  const { recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  fs.readFile(usersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read users.json' });

    let users = [];
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in users.json' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.likedPosts = user.likedPosts || [];
    const index = user.likedPosts.indexOf(recipeId);

    if (index === -1) {
      user.likedPosts.push(recipeId);
    } else {
      user.likedPosts.splice(index, 1);
    }

    fs.writeFile(usersFile, JSON.stringify(users, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to users.json' });
      res.status(200).json(user);
    });
  });
});

// Add API endpoint to remove liked post for a user
app.put('/api/users/:username/remove-liked-post', (req, res) => {
  const { username } = req.params;
  const { recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  fs.readFile(usersFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read users.json' });

    let users = [];
    try {
      users = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON format in users.json' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.likedPosts || !user.likedPosts.includes(recipeId)) {
      return res.status(400).json({ error: 'User has not liked this post' });
    }

    user.likedPosts = user.likedPosts.filter(id => id !== recipeId);

    fs.writeFile(usersFile, JSON.stringify(users, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to write to users.json' });
      res.status(200).json({ success: true, likedPosts: user.likedPosts });
    });
  });
});

app.post('/api/users/:username/likes', (req, res) => {
  const { username } = req.params;
  const { recipeId } = req.body;
  if (!username || !recipeId) {
    return res.status(400).json({ error: 'Username and recipeId required' });
  }

  const users = readJsonFile(usersFile);
  const recipes = readJsonFile(recipesFile);

  const user = users.find(u => u.username === username);
  const recipe = recipes.find(r => r.id === recipeId);
  if (!user || !recipe) return res.status(404).json({ error: 'User or recipe not found' });

  if (!user.likedPosts) user.likedPosts = [];

  const alreadyLiked = user.likedPosts.includes(recipeId);

  if (alreadyLiked) {
    user.likedPosts = user.likedPosts.filter(id => id !== recipeId);
    recipe.likes = Math.max((recipe.likes || 1) - 1, 0);
  } else {
    user.likedPosts.push(recipeId);
    recipe.likes = (recipe.likes || 0) + 1;
  }

  writeJsonFile(usersFile, users);
  writeJsonFile(recipesFile, recipes);

  res.json({ likedPosts: user.likedPosts, recipe });
});

app.put('/api/recipes/:id/likes', (req, res) => {
  const { id } = req.params;
  const { increment } = req.body; // expects { increment: 1 } or { increment: -1 }

  if (![1, -1].includes(increment)) {
    return res.status(400).json({ error: 'Invalid increment value' });
  }

  fs.readFile(recipesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read recipes.json' });

    let recipes;
    try {
      recipes = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON in recipes.json' });
    }

    const index = recipes.findIndex(r => String(r.id) === String(id));
    if (index === -1) return res.status(404).json({ error: 'Recipe not found' });

    recipes[index].likes = (recipes[index].likes || 0) + increment;

    fs.writeFile(recipesFile, JSON.stringify(recipes, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update likes' });
      res.status(200).json({ success: true, recipe: recipes[index] });
    });
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});