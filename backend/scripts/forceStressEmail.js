require('dotenv').config();
const mongoose = require('mongoose');
const stressAlertService = require('../services/stressAlertService');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    try {
      console.log('\n🚨 FORÇAGE ENVOI EMAIL ALERTE STRESS POUR SOUTENANCE\n');

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

      // Simuler un niveau de stress CRITIQUE
      const stressLevel = 85;
      console.log(`🚨 Test avec un niveau de stress CRITIQUE de ${stressLevel}%\n`);

      // Créer un historique simulé pour forcer l'alerte
      const simulatedHistory = [
        { level: 30, timestamp: new Date(Date.now() - 10 * 60 * 1000) },
        { level: 45, timestamp: new Date(Date.now() - 8 * 60 * 1000) },
        { level: 60, timestamp: new Date(Date.now() - 6 * 60 * 1000) },
        { level: 75, timestamp: new Date(Date.now() - 4 * 60 * 1000) },
        { level: stressLevel, timestamp: new Date() }
      ];

      // Forcer l'envoi de l'alerte
      console.log('📤 Envoi de l\'email d\'alerte CRITIQUE...');
      await stressAlertService.sendStressAlert(student._id, stressLevel, simulatedHistory, true);

      console.log('✅ Email d\'alerte CRITIQUE envoyé avec succès !');
      console.log(`📧 Vérifiez votre boîte email: ${student.parent.email}`);
      console.log('\n🎯 Tu peux maintenant montrer cet email à ta soutenance !');
      console.log('📧 N\'oublie pas de vérifier les spams aussi');

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      console.log('\n🔧 Solutions possibles :');
      console.log('1. Vérifie que l\'email du parent est correct');
      console.log('2. Vérifie la configuration Gmail dans emailConfig.js');
      console.log('3. Vérifie les spams');
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB:', err);
  }); 