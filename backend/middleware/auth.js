const jwt = require('jsonwebtoken')
require('dotenv').config()

const auth = (req, res, next) => {
  try {
    console.log('\n=== MIDDLEWARE AUTH ===');
    console.log('Headers:', {
      ...req.headers,
      authorization: req.headers.authorization ? 'Bearer [PRÉSENT]' : '[ABSENT]'
    });
    
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token non fourni ou format invalide');
      return res.status(401).json({
        success: false,
        message: 'Token non fourni'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extrait:', token.substring(0, 20) + '...');

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    console.log('✅ User info ajoutée à la requête:', req.user);
    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide',
      error: error.message
    });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    console.log('\n=== MIDDLEWARE CHECK ROLE ===');
    console.log('Rôles requis:', roles);
    console.log('Rôle de l\'utilisateur:', req.user?.role);
    
    if (!req.user) {
      console.log('❌ Utilisateur non authentifié');
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Accès non autorisé pour le rôle:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    console.log('✅ Accès autorisé pour le rôle:', req.user.role);
    next();
  };
};

module.exports = { auth, checkRole }; 