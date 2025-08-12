const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    
    // Initialiser les modèles après la connexion
    require('./models');
    
    // Import des routes
    const authRoutes = require('./routes/auth');
    const enseignantRoutes = require('./routes/enseignantRoutes');
    const parentRoutes = require('./routes/parentRoutes');
    const eleveRoutes = require('./routes/eleveRoutes');
    const classeRoutes = require('./routes/classeRoutes');
    const adminRoutes = require('./routes/adminRoutes');
    const sensorsRoutes = require('./routes/sensors');
    const noteRoutes = require('./routes/noteRoutes');
    const stressAlertRoutes = require('./routes/stressAlertRoutes');

    // Configuration CORS
    app.use(cors({
      origin: true,
      credentials: true
    }));

    // Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Debug middleware - Ajout de logs détaillés
    app.use((req, res, next) => {
      console.log('\n=== NOUVELLE REQUÊTE ===');
      console.log(`📥 ${req.method} ${req.url}`);
      console.log('📋 Headers:', {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer [PRÉSENT]' : '[ABSENT]'
      });
      console.log('📦 Body:', req.body);
      next();
    });

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(__dirname, 'uploads/photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Servir les fichiers statiques
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });

    app.get('/', (req, res) => {
      res.send('🚀 API is running');
    });

    // Routes API
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/enseignants', enseignantRoutes);
    app.use('/api/parents', parentRoutes);
    app.use('/api/eleves', eleveRoutes);
    app.use('/api/classes', classeRoutes);
    app.use('/api/sensors', sensorsRoutes);
    app.use('/api/notes', noteRoutes);
    app.use('/api/stress-alerts', stressAlertRoutes);

    // Serve static assets in production
    if (process.env.NODE_ENV === 'production') {
      // Set static folder
      app.use(express.static('client/build'));

      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
      });
    }

    // Gestion des erreurs 404 (après toutes les autres routes)
    app.use((req, res) => {
      console.log('\n=== ROUTE NON TROUVÉE ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer [PRÉSENT]' : '[ABSENT]'
      });
      res.status(404).json({
        success: false,
        message: 'Route non trouvée'
      });
    });

    // Gestion globale des erreurs
    app.use((err, req, res, next) => {
      console.error('\n=== ERREUR SERVEUR ===');
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
      console.error('Details:', err);
      
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
      });
    });

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`\n=== SERVEUR DÉMARRÉ ===`);
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log('Routes disponibles:');
      console.log('- GET  /api/health');
      console.log('- POST /api/auth/login');
      console.log('- GET  /api/admin/stats');
      console.log('- GET  /api/admin/list');
      // ... autres routes
    }).on('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });

  })
  .catch((err) => {
    console.log('❌ MongoDB connection error: ', err);
    process.exit(1);
  });
