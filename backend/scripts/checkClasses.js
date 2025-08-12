const mongoose = require('mongoose');
const { Classe } = require('../models');

// Configuration MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/stress_eleve';

async function checkClasses() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les classes
    const classes = await Classe.find();
    console.log(`📚 ${classes.length} classes trouvées`);

    if (classes.length === 0) {
      console.log('❌ Aucune classe trouvée.');
      console.log('💡 Créez d\'abord des classes via l\'interface admin.');
    } else {
      console.log('\n📋 Classes existantes:');
      classes.forEach((classe, index) => {
        console.log(`${index + 1}. ${classe.niveau} ${classe.section} (ID: ${classe._id})`);
        console.log(`   Élèves: ${classe.eleves ? classe.eleves.length : 0}`);
        console.log(`   Enseignants: ${classe.enseignants ? classe.enseignants.length : 0}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
checkClasses(); 