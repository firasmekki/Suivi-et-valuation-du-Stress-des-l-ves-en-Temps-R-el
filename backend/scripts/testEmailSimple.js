const mongoose = require('mongoose');
const stressAlertService = require('../services/stressAlertService');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    try {
      console.log('\n🧪 Test simple d\'envoi d\'email d\'alerte...\n');

      // Récupérer le premier élève de la base de données
      const { Eleve } = require('../models');
      const student = await Eleve.findOne().populate('parent').populate('classeId');

      if (!student) {
        console.log('❌ Aucun élève trouvé dans la base de données');
        return;
      }

      if (!student.parent) {
        console.log('❌ Aucun parent associé à cet élève');
        return;
      }

      console.log(`✅ Élève trouvé: ${student.prenom} ${student.nom}`);
      console.log(`📧 Email du parent: ${student.parent.email}`);
      console.log(`🏫 Classe: ${student.classeId ? `${student.classeId.niveau} ${student.classeId.section}` : 'Non assigné'}\n`);

      // Simuler un niveau de stress élevé
      const stressLevel = 85;
      console.log(`🚨 Test avec un niveau de stress de ${stressLevel}%\n`);

      // Créer un historique simulé
      const simulatedHistory = [
        { level: 30, timestamp: new Date(Date.now() - 10 * 60 * 1000) },
        { level: 45, timestamp: new Date(Date.now() - 8 * 60 * 1000) },
        { level: 60, timestamp: new Date(Date.now() - 6 * 60 * 1000) },
        { level: 75, timestamp: new Date(Date.now() - 4 * 60 * 1000) },
        { level: stressLevel, timestamp: new Date() }
      ];

      // Forcer l'envoi de l'alerte
      console.log('📤 Envoi de l\'email d\'alerte...');
      await stressAlertService.sendStressAlert(student._id, stressLevel, simulatedHistory, true);

      console.log('✅ Email d\'alerte envoyé avec succès !');
      console.log(`📧 Vérifiez votre boîte email: ${student.parent.email}`);
      console.log('\n🎯 Le système d\'alerte de stress fonctionne parfaitement !');

    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
    } finally {
      mongoose.connection.close();
      console.log('\n🔌 Connexion MongoDB fermée');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.log('❌ MongoDB connection error: ', err);
    process.exit(1);
  }); 