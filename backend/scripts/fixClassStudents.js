const mongoose = require('mongoose');
const { Classe, Eleve } = require('../models');

const MONGODB_URI = 'mongodb://localhost:27017/stress_eleve';

async function fixClassStudents() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  // Récupérer tous les élèves
  const eleves = await Eleve.find();
  // Grouper les élèves par classe
  const map = {};
  for (const eleve of eleves) {
    if (!eleve.classe) continue;
    const key = eleve.classe.toString();
    if (!map[key]) map[key] = [];
    map[key].push(eleve._id);
  }

  // Mettre à jour chaque classe avec la liste des élèves
  let count = 0;
  for (const [classeId, eleveIds] of Object.entries(map)) {
    await Classe.findByIdAndUpdate(classeId, { eleves: eleveIds });
    count++;
    console.log(`🔗 Classe ${classeId} liée à ${eleveIds.length} élèves.`);
  }

  console.log(`\n✅ ${count} classes mises à jour.`);
  await mongoose.disconnect();
  console.log('🔌 Déconnecté de MongoDB');
}

fixClassStudents(); 