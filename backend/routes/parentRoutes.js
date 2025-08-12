const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { auth, checkRole } = require('../middleware/auth');

// Route pour récupérer le profil du parent connecté
router.get('/profile', auth, checkRole(['parent']), parentController.getParentProfile);

// Route pour réinitialiser les emails envoyés (pour les tests)
router.post('/reset-emails', auth, checkRole(['admin']), parentController.resetSentEmails);

// Route pour récupérer les enfants du parent connecté
router.get('/:id/enfants', auth, (req, res, next) => {
  // Allow access if user is admin or if user is accessing their own data
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
}, parentController.getElevesByParent);

// Routes protégées pour l'administrateur
router.get('/', auth, checkRole(['admin']), parentController.getAllParents);
router.get('/search', auth, checkRole(['admin']), parentController.searchParents);
router.get('/:id', auth, checkRole(['admin']), parentController.getParentById);
router.put('/:id', auth, checkRole(['admin']), parentController.updateParent);
router.delete('/:id', auth, checkRole(['admin']), parentController.deleteParent);
router.post('/', auth, checkRole(['admin']), parentController.createParent);

module.exports = router;