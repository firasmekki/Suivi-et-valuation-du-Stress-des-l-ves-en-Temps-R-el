const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Assurer que le dossier uploads existe
const uploadDir = path.join(__dirname, '..', 'uploads', 'photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Convertir HEIC en jpg pour la compatibilité
    const extension = file.originalname.toLowerCase().endsWith('.heic') ? '.jpg' : path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtre pour accepter les images, y compris HEIC
const fileFilter = (req, file, cb) => {
  console.log('File received:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/heic',
    'image/heif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype.toLowerCase()) || 
      file.originalname.toLowerCase().endsWith('.heic')) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('INVALID_FILE_TYPE', 'Le fichier doit être une image (JPG, PNG, GIF, HEIC, WEBP)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite augmentée à 10MB pour les fichiers HEIC
  }
});

module.exports = upload; 