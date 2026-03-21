#!/usr/bin/env node
// Script one-time pour obtenir un refresh_token Google Drive OAuth2
// Usage: node get-drive-token.js <CLIENT_ID> <CLIENT_SECRET>

const http = require('http');
const https = require('https');
const url = require('url');

const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];
const REDIRECT_URI = 'http://localhost:3333/callback';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Usage: node get-drive-token.js <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

// Etape 1: generer l'URL d'auth
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent`;

console.log('\n=== Massive Medias - Google Drive OAuth2 Setup ===\n');
console.log('Ouvre cette URL dans ton navigateur:\n');
console.log(authUrl);
console.log('\nEn attente de la redirection...\n');

// Etape 2: serveur local pour recevoir le callback
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname !== '/callback') return;

  const code = parsed.query.code;
  if (!code) {
    res.end('Erreur: pas de code recu');
    return;
  }

  // Etape 3: echanger le code contre un refresh_token
  const tokenBody = `code=${encodeURIComponent(code)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&grant_type=authorization_code`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });

    const data = await tokenRes.json();

    if (data.refresh_token) {
      console.log('\n=== SUCCES! ===\n');
      console.log('Refresh Token:\n');
      console.log(data.refresh_token);
      console.log('\n=== Ajoute ces variables sur Render: ===\n');
      console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
      console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${data.refresh_token}`);
      console.log('\n(Tu peux supprimer GOOGLE_DRIVE_CREDENTIALS qui ne sert plus)\n');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Connexion reussie!</h1><p>Retourne dans le terminal pour voir le refresh token.</p><p>Tu peux fermer cette page.</p>');
    } else {
      console.error('Erreur:', data);
      res.end('Erreur: ' + JSON.stringify(data));
    }
  } catch (err) {
    console.error('Erreur fetch:', err);
    res.end('Erreur: ' + err.message);
  }

  server.close();
});

server.listen(3333, () => {
  console.log('Serveur local en ecoute sur http://localhost:3333/callback');
});

http://intranetspvm/recrutement/wp-content/uploads/sites/20/2026/03/Aide-memoire_creation_abolition_traverse.pdf
http://intranetspvm/recrutement/wp-content/uploads/sites/20/2026/03/Aide-memoire_creation_abolition_traverse.pdf
http://intranetspvm/recrutement/wp-content/uploads/sites/20/2025/11/Aide-memoire_creation_abolition_traverse.pdf
