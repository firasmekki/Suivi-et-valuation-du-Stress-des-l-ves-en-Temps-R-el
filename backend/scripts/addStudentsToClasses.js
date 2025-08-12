const mongoose = require('mongoose');
const { Classe, Eleve, Parent } = require('../models');

// Configuration MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/stress_eleve';

// Élèves de test à ajouter
const testStudents = [
  {
    nom: 'Dupont',
    prenom: 'Marie',
    dateNaissance: '2005-03-15',
    adresse: '123 Rue de la Paix, Paris',
    telephone: '0123456789',
    email: 'marie.dupont@email.com',
    horlogeId: 'STU001'
  },
  {
    nom: 'Martin',
    prenom: 'Pierre',
    dateNaissance: '2005-07-22',
    adresse: '456 Avenue des Champs, Lyon',
    telephone: '0987654321',
    email: 'pierre.martin@email.com',
    horlogeId: 'STU002'
  },
  {
    nom: 'Bernard',
    prenom: 'Sophie',
    dateNaissance: '2005-11-08',
    adresse: '789 Boulevard Central, Marseille',
    telephone: '0555666777',
    email: 'sophie.bernard@email.com',
    horlogeId: 'STU003'
  },
  {
    nom: 'Petit',
    prenom: 'Lucas',
    dateNaissance: '2005-01-30',
    adresse: '321 Rue du Commerce, Toulouse',
    telephone: '0444333222',
    email: 'lucas.petit@email.com',
    horlogeId: 'STU004'
  },
  {
    nom: 'Robert',
    prenom: 'Emma',
    dateNaissance: '2005-09-12',
    adresse: '654 Place de la République, Nice',
    telephone: '0333222111',
    email: 'emma.robert@email.com',
    horlogeId: 'STU005'
  }
];

// Parents de test
const testParents = [
  {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@email.com',
    adresse: '123 Rue de la Paix, Paris',
    telephone: '0123456789',
    password: 'password123'
  },
  {
    nom: 'Martin',
    prenom: 'Claire',
    email: 'claire.martin@email.com',
    adresse: '456 Avenue des Champs, Lyon',
    telephone: '0987654321',
    password: 'password123'
  },
  {
    nom: 'Bernard',
    prenom: 'Michel',
    email: 'michel.bernard@email.com',
    adresse: '789 Boulevard Central, Marseille',
    telephone: '0555666777',
    password: 'password123'
  },
  {
    nom: 'Petit',
    prenom: 'Isabelle',
    email: 'isabelle.petit@email.com',
    adresse: '321 Rue du Commerce, Toulouse',
    telephone: '0444333222',
    password: 'password123'
  },
  {
    nom: 'Robert',
    prenom: 'François',
    email: 'francois.robert@email.com',
    adresse: '654 Place de la République, Nice',
    telephone: '0333222111',
    password: 'password123'
  }
];

async function addStudentsToClasses() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les classes
    const classes = await Classe.find();
    console.log(`📚 ${classes.length} classes trouvées`);

    if (classes.length === 0) {
      console.log('❌ Aucune classe trouvée. Créez d\'abord des classes.');
      return;
    }

    // Créer ou récupérer les parents
    const parents = [];
    for (const parentData of testParents) {
      let parent = await Parent.findOne({ email: parentData.email });
      if (!parent) {
        parent = new Parent(parentData);
        await parent.save();
        console.log(`👨‍👩‍👧‍👦 Parent créé: ${parent.nom} ${parent.prenom}`);
      } else {
        console.log(`👨‍👩‍👧‍👦 Parent existant: ${parent.nom} ${parent.prenom}`);
      }
      parents.push(parent);
    }

    // Créer les élèves et les assigner aux classes
    for (let i = 0; i < testStudents.length; i++) {
      const studentData = testStudents[i];
      const parent = parents[i];
      const classe = classes[i % classes.length]; // Distribuer les élèves entre les classes

      // Vérifier si l'élève existe déjà
      let student = await Eleve.findOne({ email: studentData.email });
      if (!student) {
        student = new Eleve({
          ...studentData,
          classe: classe._id,
          parent: parent._id
        });
        await student.save();
        console.log(`👤 Élève créé: ${student.nom} ${student.prenom} -> Classe: ${classe.niveau} ${classe.section}`);

        // Ajouter l'élève à la classe
        await Classe.findByIdAndUpdate(
          classe._id,
          { $addToSet: { eleves: student._id } }
        );

        // Ajouter l'élève au parent
        await Parent.findByIdAndUpdate(
          parent._id,
          { $addToSet: { enfants: student._id } }
        );
      } else {
        console.log(`👤 Élève existant: ${student.nom} ${student.prenom}`);
      }
    }

    // Vérifier les résultats
    const updatedClasses = await Classe.find().populate('eleves', 'nom prenom');
    console.log('\n📊 Résumé final:');
    updatedClasses.forEach(classe => {
      console.log(`📚 ${classe.niveau} ${classe.section}: ${classe.eleves.length} élèves`);
      classe.eleves.forEach(eleve => {
        console.log(`  - ${eleve.nom} ${eleve.prenom}`);
      });
    });

    console.log('\n✅ Script terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
addStudentsToClasses(); 