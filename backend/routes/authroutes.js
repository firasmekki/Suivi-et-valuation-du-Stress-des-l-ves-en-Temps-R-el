const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route de connexion
router.post('/login', authController.login);

// Route de changement de mot de passe
router.post('/change-password', authController.changePassword);

module.exports = router;
