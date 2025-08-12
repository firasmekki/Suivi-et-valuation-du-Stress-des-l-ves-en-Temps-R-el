const mongoose = require('mongoose');
const { Note, Classe, Eleve } = require('../models');

const MONGODB_URI = 'mongodb://localhost:27017/stress_eleve';

async function generateTestNotes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const classes = await Classe.find().populate('eleves');
    let count = 0;

    for (const classe of classes) {
      for (const eleve of classe.eleves) {
        const noteData = {
          classe: classe._id,
          etudiant: eleve._id,
          matiere: 'math',
          controle: { note: Math.floor(Math.random() * 11) + 10, appreciation: 'Bien' }
        };
        const updated = await Note.findOneAndUpdate(
          { classe: classe._id, etudiant: eleve._id, matiere: 'math' },
          noteData,
          { upsert: true, new: true }
        );
        count++;
        console.log(`📝 Note générée pour ${eleve.nom} ${eleve.prenom} en ${classe.niveau} ${classe.section}`);
      }
    }

    console.log(`\n✅ ${count} notes créées`);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

generateTestNotes(); 