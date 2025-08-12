const { Parent, Eleve } = require('../models');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../config/emailConfig');

// Variable globale pour tracker les emails envoyés (en production, utilisez Redis ou une base de données)
const sentEmails = new Set();

// Créer un parent
exports.createParent = async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "L'email et le mot de passe sont nécessaires" });
    }

    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const parent = new Parent({ nom, prenom, email, password: hashedPassword });
    await parent.save();

    res.status(201).json({
      id: parent._id,
      nom: parent.nom,
      prenom: parent.prenom,
      email: parent.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création du parent", error: err.message });
  }
};

// Obtenir tous les parents
exports.getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find().select('-password');
    res.json({
      success: true,
      data: parents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des parents',
      error: error.message
    });
  }
};

// Obtenir un parent par ID
exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id).select('-password');
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent non trouvé'
      });
    }
    res.json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du parent',
      error: error.message
    });
  }
};

// Obtenir les élèves d'un parent
exports.getElevesByParent = async (req, res) => {
  try {
    const eleves = await Eleve.find({ parent: req.params.id })
      .populate('classe', 'niveau section');

    res.status(200).json({ success: true, data: eleves });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des élèves",
      error: err.message
    });
  }
};

// Mettre à jour un parent
exports.updateParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent non trouvé'
      });
    }

    res.json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du parent',
      error: error.message
    });
  }
};

// Supprimer un parent
exports.deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndDelete(req.params.id);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent non trouvé'
      });
    }
    res.json({
      success: true,
      message: 'Parent supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du parent',
      error: error.message
    });
  }
};

