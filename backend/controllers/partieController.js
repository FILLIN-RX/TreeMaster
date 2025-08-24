const Partie = require("../models/Partie");

exports.creerPartie = async (req, res) => {
  try {
    const { nom, mise_min } = req.body;
    const id = await Partie.create(nom, mise_min);
    res.status(201).json({ message: "✅ Partie créée", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listerParties = async (req, res) => {
  try {
    const parties = await Partie.getAll();
    res.json(parties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
