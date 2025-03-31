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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});