const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    runTest();
  })
  .catch((err) => {
    console.log('❌ MongoDB connection error: ', err);
    process.exit(1);
  });

async function runTest() {
  try {
    console.log('\n🧪 Démarrage du test d\'alerte de stress...\n');

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

    // 3. Tester l'envoi d'une alerte de stress
    console.log('3️⃣ Test d\'envoi d\'alerte de stress...');
    const testResponse = await axios.post('http://localhost:5000/api/stress-alerts/test', {
      studentId: testStudent._id,
      stressLevel: 75
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Test d\'alerte effectué');
    console.log('📊 Résultats:', testResponse.data.data);
    console.log('');

    // 4. Forcer l'envoi d'une alerte (pour voir l'email)
    console.log('4️⃣ Envoi forcé d\'une alerte de stress...');
    const forceResponse = await axios.post('http://localhost:5000/api/stress-alerts/force', {
      studentId: testStudent._id,
      stressLevel: 85
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Alerte forcée envoyée');
    console.log('📧 Email envoyé à:', forceResponse.data.data.student.email);
    console.log('');

    // 5. Simuler une augmentation progressive du stress
    console.log('5️⃣ Simulation d\'augmentation progressive du stress...');
    const simulateResponse = await axios.post('http://localhost:5000/api/stress-alerts/simulate', {
      studentId: testStudent._id,
      duration: 6 // 6 minutes de simulation
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Simulation démarrée');
    console.log('⏱️ Durée:', simulateResponse.data.data.duration, 'minutes');
    console.log('📈 Étapes:', simulateResponse.data.data.steps);
    console.log('');

    // 6. Attendre un peu et vérifier les statistiques
    console.log('6️⃣ Attente de 10 secondes pour la simulation...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const statsResponse = await axios.get('http://localhost:5000/api/stress-alerts/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Statistiques récupérées');
    console.log('📊 Stats:', statsResponse.data.data);
    console.log('');

    // 7. Récupérer l'historique du stress
    console.log('7️⃣ Récupération de l\'historique du stress...');
    const historyResponse = await axios.get(`http://localhost:5000/api/stress-alerts/history/${testStudent._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Historique récupéré');
    console.log('📈 Nombre de mesures:', historyResponse.data.data.count);
    console.log('📊 Dernières mesures:', historyResponse.data.data.history.slice(-3));
    console.log('');

    console.log('🎉 Test terminé avec succès !');
    console.log('\n📧 Vérifiez votre boîte email pour voir l\'alerte de stress envoyée.');
    console.log('📊 Le système surveille maintenant le stress de l\'élève toutes les 2 minutes.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
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
  console.log('\n🛑 Arrêt du script...');
  mongoose.connection.close();
  process.exit(0);
}); 