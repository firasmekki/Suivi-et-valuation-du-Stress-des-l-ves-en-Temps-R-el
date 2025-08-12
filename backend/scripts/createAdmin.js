const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
require('dotenv').config()

// Importer le modèle Admin
const Admin = require('../models/admin')

const createDefaultAdmin = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    // Vérifier si un admin existe déjà
    const existingAdmin = await Admin.findOne({ email: 'admin@admin.com' })
    if (existingAdmin) {
      console.log('Un administrateur existe déjà')
      process.exit(0)
    }

    // Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Créer le nouvel administrateur
    const newAdmin = new Admin({
      nom: 'Administrateur',
      email: 'admin@admin.com',
      password: hashedPassword,
      role: 'admin'
    })

    // Sauvegarder l'administrateur
    await newAdmin.save()

    console.log('Administrateur créé avec succès!')
    console.log('Email: admin@admin.com')
    console.log('Mot de passe: admin123')

  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error)
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.connection.close()
  }
}

// Exécuter la fonction
createDefaultAdmin() 