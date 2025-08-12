const express = require('express');
const router = express.Router();
const multer = require('multer');
const eleveController = require('../controllers/eleveController'); // Assure-toi que ce fichier existe et que les fonctions sont bien exportées.
const upload = require('../config/multer');

// Middleware de gestion d'erreur pour multer
const handleMulterError = (err, req, res, next) => {
  console.error('Multer Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux. Taille maximum: 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'upload du fichier',
      error: err.message
    });
  }
  
  if (err.message === 'Le fichier doit être une image') {
    return res.status(400).json({
      success: false,
      message: 'Le fichier doit être une image (JPG, PNG, GIF, HEIC, WEBP)'
    });
  }
  
  next(err);
};

// Middleware pour logger les requêtes
const logRequest = (req, res, next) => {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  if (req.file) {
    console.log('Uploaded File:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  }
  next();
};

// 🔹 Routes principales
router.get('/getalleleves', eleveController.getAllEleves);
router.get('/getelevebyid/:id', eleveController.getEleveById);
router.get('/check-email/:email', eleveController.checkEmail);
router.get('/search', eleveController.searchEleves);

// Route de création avec logging
router.post('/createeleve', 
  logRequest,
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('Upload Error:', err);
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  eleveController.createEleve
);

router.put('/updateeleve/:id', upload.single('photo'), handleMulterError, eleveController.updateEleve);
router.delete('/deleteeleve/:id', eleveController.deleteEleve);

// 🔹 Route pour lier un élève à un parent et un enseignant (Commenter ou supprimer si la fonction linkEleve n'est plus utilisée)
// router.post('/linkeleve', eleveController.linkEleve); // Assure-toi que tu utilises la bonne fonction (linkEleve)

module.exports = router;
