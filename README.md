# API REST avec Limitation de Requêtes (Token Bucket)

Ce projet implémente une API REST sécurisée avec un système de limitation de requêtes basé sur des jetons (tokens). Chaque utilisateur dispose d'un quota de requêtes limité, qu'il peut recharger.

## Fonctionnalités

- Système d'authentification par token
- Limitation de requêtes basée sur le modèle "Token Bucket"
- Rechargement du quota de requêtes
- Manipulation de données (CRUD) protégée par token et quota

## Installation

1. Cloner le dépôt
2. Installer les dépendances :
   \`\`\`
   npm install
   \`\`\`
3. Créer un fichier `.env` à la racine du projet (optionnel) :
   \`\`\`
   PORT=7000
   \`\`\`
4. Démarrer le serveur :
   \`\`\`
   node server.js
   \`\`\`

## Routes disponibles

### Authentification

- `GET /ping` : Tester si le serveur fonctionne
- `POST /register` : S'enregistrer et obtenir un token (100 requêtes par défaut)
- `POST /recharge` : Recharger son quota de requêtes

### Manipulation de données (protégées par token + quota)

- `GET /items` : Récupérer la liste des items
- `POST /items` : Ajouter un nouvel item
- `PUT /items/:id` : Modifier un item existant
- `DELETE /items/:id` : Supprimer un item

## Comment tester l'API

### Interface Web

Une interface web simple est disponible à la racine du serveur. Ouvrez votre navigateur à l'adresse `http://localhost:7000` pour y accéder.

### Avec Postman ou un client HTTP

1. Enregistrez-vous pour obtenir un token :
   \`\`\`
   POST http://localhost:7000/register
   \`\`\`

2. Utilisez ce token dans l'en-tête `Authorization` pour les requêtes suivantes :
   \`\`\`
   Authorization: Bearer votre-token-ici
   \`\`\`

3. Testez les différentes routes avec le token obtenu.

## Exemple d'utilisation avec cURL

\`\`\`bash
# Enregistrement pour obtenir un token
curl -X POST http://localhost:7000/register

# Récupérer la liste des items (avec le token)
curl -X GET http://localhost:7000/items -H "Authorization: Bearer votre-token-ici"

# Ajouter un item
curl -X POST http://localhost:7000/items \
  -H "Authorization: Bearer votre-token-ici" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nouvel item", "description":"Description de l'item"}'

# Modifier un item
curl -X PUT http://localhost:7000/items/1 \
  -H "Authorization: Bearer votre-token-ici" \
  -H "Content-Type: application/json" \
  -d '{"name":"Item modifié"}'

# Supprimer un item
curl -X DELETE http://localhost:7000/items/1 \
  -H "Authorization: Bearer votre-token-ici"

# Recharger son quota de requêtes
curl -X POST http://localhost:7000/recharge \
  -H "Authorization: Bearer votre-token-ici" \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'
