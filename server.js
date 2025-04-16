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

// Route protégée pour tester l'authentification et la limitation
app.get("/protected", authenticate, rateLimiter, (req, res) => {
  res.status(200).json({ message: "You are authenticated!", user: req.user.userId });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});