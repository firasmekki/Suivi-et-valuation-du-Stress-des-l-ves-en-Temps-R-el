const { Classe, Eleve, Parent } = require('../models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../config/emailConfig');

// Fonction pour vérifier si un email existe déjà
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const eleve = await Eleve.findOne({ email });
    return res.status(200).json({
      success: true,
      exists: !!eleve
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email',
      error: error.message
    });
  }
};

// Fonction utilitaire pour gérer les chemins de fichiers
const getUploadPath = (filename) => {
  return path.join(__dirname, '..', 'uploads', 'photos', filename).replace(/\\/g, '/');
};

// Fonction utilitaire pour obtenir l'URL de la photo
const getPhotoUrl = (filename) => {
  return `/uploads/photos/${filename}`;
};

// 🔹 Créer un élève
exports.createEleve = async (req, res) => {
  let generatedPassword;  // Déclarer la variable en dehors du bloc else
  try {
    // Log détaillé des données reçues
    console.log('Données reçues:', {
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null
    });

    // Vérifier si le corps de la requête est vide
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée reçue',
        error: 'Le corps de la requête est vide'
      });
    }

    const {
      nom,
      prenom,
      dateNaissance,
      adresse,
      telephone,
      email,
      classe,
      horlogeId,
      parentNom,
      parentPrenom,
      parentAdresse,
      parentEmail,
      parentTelephone
    } = req.body;

    // Vérification des champs requis
    const requiredFields = [
      'nom', 'prenom', 'dateNaissance', 'adresse', 'telephone', 'email',
      'parentNom', 'parentPrenom', 'parentAdresse', 'parentEmail', 'parentTelephone'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      // Si une photo a été uploadée, la supprimer
      if (req.file) {
        try {
          fs.unlinkSync(getUploadPath(req.file.filename));
        } catch (unlinkErr) {
          console.error('Erreur lors de la suppression du fichier:', unlinkErr);
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Champs manquants',
        error: `Les champs suivants sont requis : ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !emailRegex.test(parentEmail)) {
      if (req.file) {
        try {
          fs.unlinkSync(getUploadPath(req.file.filename));
        } catch (unlinkErr) {
          console.error('Erreur lors de la suppression du fichier:', unlinkErr);
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide',
        error: !emailRegex.test(email) ? 'Email élève invalide' : 'Email parent invalide'
      });
    }

    // Vérifier si l'élève existe déjà par email
    let eleve = await Eleve.findOne({ email });
    if (eleve) {
      if (req.file) {
        try {
          fs.unlinkSync(getUploadPath(req.file.filename));
        } catch (unlinkErr) {
          console.error('Erreur lors de la suppression du fichier:', unlinkErr);
        }
      }
      return res.status(400).json({ 
        success: false,
        message: "Un élève avec cet email existe déjà." 
      });
    }

    // Vérifier si la classe existe
    if (classe) {
      const classeExist = await Classe.findById(classe);
      if (!classeExist) {
        if (req.file) {
          try {
            fs.unlinkSync(getUploadPath(req.file.filename));
          } catch (unlinkErr) {
            console.error('Erreur lors de la suppression du fichier:', unlinkErr);
          }
        }
        return res.status(404).json({ 
          success: false,
          message: "Classe non trouvée." 
        });
      }
    }

    // Vérifier si le parent existe déjà par email
    let existingParent = await Parent.findOne({ email: parentEmail });
    let parent;
    
    if (existingParent) {
      // Si le parent existe, mettre à jour ses informations
      existingParent.nom = parentNom;
      existingParent.prenom = parentPrenom;
      existingParent.telephone = parentTelephone;
      existingParent.adresse = parentAdresse;

      try {
        await existingParent.save();
        console.log('Informations du parent mises à jour:', {
          id: existingParent._id,
          email: existingParent.email,
          nom: existingParent.nom,
          prenom: existingParent.prenom
        });
        parent = existingParent;
      } catch (err) {
        console.error('Erreur lors de la mise à jour du parent:', err);
        throw err;
      }
    } else {
      // Créer un nouveau parent
      generatedPassword = Math.random().toString(36).slice(-8);  // Assigner la valeur ici
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      try {
        parent = new Parent({
          nom: parentNom,
          prenom: parentPrenom,
          adresse: parentAdresse,
          email: parentEmail,
          telephone: parentTelephone,
          password: hashedPassword,
          role: 'parent'
        });

        await parent.save();
        console.log('Nouveau parent créé avec succès:', {
          id: parent._id,
          email: parent.email,
          nom: parent.nom,
          prenom: parent.prenom
        });

        // Envoyer l'email avec le mot de passe temporaire
        try {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background-color: #7367f0;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
                }
                .content {
                  background-color: #f8f8f8;
                  padding: 20px;
                  border-radius: 0 0 5px 5px;
                }
                .info-box {
                  background-color: #fff;
                  border: 1px solid #ddd;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 5px;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Bienvenue sur notre plateforme de gestion scolaire</h1>
                </div>
                <div class="content">
                  <p>Cher/Chère ${parentNom} ${parentPrenom},</p>
                  
                  <p>Nous vous informons que le compte de votre enfant <strong>${prenom} ${nom}</strong> a été créé avec succès dans notre système de gestion scolaire.</p>
                  
                  <div class="info-box">
                    <h3>Vos identifiants de connexion :</h3>
                    <p><strong>Email :</strong> ${parentEmail}</p>
                    <p><strong>Mot de passe temporaire :</strong> ${generatedPassword}</p>
                  </div>
                  
                  <p><strong>Important :</strong> Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
                  
                  <p>Vous pouvez maintenant accéder à votre espace parent pour suivre la scolarité de votre enfant.</p>
                </div>
                <div class="footer">
                  <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail(
            parentEmail,
            'Bienvenue sur la plateforme de gestion scolaire - Informations de connexion',
            emailHtml
          );

          console.log('Email envoyé avec succès au parent');
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          // Ne pas bloquer la création si l'email échoue
        }
      } catch (err) {
        if (req.file) {
          try {
            fs.unlinkSync(getUploadPath(req.file.filename));
          } catch (unlinkErr) {
            console.error('Erreur lors de la suppression du fichier:', unlinkErr);
          }
        }
        throw err;
      }
    }

    // Créer l'élève
    const photoUrl = req.file ? getPhotoUrl(req.file.filename) : null;
    console.log('URL de la photo:', photoUrl);

    eleve = new Eleve({
      nom,
      prenom,
      dateNaissance,
      adresse,
      telephone,
      email,
      horlogeId,
      photo: photoUrl,
      classe,
      parent: parent._id
    });

    await eleve.save();
    console.log('Élève créé avec succès:', eleve);

    // Mettre à jour la classe pour y ajouter l'élève
    if (classe) {
      await Classe.findByIdAndUpdate(
        classe,
        { $addToSet: { eleves: eleve._id } }
      );
    }

    // Mettre à jour le parent pour y ajouter l'élève
    await Parent.findByIdAndUpdate(
        parent._id,
        { $addToSet: { enfants: eleve._id } }
    );

    // Récupérer l'élève avec les références peuplées
    const eleveComplet = await Eleve.findById(eleve._id)
      .populate('classe', 'niveau section')
      .populate('parent', 'nom prenom email telephone adresse');

    res.status(201).json({
      success: true,
      message: "Élève créé avec succès",
      data: eleveComplet,
      parentPassword: !existingParent ? generatedPassword : undefined
    });
  } catch (err) {
    console.error('Erreur détaillée:', err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la création de l'élève", 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// 🔍 Récupérer un élève par ID
exports.getEleveById = async (req, res) => {
  try {
    const eleve = await Eleve.findById(req.params.id)
      .populate('classe', 'niveau section')
      .populate('parent', 'nom prenom email telephone adresse');

    if (!eleve) {
      return res.status(404).json({ 
        success: false,
        message: "Élève non trouvé." 
      });
    }
    res.status(200).json({
      success: true,
      data: eleve
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération de l'élève", 
      error: err.message 
    });
  }
};

// 🔍 Récupérer tous les élèves
exports.getAllEleves = async (req, res) => {
  try {
    console.log('🔍 Récupération de tous les élèves')

    const eleves = await Eleve.find()
      .populate('classe', 'niveau section')
      .populate('parent', 'nom prenom email')
      .select('nom prenom email classe parent photo')

    console.log('📊 Statistiques:', {
      total: eleves.length,
      avecClasse: eleves.filter(e => e.classe).length,
      sansClasse: eleves.filter(e => !e.classe).length,
      avecParent: eleves.filter(e => e.parent).length,
      sansParent: eleves.filter(e => !e.parent).length
    })

    // Log détaillé pour chaque élève
    eleves.forEach((eleve, index) => {
      console.log(`\n👤 Élève ${index + 1}:`, {
        id: eleve._id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        email: eleve.email,
        classe: eleve.classe ? {
          id: eleve.classe._id,
          niveau: eleve.classe.niveau,
          section: eleve.classe.section
        } : 'Non assignée',
        parent: eleve.parent ? {
          id: eleve.parent._id,
          nom: eleve.parent.nom,
          prenom: eleve.parent.prenom
        } : 'Non assigné'
      })
    })

    res.status(200).json({
      success: true,
      count: eleves.length,
      data: eleves
    });
  } catch (err) {
    console.error('❌ Erreur lors de la récupération des élèves:', err);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des élèves", 
      error: err.message 
    });
  }
};

// 🔹 Mise à jour d'un élève
exports.updateEleve = async (req, res) => {
  try {
    const { 
      classe, 
      parentNom, 
      parentPrenom, 
      parentEmail, 
      parentAdresse, 
      parentTelephone,
      horlogeId,
      ...updateData 
    } = req.body;
    const eleveId = req.params.id;

    // Récupérer l'élève avant la mise à jour
    const eleveAvantUpdate = await Eleve.findById(eleveId)
      .populate('parent')
      .populate('classe');

    if (!eleveAvantUpdate) {
      if (req.file) {
        fs.unlinkSync(getUploadPath(req.file.filename));
      }
      return res.status(404).json({ 
        success: false,
        message: "Élève non trouvé." 
      });
    }

    // Mettre à jour les informations du parent
    if (eleveAvantUpdate.parent) {
      await Parent.findByIdAndUpdate(
        eleveAvantUpdate.parent._id,
        {
          nom: parentNom,
          prenom: parentPrenom,
          email: parentEmail,
          adresse: parentAdresse,
          telephone: parentTelephone
        },
        { new: true, runValidators: true }
      );
    }

    const oldClasseId = eleveAvantUpdate.classe ? eleveAvantUpdate.classe._id.toString() : null;
    const newClasseId = classe ? classe.toString() : oldClasseId;

    // Si une nouvelle photo est uploadée
    if (req.file) {
      // Supprimer l'ancienne photo si elle existe
      if (eleveAvantUpdate.photo) {
        const oldPhotoPath = path.join(__dirname, '..', 'uploads', 'photos', path.basename(eleveAvantUpdate.photo));
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.photo = getPhotoUrl(req.file.filename);
    }

    // Mettre à jour l'élève
    const updatedEleve = await Eleve.findByIdAndUpdate(
      eleveId,
      { ...updateData, classe: newClasseId, horlogeId },
      { new: true, runValidators: true }
    )
    .populate('classe', 'niveau section')
    .populate('parent', 'nom prenom email telephone adresse');

    // Gérer les changements de classe
    if (oldClasseId && oldClasseId !== newClasseId) {
      await Classe.findByIdAndUpdate(
        oldClasseId,
        { $pull: { eleves: eleveId } }
      );
    }
    if (newClasseId && oldClasseId !== newClasseId) {
      await Classe.findByIdAndUpdate(
        newClasseId,
        { $addToSet: { eleves: eleveId } }
      );
    }

    res.status(200).json({ 
      success: true,
      message: "Élève et parent mis à jour avec succès", 
      data: updatedEleve 
    });
  } catch (err) {
    console.error('Erreur détaillée:', err);
    if (req.file) {
      fs.unlinkSync(getUploadPath(req.file.filename));
    }
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la mise à jour de l'élève", 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// 🔹 Suppression d'un élève
exports.deleteEleve = async (req, res) => {
  try {
    const eleveToDelete = await Eleve.findById(req.params.id);
    if (!eleveToDelete) {
      return res.status(404).json({ 
        success: false,
        message: "Élève non trouvé." 
      });
    }

    // Supprimer la photo si elle existe
    if (eleveToDelete.photo) {
      const photoPath = getUploadPath(eleveToDelete.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Retirer l'élève de la classe associée
    if (eleveToDelete.classe) {
      await Classe.findByIdAndUpdate(
        eleveToDelete.classe,
        { $pull: { eleves: eleveToDelete._id } }
      );
    }

    // Supprimer l'élève
    await Eleve.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true,
      message: "Élève supprimé avec succès" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la suppression de l'élève", 
      error: err.message 
    });
  }
};

// 🔹 Lier un élève à un parent et un enseignant (Cette fonction n'est plus vraiment nécessaire avec le nouveau modèle)
// exports.linkEleve = async (req, res) => {
//   try {
//     const { eleveId, parentId, enseignantId } = req.body;

//     if (!eleveId || !parentId || !enseignantId) {
//       return res.status(400).json({ message: 'Tous les champs (élève, parent, enseignant) sont nécessaires.' });
//     }

//     const eleve = await Eleve.findById(eleveId);
//     if (!eleve) return res.status(404).json({ message: "Élève non trouvé" });

//     const parent = await Parent.findById(parentId);
//     if (!parent) return res.status(404).json({ message: "Parent non trouvé" });

//     const enseignant = await Enseignant.findById(enseignantId);
//     if (!enseignant) return res.status(404).json({ message: "Enseignant non trouvé" });

//     eleve.parent = parent._id;
//     eleve.enseignant = enseignant._id;

//     await eleve.save();

//     res.status(200).json({ message: "Élève lié avec succès", eleve });
//   } catch (err) {
//     res.status(500).json({ message: "Erreur serveur", error: err.message });
//   }
// };

// Rechercher des élèves
exports.searchEleves = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Le terme de recherche est requis' });
    }

    const searchRegex = new RegExp(q, 'i');
    const eleves = await Eleve.find({
      $or: [
        { nom: searchRegex },
        { prenom: searchRegex },
        { email: searchRegex }
      ]
    })
    .populate('classe', 'niveau')
    .select('nom prenom email classe')
    .limit(10);

    res.json(eleves);
  } catch (error) {
    console.error('Erreur lors de la recherche des élèves:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la recherche des élèves',
      error: error.message 
    });
  }
};
