// routes/classeRoutes.js ✅ CORRECT
const express = require('express');
const router = express.Router();
const classeController = require('../controllers/classeController');
const { auth, checkRole } = require('../middleware/auth');
const Classe = require('../models/Classe');

// Route pour mettre à jour la numérotation (doit être avant les routes avec :id)
router.post('/update-numbering', classeController.updateClassesNumbering);

// Routes CRUD de base
router.post('/', classeController.createClasse);
router.get('/', classeController.getAllClasses);
router.get('/:id', classeController.getClasseById);
router.put('/:id', classeController.updateClasse);
router.delete('/:id', classeController.deleteClasse);

// Routes pour la gestion des enseignants
router.post('/:id/enseignants', classeController.addEnseignant);
router.delete('/:id/enseignants/:enseignantId', classeController.removeEnseignant);

// Nouvelle route pour récupérer les élèves d'une classe
router.get('/:id/eleves', auth, checkRole(['admin', 'enseignant']), classeController.getElevesByClasse);

module.exports = router; // ✅ ne pas oublier cette ligne !
