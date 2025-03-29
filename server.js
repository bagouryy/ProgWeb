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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});