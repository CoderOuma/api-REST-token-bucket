// Étape 1: Initialisation du projet
require("dotenv").config();
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
const PORT = process.env.PORT || 7000;

// Stockage des utilisateurs et de leurs tokens
const users = {};
const ip_register = {};

// Stockage des items
let items = [
  { id: 1, name: "Item 1", description: "First item" },
  { id: 2, name: "Item 2", description: "Second item" },
];

app.use(express.json());
app.use(express.static("public"));

// Route de test
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

// Étape 2: Système d'enregistrement et de génération de tokens
app.post("/register", (req, res) => {
  try {
    const client_ip = req.ip || req.connection.remoteAddress;

    if (ip_register[client_ip] && users[ip_register[client_ip]]?.requestsNumber > 0) {
      return res.status(403).json({
        error: "Already registered",
        message: "You can only register one time while you have remaining requests.",
      });
    }

    if (ip_register[client_ip]) {
      delete users[ip_register[client_ip]];
    }

    const userId = uuidv4();
    const token = uuidv4();

    users[token] = {
      userId,
      token,
      requestsNumber: 100,
      last_recharge: new Date(),
      ip: client_ip,
    };

    ip_register[client_ip] = token;

    res.status(201).json({
      token,
      requestsNumber: users[token].requestsNumber,
      message: "User registered successfully. You have 100 requests available.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Étape 3: Middleware d'authentification
const authenticate = (req, res, next) => {
  try {
    const theHeader = req.headers["authorization"];
    const token = theHeader && theHeader.split(" ")[1];

    if (!token || !users[token]) {
      return res.status(401).json({ error: "Invalid or missing token" });
    }

    req.user = users[token];
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Étape 4: Mise en œuvre du modèle "Token Bucket"
const rateLimiter = (req, res, next) => {
  try {
    const user = req.user;

    if (user.requestsNumber <= 0) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Your request max number has been exhausted.",
        requestsNumber: user.requestsNumber,
      });
    }

    const originalRequestsNumber = user.requestsNumber;

    const the_json = res.json.bind(res);
    res.json = (data) => {
      user.requestsNumber = Math.max(0, user.requestsNumber - 1);
      const newData = {
        ...data,
        requestsNumberRemaining: user.requestsNumber,
      };
      console.log(
        `[RequestsNumber] User ${user.userId} - ${req.method} ${req.path} - From ${originalRequestsNumber} to ${user.requestsNumber}`
      );
      return the_json(newData);
    };

    next();
  } catch (error) {
    console.error("Rate limiting error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Étape 5: Rechargement du quota de requêtes
app.post("/recharge", authenticate, (req, res) => {
  try {
    const user = req.user;

    console.log("Recharge request body:", req.body);

    let new_quantity = Number.parseInt(req.body?.amount) || 100;

    new_quantity = Math.max(0, new_quantity);
    user.requestsNumber += new_quantity;
    user.last_recharge = new Date();

    res.status(200).json({
      message: `Requests number recharged with ${new_quantity} requests`,
      newRequestsNumber: user.requestsNumber,
      last_recharge: user.last_recharge,
      requestsNumberRemaining: user.requestsNumber,
    });
  } catch (error) {
    console.error("Recharge error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Étape 6: Manipulation de données protégées (CRUD pour items)
// GET /items - Récupérer tous les items
app.get("/items", authenticate, rateLimiter, (req, res) => {
  try {
    res.status(200).json(items);
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /items - Ajouter un item
app.post("/items", authenticate, rateLimiter, (req, res) => {
  try {
    const new_item = {
      id: items.length + 1,
      name: req.body.name,
      description: req.body.description,
    };

    items.push(new_item);
    res.status(201).json(new_item);
  } catch (error) {
    console.error("Add item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /items/:id - Modifier un item
app.put("/items/:id", authenticate, rateLimiter, (req, res) => {
  try {
    const id = Number.parseInt(req.params.id);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Item not found" });
    }

    items[index] = { ...items[index], ...req.body };
    res.status(200).json(items[index]);
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /items/:id - Supprimer un item
app.delete("/items/:id", authenticate, rateLimiter, (req, res) => {
  try {
    const id = Number.parseInt(req.params.id);
    const length = items.length;
    items = items.filter((item) => item.id !== id);

    if (items.length === length) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});