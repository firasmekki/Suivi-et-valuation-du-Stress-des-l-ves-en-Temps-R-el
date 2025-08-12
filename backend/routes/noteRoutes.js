const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const {
  getNotesByClasse,
  createOrUpdateNote,
  getNotesByEtudiant,
  deleteNote
} = require('../controllers/noteController');

// Route pour récupérer les notes d'une classe
router.route('/classe/:classeId')
  // .get(auth, checkRole(['admin', 'enseignant']), getNotesByClasse)
  .get(getNotesByClasse);

// Route pour récupérer les notes d'un étudiant
router.route('/etudiant/:etudiantId')
  .get(auth, checkRole(['admin', 'enseignant']), getNotesByEtudiant);

// Route pour créer/mettre à jour une note
router.route('/')
  // .post(auth, checkRole(['admin', 'enseignant']), createOrUpdateNote);
  .post(createOrUpdateNote);

// Route pour supprimer une note (admin uniquement)
router.route('/:id')
  .delete(auth, checkRole(['admin']), deleteNote);

module.exports = router; 