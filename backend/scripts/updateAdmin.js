const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('../models/Admin');

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const adminId = '683fcd3083d5ba2117421a2f';
    const referenceDate = new Date('2024-01-01T00:00:00.000Z');

    const result = await Admin.updateOne(
      { _id: adminId },
      {
        $set: {
          createdAt: referenceDate,
          updatedAt: referenceDate
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Admin mis à jour avec succès');
      const admin = await Admin.findById(adminId);
      console.log('Nouvelle date de création:', admin.createdAt);
    } else {
      console.log('❌ Aucune modification effectuée');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

updateAdmin(); 