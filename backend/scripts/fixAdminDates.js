const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('../models/Admin');

async function fixAdminDates() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Récupérer tous les admins
    const admins = await Admin.find({});
    console.log(`Trouvé ${admins.length} administrateurs`);

    // Date de référence fixe (1er janvier 2024)
    const referenceDate = new Date('2024-01-01');

    // Mettre à jour chaque admin
    for (const admin of admins) {
      console.log(`Mise à jour de l'admin ${admin.email}`);
      console.log('Ancienne date de création:', admin.createdAt);
      
      // Mettre à jour la date de création
      await Admin.findByIdAndUpdate(
        admin._id,
        {
          $set: {
            createdAt: referenceDate,
            updatedAt: new Date(),
            lastLogin: new Date()
          }
        },
        { new: true }
      );
      
      console.log(`✅ Date corrigée pour ${admin.email}`);
    }

    console.log('✅ Mise à jour des dates terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
fixAdminDates(); 