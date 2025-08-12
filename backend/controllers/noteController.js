const Note = require('../models/Note');
const Etudiant = require('../models/Etudiant');
const Classe = require('../models/Classe');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get notes by class
// @route   GET /api/notes/classe/:classeId
// @access  Private
const getNotesByClasse = asyncHandler(async (req, res) => {
  try {
    console.log('=== DÉBUT RÉCUPÉRATION NOTES ===');
    console.log('ID Classe reçu:', req.params.classeId);
    
    const classeId = req.params.classeId;
    console.log('Recherche des notes pour la classe:', classeId);

    // Test direct de la requête MongoDB
    console.log('=== TEST REQUÊTE MONGODB ===');
    const allNotes = await Note.find({});
    console.log('Toutes les notes dans la DB:', allNotes.length);
    console.log('Première note:', allNotes[0]);
    
    // Test de la requête avec l'ID de classe
    const testQuery = await Note.find({ classe: classeId });
    console.log('Notes trouvées avec requête directe:', testQuery.length);
    console.log('Résultat de la requête directe:', testQuery);

    // Récupérer toutes les notes de la classe
    const notes = await Note.find({ classe: classeId })
      .populate('etudiant', 'nom prenom')
      .populate({
        path: 'enseignant',
        select: 'nom prenom',
        model: 'User',
        strictPopulate: false
      });

    console.log('Notes trouvées:', notes);

    // Diagnostic détaillé du populate
    console.log('=== DIAGNOSTIC POPULATE ===');
    notes.forEach((note, index) => {
      console.log(`Note ${index + 1}:`, {
        noteId: note._id,
        etudiantId: note.etudiant,
        etudiantType: typeof note.etudiant,
        etudiantIsObject: note.etudiant && typeof note.etudiant === 'object',
        etudiantNom: note.etudiant?.nom,
        etudiantPrenom: note.etudiant?.prenom
      });
    });

    // Vérifier si les étudiants existent dans la collection Etudiant
    const etudiantIds = notes.map(note => note.etudiant).filter(id => id);
    console.log('IDs étudiants à vérifier:', etudiantIds);
    
    if (etudiantIds.length > 0) {
      const etudiantsExistant = await Etudiant.find({ _id: { $in: etudiantIds } });
      console.log('Étudiants trouvés dans la DB:', etudiantsExistant.length);
      console.log('Étudiants existants:', etudiantsExistant.map(e => ({ id: e._id, nom: e.nom, prenom: e.prenom })));
    }

    // Retourner toutes les notes, même celles avec etudiant null
    console.log('=== FIN RÉCUPÉRATION NOTES ===');

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('=== ERREUR RÉCUPÉRATION NOTES ===');
    console.error('Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      params: req.params
    });
    console.error('=== FIN ERREUR ===');
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes',
      error: error.message
    });
  }
});

const toObjectId = (id) => {
  if (!id) return undefined;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(id);
};

// @desc    Create or update note
// @route   POST /api/notes
// @access  Private
const createOrUpdateNote = asyncHandler(async (req, res) => {
  console.log('==============================');
  console.log('=== [DEBUG] POST /api/notes ===');
  console.log('Headers:', req.headers);
  console.log('Body reçu:', req.body);
  console.log('==============================');
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('Aucun body reçu dans la requête POST /api/notes');
    return res.status(400).json({ success: false, message: 'Aucun corps reçu par le backend' });
  }
  try {
    console.log('=== DÉBUT CRÉATION/MISE À JOUR NOTE ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    console.log('Body reçu:', req.body);
    
    // Accepter tous les formats
    let { classe, etudiant, matiere, controle, examen, type, note } = req.body;

    // Mapping ultra-tolérant
    if ((!controle && !examen) && type && note !== undefined) {
      if (type === 'controle') controle = { note };
      if (type === 'examen') examen = { note };
    }
    // Si controle ou examen est un nombre direct, transformer en objet
    if (typeof controle === 'number') controle = { note: controle };
    if (typeof examen === 'number') examen = { note: examen };

    // Forcer la conversion en ObjectId
    classe = toObjectId(classe);
    etudiant = toObjectId(etudiant);

    // Vérification des champs requis
    if (!classe || !etudiant || !matiere) {
      console.error('Champs manquants:', { classe, etudiant, matiere });
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants (classe, etudiant, matiere)'
      });
    }
    if (!controle && !examen) {
      console.error('Aucune note fournie (controle ou examen)');
      return res.status(400).json({
        success: false,
        message: 'Aucune note fournie (controle ou examen)'
      });
    }

    // Vérifier si la note existe déjà
    let noteDoc = await Note.findOne({ classe, etudiant, matiere });
    console.log('Note existante trouvée:', noteDoc);

    if (noteDoc) {
      if (controle !== undefined) {
        noteDoc.controle = {
          note: parseFloat(controle.note || controle),
          appreciation: controle.appreciation || noteDoc.controle?.appreciation || ''
        };
      }
      if (examen !== undefined) {
        noteDoc.examen = {
          note: parseFloat(examen.note || examen),
          appreciation: examen.appreciation || noteDoc.examen?.appreciation || ''
        };
      }
      noteDoc.enseignant = req.user ? req.user.id : null;
    } else {
      const noteData = {
        classe,
        etudiant,
        matiere,
        enseignant: req.user ? req.user.id : null
      };
      if (controle !== undefined) {
        noteData.controle = {
          note: parseFloat(controle.note || controle),
          appreciation: controle.appreciation || ''
        };
      }
      if (examen !== undefined) {
        noteData.examen = {
          note: parseFloat(examen.note || examen),
          appreciation: examen.appreciation || ''
        };
      }
      noteDoc = new Note(noteData);
    }

    console.log('Note à sauvegarder:', noteDoc);
    await noteDoc.save();
    console.log('Note sauvegardée avec succès');

    const updatedNote = await Note.findById(noteDoc._id)
      .populate('etudiant', 'nom prenom')
      .populate({
        path: 'enseignant',
        select: 'nom prenom',
        model: 'User',
        strictPopulate: false
      });

    res.status(201).json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    console.error('=== ERREUR CRÉATION/MISE À JOUR NOTE ===');
    console.error('Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      data: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création/mise à jour de la note',
      error: error.message
    });
  }
});

// @desc    Get notes by student
// @route   GET /api/notes/etudiant/:etudiantId
// @access  Private
const getNotesByEtudiant = asyncHandler(async (req, res) => {
  const { etudiantId } = req.params;
  
  const notes = await Note.find({ etudiant: etudiantId })
    .populate('classe', 'nom')
    .sort({ 'classe.nom': 1 });

  res.status(200).json({
    success: true,
    data: notes
  });
});

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await Note.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Note supprimée avec succès'
  });
});

module.exports = {
  getNotesByClasse,
  createOrUpdateNote,
  getNotesByEtudiant,
  deleteNote
}; 