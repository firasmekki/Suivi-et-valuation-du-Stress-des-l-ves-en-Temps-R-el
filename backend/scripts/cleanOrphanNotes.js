const mongoose = require('mongoose');
const Note = require('../models/Note');
const Etudiant = require('../models/Etudiant');

const MONGODB_URI = 'mongodb://localhost:27017/stress_eleve'; // adapte si besoin

async function cleanOrphanNotes() {
  await mongoose.connect(MONGODB_URI);
  const allNotes = await Note.find({});
  let count = 0;
  for (const note of allNotes) {
    const etu = await Etudiant.findById(note.etudiant);
    if (!etu) {
      await Note.deleteOne({ _id: note._id });
      count++;
      console.log('Note supprimée (orpheline):', note._id);
    }
  }
  console.log(`Nettoyage terminé. ${count} notes orphelines supprimées.`);
  await mongoose.disconnect();
}

cleanOrphanNotes(); 