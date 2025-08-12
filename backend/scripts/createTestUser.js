const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Enseignant } = require('../models');

const MONGODB_URI = 'mongodb://localhost:27017/school_db';

const createTestEnseignant = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Vérifier si l'enseignant existe déjà
    const existingUser = await Enseignant.findOne({ email: 'enseignant@test.com' });
    if (existingUser) {
      console.log('L\'enseignant de test existe déjà');
      process.exit(0);
    }

    // Créer un nouvel enseignant
    const hashedPassword = await bcrypt.hash('password123', 10);
    const newEnseignant = new Enseignant({
      nom: 'Test',
      prenom: 'Enseignant',
      email: 'enseignant@test.com',
      password: hashedPassword,
      matiere: 'Mathématiques',
      telephone: '0123456789',
      dateNaissance: '1990-01-01',
      adresse: '123 Rue de l\'École, Ville',
      classes: [] // Liste vide par défaut
    });

    await newEnseignant.save();
    console.log('Enseignant de test créé avec succès');
    console.log('Email: enseignant@test.com');
    console.log('Mot de passe: password123');

  } catch (error) {
    console.error('Erreur lors de la création de l\'enseignant:', error);
  } finally {
    await mongoose.connection.close();
  }
};

createTestEnseignant(); 