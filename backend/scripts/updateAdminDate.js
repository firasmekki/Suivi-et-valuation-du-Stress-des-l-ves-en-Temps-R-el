const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('../models/Admin');

async function updateAdminDate() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // ID de l'admin à mettre à jour
    const adminId = '683fcd3083d5ba2117421a2f';
    
    // Date de référence fixe (1er janvier 2024 à minuit)
    const referenceDate = new Date('2024-01-01T00:00:00.000Z');

    // Mettre à jour l'admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        $set: {
          createdAt: referenceDate,
          updatedAt: referenceDate
        }
      },
      { new: true }
    );

    if (updatedAdmin) {
      console.log('✅ Admin mis à jour avec succès:');
      console.log('Nouvelle date de création:', updatedAdmin.createdAt);
      console.log('Nouvelle date de mise à jour:', updatedAdmin.updatedAt);
    } else {
      console.log('❌ Admin non trouvé');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
updateAdminDate(); 