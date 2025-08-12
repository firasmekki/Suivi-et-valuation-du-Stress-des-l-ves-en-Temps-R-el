const Admin = require('../models/Admin');

// Récupérer les informations d'un administrateur par ID
const getAdminById = async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // Vérifier que l'utilisateur demande ses propres informations
    if (req.user.id !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const admin = await Admin.findById(adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données'
    });
  }
};

// Récupérer le profil de l'administrateur connecté
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    console.log('Récupération du profil admin:', adminId);

    const admin = await Admin.findById(adminId)
      .select('-password')
      .lean();

    console.log('Données admin récupérées:', {
      id: admin?._id,
      nom: admin?.nom,
      email: admin?.email,
      lastLogin: admin?.lastLogin,
      createdAt: admin?.createdAt
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur non trouvé'
      });
    }

    // S'assurer que lastLogin est défini et valide
    if (!admin.lastLogin || admin.lastLogin > new Date()) {
      admin.lastLogin = new Date();
      // Mettre à jour la base de données
      await Admin.findByIdAndUpdate(adminId, { lastLogin: admin.lastLogin });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données'
    });
  }
};

// Mettre à jour les informations d'un administrateur par ID
const updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // Vérifier que l'utilisateur modifie ses propres informations
    if (req.user.id !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        $set: {
          nom: req.body.nom,
          email: req.body.email,
          lastLogin: new Date()
        }
      },
      { 
        new: true, 
        runValidators: true,
        timestamps: false // Désactiver la mise à jour automatique des timestamps
      }
    ).select('-password');

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des données'
    });
  }
};

// Mettre à jour le profil de l'administrateur connecté
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        $set: {
          nom: req.body.nom,
          email: req.body.email,
          lastLogin: new Date()
        }
      },
      { 
        new: true, 
        runValidators: true,
        timestamps: false // Désactiver la mise à jour automatique des timestamps
      }
    ).select('-password');

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Administrateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des données'
    });
  }
};

module.exports = {
  getAdminById,
  updateAdmin,
  getAdminProfile,
  updateAdminProfile
}; 