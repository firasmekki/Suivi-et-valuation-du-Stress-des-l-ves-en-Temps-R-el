const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, Eleve, Enseignant, Parent } = require('../models');

const models = {
  eleve: Eleve,
  parent: Parent,
  enseignant: Enseignant,
  admin: Admin,
};

// 🔐 Inscription
// 🔐 Inscription
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, mot de passe et rôle sont requis.' });
    }

    const cleanRole = role?.trim()?.toLowerCase();
    const Model = models[cleanRole];

    if (!Model) return res.status(400).json({ message: 'Rôle invalide.' });

    const existing = await Model.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Cet utilisateur existe déjà' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Model({ nom, prenom, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: cleanRole },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: cleanRole,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// 🔐 Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe sont requis."
      });
    }
    // Chercher l'utilisateur dans tous les modèles
    const userTypes = [
      { model: Admin, role: 'admin' },
      { model: Enseignant, role: 'enseignant' },
      { model: Parent, role: 'parent' },
      { model: Eleve, role: 'eleve' }
    ];
    let user = null;
    let foundRole = null;
    for (const type of userTypes) {
      user = await type.model.findOne({ email });
      if (user) {
        foundRole = type.role;
        break;
      }
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }
    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    // Mettre à jour la dernière connexion
    console.log('Mise à jour de la dernière connexion pour:', email);
    try {
      const updatedUser = await user.constructor.findByIdAndUpdate(
        user._id,
        { $set: { lastLogin: new Date() } },
        { new: true }
      );
      console.log('Dernière connexion mise à jour:', updatedUser.lastLogin);
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour de lastLogin:', updateError);
    }

    // Créer le token
    const token = jwt.sign(
      { id: user._id, role: foundRole },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: foundRole,
        matiere: user.matiere
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message
    });
  }
};

// Fonction de changement de mot de passe
exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Vérifier que tous les champs sont présents
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis"
      });
    }

    // Vérifier que le nouveau mot de passe est assez long
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères"
      });
    }

    // Rechercher l'utilisateur
    const user = await Enseignant.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect"
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès"
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement de mot de passe",
      error: error.message
    });
  }
};
