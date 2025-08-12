const mongoose = require('mongoose');
const { Enseignant } = require('../models');

const MONGODB_URI = 'mongodb://localhost:27017/school_db';

const checkEnseignant = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const enseignant = await Enseignant.findOne({ email: 'enseignant@test.com' });
    
    if (enseignant) {
      console.log('\nEnseignant trouvé:');
      console.log('------------------');
      console.log('ID:', enseignant._id);
      console.log('Nom:', enseignant.nom);
      console.log('Prénom:', enseignant.prenom);
      console.log('Email:', enseignant.email);
      console.log('Matière:', enseignant.matiere);
      console.log('Password Hash:', enseignant.password);
    } else {
      console.log('\n❌ Aucun enseignant trouvé avec cet email');
    }

    // Lister tous les enseignants
    console.log('\nListe de tous les enseignants:');
    console.log('-----------------------------');
    const allEnseignants = await Enseignant.find({});
    allEnseignants.forEach(ens => {
      console.log(`- ${ens.prenom} ${ens.nom} (${ens.email})`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnexion fermée');
  }
};

checkEnseignant(); 