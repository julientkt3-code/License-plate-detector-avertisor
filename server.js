/**
 * server.js — Serveur pour Replit
 * Sert index.html + proxifie les requêtes vers l'API Anthropic
 * (pour cacher la clé API côté serveur)
 */

const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Clé API depuis variable d'environnement Replit (Secrets)
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

app.use(express.json({ limit: '10mb' })); // images base64 = volumineuses

// ── Sert les fichiers statiques ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Proxy API Anthropic ───────────────────────────────────────────────────
// Le frontend envoie ses requêtes ici → le serveur ajoute la clé API
app.post('/api/anthropic', async (req, res) => {
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY non configurée dans les Secrets Replit'
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch(err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Démarrage ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ RADAR server running on port ${PORT}`);
  if (!ANTHROPIC_KEY) {
    console.warn('⚠ ANTHROPIC_API_KEY non définie — ajoutez-la dans Secrets Replit');
  }
});
