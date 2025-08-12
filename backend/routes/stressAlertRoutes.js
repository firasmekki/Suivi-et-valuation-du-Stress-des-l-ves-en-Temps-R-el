const express = require('express');
const router = express.Router();
const stressAlertController = require('../controllers/stressAlertController');
const { auth } = require('../middleware/auth');

// Routes pour les alertes de stress
// Toutes les routes nécessitent une authentification

// Tester l'envoi d'une alerte de stress
router.post('/test', auth, stressAlertController.testStressAlert);

// Forcer l'envoi d'une alerte de stress (pour les tests)
router.post('/force', auth, stressAlertController.forceStressAlert);

// Obtenir l'historique du stress d'un élève
router.get('/history/:studentId', auth, stressAlertController.getStressHistory);

// Obtenir les statistiques de stress
router.get('/stats', auth, stressAlertController.getStressStats);

// Démarrer la surveillance automatique
router.post('/start-monitoring', auth, stressAlertController.startMonitoring);

// Simuler une augmentation progressive du stress
router.post('/simulate', auth, stressAlertController.simulateStressIncrease);

module.exports = router; 