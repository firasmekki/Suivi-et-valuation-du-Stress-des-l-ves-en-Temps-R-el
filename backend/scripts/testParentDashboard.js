require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    try {
      console.log('\n🎯 TEST DASHBOARD PARENT - ENVOI EMAIL ALERTE STRESS\n');

      // 1. Se connecter en tant qu'admin pour récupérer un parent
      console.log('1️⃣ Connexion en tant qu\'admin...');
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@school.com',
        password: 'admin123'
      });

      const adminToken = loginResponse.data.token;
      console.log('✅ Connexion admin réussie\n');

      // 2. Récupérer la liste des parents
      console.log('2️⃣ Récupération de la liste des parents...');
      const parentsResponse = await axios.get('http://localhost:5000/api/parents', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const parents = parentsResponse.data.data;
      if (parents.length === 0) {
        console.log('❌ Aucun parent trouvé dans la base de données');
        return;
      }

      const testParent = parents[0]; // Premier parent
      console.log(`✅ Parent sélectionné: ${testParent.prenom} ${testParent.nom} (${testParent.email})\n`);

      // 3. Se connecter en tant que ce parent
      console.log('3️⃣ Connexion en tant que parent...');
      const parentLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: testParent.email,
        password: 'parent123' // Mot de passe par défaut
      });

      const parentToken = parentLoginResponse.data.token;
      console.log('✅ Connexion parent réussie\n');

      // 4. Simuler l'ouverture du dashboard parent (appel à getParentProfile)
      console.log('4️⃣ Simulation ouverture dashboard parent...');
      const dashboardResponse = await axios.get('http://localhost:5000/api/parents/profile', {
        headers: { Authorization: `Bearer ${parentToken}` }
      });

      console.log('✅ Dashboard parent ouvert avec succès');
      console.log('📧 Email d\'alerte stress envoyé automatiquement !');
      console.log(`📧 Vérifiez votre boîte email: ${testParent.email}`);
      console.log('\n🎯 Tu peux maintenant montrer cet email à ta soutenance !');

      // 5. Optionnel : Réinitialiser pour pouvoir tester à nouveau
      console.log('\n5️⃣ Réinitialisation des emails envoyés...');
      await axios.post('http://localhost:5000/api/parents/reset-emails', {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      console.log('✅ Emails réinitialisés - Tu peux tester à nouveau !');

    } catch (error) {
      console.error('❌ Erreur lors du test:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        console.log('\n🔧 Solutions possibles :');
        console.log('1. Vérifie que le backend est démarré (npm start)');
        console.log('2. Vérifie les identifiants admin/parent');
        console.log('3. Vérifie que les parents ont des enfants associés');
      }
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB:', err);
  }); 