// Étape 1: Initialisation du projet
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());

// Route de test
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});