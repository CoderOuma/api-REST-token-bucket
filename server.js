// Étape 1: Initialisation du projet
require("dotenv").config();
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
const PORT = process.env.PORT || 7000;

// Stockage des utilisateurs et de leurs tokens
const users = {};
const ip_register = {};

app.use(express.json());

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

// Route protégée pour tester l'authentification
app.get("/protected", authenticate, (req, res) => {
  res.status(200).json({ message: "You are authenticated!", user: req.user.userId });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});