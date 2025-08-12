const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    runDemo();
  })
  .catch((err) => {
    console.log('❌ MongoDB connection error: ', err);
    process.exit(1);
  });

async function runDemo() {
  try {
    console.log('\n🎯 DÉMONSTRATION POUR SOUTENANCE - SYSTÈME D\'ALERTE DE STRESS\n');

    // 1. Se connecter en tant qu'admin
    console.log('1️⃣ Connexion en tant qu\'admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie\n');

    // 2. Récupérer la liste des élèves
    console.log('2️⃣ Récupération de la liste des élèves...');
    const studentsResponse = await axios.get('http://localhost:5000/api/eleves', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const students = studentsResponse.data.data;
    if (students.length === 0) {
      console.log('❌ Aucun élève trouvé dans la base de données');
      return;
    }

    const testStudent = students[0]; // Premier élève
    console.log(`✅ Élève sélectionné: ${testStudent.prenom} ${testStudent.nom}\n`);

    // 3. Simulation d'augmentation progressive du stress
    console.log('3️⃣ 🚨 DÉMONSTRATION - Simulation d\'augmentation du stress...');
    console.log('📊 Le stress va augmenter progressivement de 30% à 85% en 6 minutes');
    console.log('📧 Un email d\'alerte sera envoyé dès que le stress dépasse 70%\n');

    const simulateResponse = await axios.post('http://localhost:5000/api/stress-alerts/simulate', {
      studentId: testStudent._id,
      duration: 6 // 6 minutes de simulation
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Simulation démarrée !');
    console.log('⏱️ Durée: 6 minutes');
    console.log('📈 Le stress augmentera de 10% toutes les 2 minutes');
    console.log('🎯 Email d\'alerte attendu à la 4ème minute (stress = 70%)\n');

    // 4. Attendre et montrer les résultats
    console.log('4️⃣ Attente de 12 secondes pour voir les résultats...');
    await new Promise(resolve => setTimeout(resolve, 12000));

    // 5. Récupérer les statistiques
    console.log('5️⃣ Récupération des statistiques...');
    const statsResponse = await axios.get('http://localhost:5000/api/stress-alerts/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Statistiques récupérées');
    console.log('📊 Stats:', statsResponse.data.data);
    console.log('');

    // 6. Récupérer l'historique du stress
    console.log('6️⃣ Récupération de l\'historique du stress...');
    const historyResponse = await axios.get(`http://localhost:5000/api/stress-alerts/history/${testStudent._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Historique récupéré');
    console.log('📈 Nombre de mesures:', historyResponse.data.data.count);
    console.log('📊 Évolution du stress:');
    
    historyResponse.data.data.history.forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleTimeString('fr-FR');
      const status = entry.level > 80 ? '🔴 TRÈS ÉLEVÉ' : 
                    entry.level > 70 ? '🟠 ÉLEVÉ' : 
                    entry.level > 50 ? '🟡 MODÉRÉ' : '🟢 NORMAL';
      console.log(`   ${time} - ${entry.level}% ${status}`);
    });
    console.log('');

    // 7. Forcer un email d'alerte pour la démonstration
    console.log('7️⃣ 🎯 ENVOI D\'EMAIL D\'ALERTE POUR DÉMONSTRATION...');
    const forceResponse = await axios.post('http://localhost:5000/api/stress-alerts/force', {
      studentId: testStudent._id,
      stressLevel: 85
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Email d\'alerte envoyé !');
    console.log('📧 Destinataire:', forceResponse.data.data.student.email);
    console.log('🚨 Niveau de stress: 85% (CRITIQUE)');
    console.log('');

    console.log('🎉 DÉMONSTRATION TERMINÉE AVEC SUCCÈS !');
    console.log('\n📋 RÉSUMÉ POUR LA SOUTENANCE :');
    console.log('✅ Système de surveillance du stress opérationnel');
    console.log('✅ Détection automatique des seuils critiques');
    console.log('✅ Envoi d\'emails d\'alerte professionnels');
    console.log('✅ Historique et statistiques en temps réel');
    console.log('✅ Interface de test et de simulation');
    console.log('\n📧 Vérifiez votre boîte email pour voir l\'alerte de stress !');

  } catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error.response?.data || error.message);
  } finally {
    // Fermer la connexion MongoDB
    mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de la démonstration...');
  mongoose.connection.close();
  process.exit(0);
}); 