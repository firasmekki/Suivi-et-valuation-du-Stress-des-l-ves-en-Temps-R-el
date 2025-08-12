const express = require('express');
const router = express.Router();
const enseignantController = require('../controllers/enseignantController');
const { auth, checkRole } = require('../middleware/auth');

// Route de recherche (doit être avant la route :id pour éviter les conflits)
router.get('/search', auth, checkRole(['admin']), enseignantController.searchEnseignants);

// Routes CRUD de base
router.get('/', auth, checkRole(['admin']), enseignantController.getAllEnseignants);
router.post('/', auth, checkRole(['admin']), enseignantController.createEnseignant);

// Modified route to allow teachers to access their own data
router.get('/:id', auth, (req, res, next) => {
  // Allow access if user is admin or if user is accessing their own data
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
}, enseignantController.getEnseignantById);

router.put('/:id', auth, checkRole(['admin']), enseignantController.updateEnseignant);
router.delete('/:id', auth, checkRole(['admin']), enseignantController.deleteEnseignant);

// Routes spécifiques
router.get('/:id/eleves', auth, enseignantController.getElevesByEnseignant);
router.get('/:id/classes', auth, enseignantController.getClassesByEnseignant);

// Routes temporaires pour les tests
router.get('/', auth, (req, res) => {
  res.json({ message: 'Liste des enseignants' });
});

router.post('/', auth, (req, res) => {
  res.json({ message: 'Enseignant créé' });
});

module.exports = router;
