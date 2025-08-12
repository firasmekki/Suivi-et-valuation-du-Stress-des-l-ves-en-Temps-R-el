// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');  // Extraire le token du header

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Ajoute les données utilisateur décodées dans la requête
    next();  // Passe à la prochaine étape
  } catch (err) {
    res.status(400).json({ message: 'Invalid token', error: err });
  }
};

module.exports = verifyToken;
