const Module = require('../models/module');

// ➕ Créer un module
exports.createModule = async (req, res) => {
  try {
    const module = new Module(req.body);
    await module.save();
    res.status(201).json(module);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création du module", error: err.message });
  }
};

// 🔍 Obtenir tous les modules
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find().populate('enseignant', 'nom prenom');
    res.status(200).json(modules);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération", error: err.message });
  }
};
