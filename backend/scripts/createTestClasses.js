const mongoose = require('mongoose');
const { Classe } = require('../models');

// Configuration MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/stress_eleve';

// Classes de test à créer
const testClasses = [
  { niveau: '1ere', section: 'svt 1' },
  { niveau: '1ere', section: 'tech 1' },
  { niveau: '2eme', section: 'eco 1' },
  { niveau: '3eme', section: 'math 1' },
  { niveau: 'bac', section: 'info 1' }
];

async function createTestClasses() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer les classes
    for (const classeData of testClasses) {
      // Vérifier si la classe existe déjà
      const existingClasse = await Classe.findOne({
        niveau: classeData.niveau,
        section: classeData.section
      });

      if (!existingClasse) {
        const classe = new Classe({
          niveau: classeData.niveau,
          section: classeData.section,
          eleves: [],
          enseignants: []
        });
        await classe.save();
        console.log(`📚 Classe créée: ${classe.niveau} ${classe.section} (ID: ${classe._id})`);
      } else {
        console.log(`📚 Classe existante: ${existingClasse.niveau} ${existingClasse.section} (ID: ${existingClasse._id})`);
      }
    }

    // Vérifier les résultats
    const allClasses = await Classe.find();
    console.log(`\n📊 Total: ${allClasses.length} classes créées`);

    console.log('\n✅ Script terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
createTestClasses(); 