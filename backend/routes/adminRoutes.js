const express = require('express');
const router = express.Router();
const { getAdminById, updateAdmin, getAdminProfile, updateAdminProfile } = require('../controllers/adminController');
const { getStats, getStressStats, getRecentActivity, getAlerts, getClassStats, predictStressLevel } = require('../controllers/statsController');
const { auth, checkRole } = require('../middleware/auth');

// Routes protégées pour l'administrateur
router.get('/stats', auth, checkRole(['admin']), getStats);
router.get('/stress-stats', auth, checkRole(['admin']), getStressStats);
router.get('/recent-activity', auth, checkRole(['admin']), getRecentActivity);
router.get('/alerts', auth, checkRole(['admin']), getAlerts);
router.get('/class-stats', auth, checkRole(['admin']), getClassStats);
router.get('/predict-stress/:studentId', auth, checkRole(['admin']), predictStressLevel);
router.get('/profile', auth, checkRole(['admin']), getAdminProfile);
router.put('/profile', auth, checkRole(['admin']), updateAdminProfile);
router.get('/:id', auth, checkRole(['admin']), getAdminById);
router.put('/:id', auth, checkRole(['admin']), updateAdmin);

module.exports = router; 