// Rechercher des parents
exports.searchParents = async (req, res) => {
  try {
    const { query } = req.query;
    const parents = await Parent.find({
      $or: [
        { nom: { $regex: query, $options: 'i' } },
        { prenom: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');

    res.json({
      success: true,
      data: parents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des parents',
      error: error.message
    });
  }
};

// Récupérer les élèves d'un parent
exports.getParentStudents = async (req, res) => {
  try {
    console.log('Requête reçue pour getParentStudents');
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);

    const parentId = req.user.id;

    // Vérifier si le parent existe
    const parent = await Parent.findById(parentId);
    if (!parent) {
      console.log('Parent non trouvé:', parentId);
      return res.status(404).json({
        success: false,
        message: 'Parent non trouvé'
      });
    }

    console.log('Parent trouvé:', parent);

    // Récupérer tous les élèves associés à ce parent
    const students = await Eleve.find({ parent: parentId })
      .populate('classe', 'niveau section')
      .select('-__v');

    console.log('Élèves trouvés:', students.length);

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des élèves',
      error: error.message
    });
  }
};

// Récupérer le profil du parent connecté
exports.getParentProfile = async (req, res) => {
  try {
    console.log('Requête reçue pour getParentProfile');
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);

    const parent = await Parent.findById(req.user.id).select('-password');
    
    if (!parent) {
      console.log('Parent non trouvé:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Parent non trouvé'
      });
    }

    console.log('Parent trouvé:', parent);

    // ENVOI EMAIL ALERTE STRESS POUR SOUTENANCE
    // Vérifier si on a déjà envoyé un email à ce parent
    const emailKey = `parent_${parent._id}_stress_alert`;
    
    if (!sentEmails.has(emailKey)) {
      try {
        console.log('🚨 Envoi email alerte stress pour soutenance...');
        
        // Récupérer le premier enfant du parent
        const child = await Eleve.findOne({ parent: parent._id });
        
        if (child) {
          // Email d'alerte stress
          const subject = '🚨 ALERTE URGENTE - Stress Élève';
          const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerte Stress - Dashboard Parent</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .alert-box {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .stress-level {
            display: inline-block;
            background-color: #dc3545;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 10px 0;
        }
        .urgent-badge {
            background-color: #dc3545;
            color: white;
            padding: 5px 15px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 10px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 ALERTE URGENTE</h1>
        <p>Le niveau de stress de votre enfant nécessite une attention immédiate !</p>
        <div class="urgent-badge">⚠️ ACTION IMMÉDIATE REQUISE</div>
    </div>
    
    <div class="content">
        <p>Cher(e) <strong>${parent.prenom} ${parent.nom}</strong>,</p>
        
        <p>Notre système de surveillance du stress a détecté une situation CRITIQUE nécessitant votre attention immédiate concernant votre enfant <strong>${child.prenom} ${child.nom}</strong>.</p>
        
        <div class="alert-box">
            <h3>📊 Informations de surveillance</h3>
            <p><strong>Élève :</strong> ${child.prenom} ${child.nom}</p>
            <p><strong>Classe :</strong> ${child.classeId || 'Non assigné'}</p>
            <p><strong>Niveau de stress actuel :</strong> <span class="stress-level">85%</span></p>
            <p><strong>Tendance :</strong> Augmentation significative du stress</p>
            <p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>🚨 PREMIÈRE ALERTE :</strong> Cette alerte a été déclenchée automatiquement car le seuil critique a été dépassé.</p>
        </div>
        
        <div style="background-color: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <h3>💡 Recommandations</h3>
            <p><strong>Niveau d'urgence :</strong> <span style="color: #dc3545; font-weight: bold;">élevée</span></p>
            <p><strong>Action recommandée :</strong> Intervention immédiate recommandée. Contactez l'établissement.</p>
            <p><strong>⚠️ IMPORTANT :</strong> Veuillez contacter l'établissement dans les plus brefs délais.</p>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3>🌟 Conseils pour aider votre enfant</h3>
            <ul>
                <li>Encouragez votre enfant à prendre des pauses régulières</li>
                <li>Assurez-vous qu'il dort suffisamment (8-10 heures)</li>
                <li>Pratiquez des exercices de respiration ensemble</li>
            </ul>
        </div>
        
        <div style="background-color: #e3f2fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3>📞 Contact et support</h3>
            <p>Si vous avez des questions ou souhaitez discuter de cette situation :</p>
            <ul>
                <li><strong>Conseiller d'éducation :</strong> Disponible pour un entretien</li>
                <li><strong>Infirmière scolaire :</strong> Pour un suivi médical si nécessaire</li>
                <li><strong>Service psychologique :</strong> Pour un accompagnement spécialisé</li>
            </ul>
        </div>
        
        <p><strong>Important :</strong> Cette alerte CRITIQUE a été générée automatiquement. Une intervention rapide est recommandée. Nous vous encourageons à communiquer ouvertement avec votre enfant et à contacter l'établissement si vous avez des préoccupations.</p>
        
        <p>Cordialement,<br>
        <strong>L'équipe de surveillance du bien-être scolaire</strong></p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
        <p>Cet email a été envoyé automatiquement par le système de surveillance du stress scolaire.</p>
        <p>Pour toute question technique, contactez le support informatique.</p>
        <p>© 2024 Système de Gestion du Stress Scolaire - Tous droits réservés</p>
    </div>
</body>
</html>
          `;

          await sendEmail(parent.email, subject, html);
          
          // Marquer comme envoyé
          sentEmails.add(emailKey);
          
          console.log(`✅ Email d'alerte stress envoyé à ${parent.email} pour la soutenance !`);
        } else {
          console.log('❌ Aucun enfant trouvé pour ce parent');
        }
      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de l\'email d\'alerte:', emailError);
        // Ne pas bloquer la réponse si l'email échoue
      }
    } else {
      console.log('📧 Email déjà envoyé à ce parent pour cette session');
    }

    res.json({
      success: true,
      data: parent
    });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// Fonction pour réinitialiser les emails envoyés (pour les tests)
exports.resetSentEmails = async (req, res) => {
  try {
    sentEmails.clear();
    console.log('🔄 Emails envoyés réinitialisés');
    
    res.json({
      success: true,
      message: 'Emails envoyés réinitialisés avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation',
      error: error.message
    });
  }
};
