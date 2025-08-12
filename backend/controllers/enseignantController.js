const { Enseignant, Eleve, Classe } = require('../models');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../config/emailConfig');

// Créer un enseignant
exports.createEnseignant = async (req, res) => {
  try {
    const { nom, prenom, dateNaissance, matiere, adresse, telephone, email, classes } = req.body;
    console.log('📥 Données reçues pour la création:', {
      nom, prenom, dateNaissance, matiere, adresse, telephone, email,
      classes: Array.isArray(classes) ? classes : 'Non défini'
    });

    // Vérifier si l'enseignant existe déjà par email
    let enseignant = await Enseignant.findOne({ email });
    if (enseignant) {
      return res.status(400).json({
        success: false,
        message: "Un enseignant avec cet email existe déjà"
      });
    }

    // Générer un mot de passe temporaire
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Vérifier que les classes existent
    if (Array.isArray(classes) && classes.length > 0) {
      console.log('🔍 Vérification des classes:', classes);
      const existingClasses = await Classe.find({ _id: { $in: classes } });
      console.log('📚 Classes trouvées:', existingClasses);

      if (existingClasses.length !== classes.length) {
        console.log('❌ Certaines classes n\'existent pas');
        return res.status(400).json({
          success: false,
          message: "Certaines classes spécifiées n'existent pas"
        });
      }
    }

    // Créer l'enseignant
    enseignant = new Enseignant({
      nom,
      prenom,
      dateNaissance,
      matiere,
      adresse,
      telephone,
      email,
      password: hashedPassword,
      classes: classes || []
    });

    console.log('👤 Enseignant avant sauvegarde:', {
      ...enseignant.toObject(),
      password: '[MASQUÉ]'
    });

    await enseignant.save();

    // Si des classes sont spécifiées, les mettre à jour
    if (Array.isArray(classes) && classes.length > 0) {
      console.log('📚 Mise à jour des classes:', classes);
      
      // Ajouter l'enseignant aux classes spécifiées
      await Classe.updateMany(
        { _id: { $in: classes } },
        { $addToSet: { enseignants: enseignant._id } }
      );

      // Vérifier les classes après mise à jour
      const updatedClasses = await Classe.find({ 
        _id: { $in: classes } 
      }).select('niveau section');
      console.log('📚 Classes après mise à jour:', updatedClasses);
    }

    // Récupérer l'enseignant avec ses classes pour la réponse
    const savedEnseignant = await Enseignant.findById(enseignant._id)
      .populate('classes', 'niveau section');
    console.log('👤 Enseignant après sauvegarde avec classes:', savedEnseignant);

    // Préparer et envoyer l'email
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
            <h1>Bienvenue dans notre établissement</h1>
          </div>
          <div class="content">
            <p>Cher/Chère ${prenom} ${nom},</p>
            
            <p>Votre compte enseignant a été créé avec succès dans notre système de gestion scolaire.</p>
            
            <div class="info-box">
              <h3>Vos identifiants de connexion :</h3>
              <p><strong>Email :</strong> ${email}</p>
              <p><strong>Mot de passe temporaire :</strong> ${temporaryPassword}</p>
            </div>
            
            <p><strong>Important :</strong> Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
            
            <p>Vous pouvez maintenant accéder à votre espace enseignant pour gérer vos classes et suivre vos élèves.</p>
          </div>
          <div class="footer">
            <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let emailSent = false;
    try {
      await sendEmail(
        email,
        'Bienvenue - Vos identifiants de connexion',
        emailHtml
      );
      emailSent = true;
      console.log('Email envoyé avec succès à l\'enseignant');
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Ne pas bloquer la création si l'email échoue
    }

    res.status(201).json({
      success: true,
      message: "Enseignant créé avec succès",
      details: {
        title: `✓ L'enseignant ${nom} ${prenom} a été créé avec succès.`,
        emailStatus: emailSent ? 
          `Un email contenant les informations de connexion a été envoyé à : ${email}` :
          "L'envoi de l'email a échoué. Veuillez contacter l'administrateur.",
        temporaryPassword: temporaryPassword,
        nextSteps: [
          "L'enseignant doit vérifier sa boîte email pour recevoir ses identifiants de connexion",
          "Lors de la première connexion, il devra changer son mot de passe temporaire",
          "Une fois connecté, il pourra accéder à son espace enseignant et gérer ses classes"
        ]
      },
      enseignant: {
        id: savedEnseignant._id,
        nom: savedEnseignant.nom,
        prenom: savedEnseignant.prenom,
        dateNaissance: savedEnseignant.dateNaissance,
        matiere: savedEnseignant.matiere,
        adresse: savedEnseignant.adresse,
        telephone: savedEnseignant.telephone,
        email: savedEnseignant.email
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'enseignant",
      error: err.message
    });
  }
};

// Obtenir tous les enseignants
exports.getAllEnseignants = async (req, res) => {
  try {
    const enseignants = await Enseignant.find()
      .populate('classes', 'niveau section');
    
    res.status(200).json({
      success: true,
      count: enseignants.length,
      data: enseignants
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des enseignants",
      error: err.message
    });
  }
};

// Obtenir un enseignant par ID
exports.getEnseignantById = async (req, res) => {
  try {
    console.log('🔍 Recherche de l\'enseignant:', req.params.id);

    const enseignant = await Enseignant.findById(req.params.id)
      .populate({
        path: 'classes',
        select: 'niveau section',
        model: 'Classe'
      });

    if (!enseignant) {
      console.log('❌ Enseignant non trouvé');
      return res.status(404).json({
        success: false,
        message: "Enseignant non trouvé"
      });
    }

    console.log('👤 Enseignant trouvé:', {
      id: enseignant._id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      classes: enseignant.classes
    });

    // Vérifier aussi les classes qui ont cet enseignant
    const classesWithTeacher = await Classe.find({
      enseignants: enseignant._id
    }).select('niveau section');

    console.log('📚 Classes qui référencent cet enseignant:', classesWithTeacher);

    // Fusionner les classes de l'enseignant avec celles qui le référencent
    const allClasses = [...new Set([
      ...(enseignant.classes || []),
      ...classesWithTeacher
    ])];

    // Créer une copie de l'enseignant pour la réponse
    const enseignantResponse = enseignant.toObject();
    enseignantResponse.classes = allClasses;

    console.log('📤 Données envoyées:', {
      ...enseignantResponse,
      password: '[MASQUÉ]'
    });

    res.status(200).json({
      success: true,
      data: enseignantResponse
    });
  } catch (err) {
    console.error('❌ Erreur lors de la récupération:', err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'enseignant",
      error: err.message
    });
  }
};

// Mettre à jour un enseignant
exports.updateEnseignant = async (req, res) => {
  try {
    const { nom, prenom, dateNaissance, matiere, adresse, telephone, email, classes } = req.body;
    console.log('📝 Mise à jour de l\'enseignant:', req.params.id);
    console.log('📚 Classes reçues:', classes);

    // 1. Vérifier si l'enseignant existe
    const enseignant = await Enseignant.findById(req.params.id);
    if (!enseignant) {
      console.log('❌ Enseignant non trouvé');
      return res.status(404).json({
        success: false,
        message: "Enseignant non trouvé"
      });
    }

    // 2. Mettre à jour les informations de base de l'enseignant
    enseignant.nom = nom;
    enseignant.prenom = prenom;
    enseignant.dateNaissance = dateNaissance;
    enseignant.matiere = matiere;
    enseignant.adresse = adresse;
    enseignant.telephone = telephone;
    enseignant.email = email;

    // 3. Gérer les classes
    if (Array.isArray(classes)) {
      console.log('🔄 Mise à jour des classes');
      console.log('📋 Anciennes classes:', await Classe.find({ enseignants: enseignant._id }).select('_id niveau section'));

      // Retirer l'enseignant de toutes ses anciennes classes
      await Classe.updateMany(
        { enseignants: enseignant._id },
        { $pull: { enseignants: enseignant._id } }
      );

      // Mettre à jour les classes de l'enseignant
      enseignant.classes = classes;

      // Ajouter l'enseignant aux nouvelles classes
      if (classes.length > 0) {
        console.log('➕ Ajout aux nouvelles classes:', classes);
        await Classe.updateMany(
          { _id: { $in: classes } },
          { $addToSet: { enseignants: enseignant._id } }
        );
      }

      // Vérifier les classes après mise à jour
      const updatedClasses = await Classe.find({ enseignants: enseignant._id }).select('_id niveau section');
      console.log('📋 Nouvelles classes après mise à jour:', updatedClasses);
    }

    // 4. Sauvegarder l'enseignant
    await enseignant.save();

    // 5. Récupérer l'enseignant mis à jour avec ses classes
    const updatedEnseignant = await Enseignant.findById(req.params.id)
      .populate('classes', 'niveau section');

    res.status(200).json({
      success: true,
      message: "Enseignant mis à jour avec succès",
      data: updatedEnseignant
    });
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour:', err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'enseignant",
      error: err.message
    });
  }
};

// Supprimer un enseignant
exports.deleteEnseignant = async (req, res) => {
  try {
    const enseignant = await Enseignant.findById(req.params.id);
    if (!enseignant) {
      return res.status(404).json({
        success: false,
        message: "Enseignant non trouvé"
      });
    }

    // Retirer l'enseignant de toutes ses classes
    await Promise.all(
      enseignant.classes.map(async (classeId) => {
        await Classe.findByIdAndUpdate(
          classeId,
          { $pull: { enseignants: enseignant._id } }
        );
      })
    );

    await Enseignant.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Enseignant supprimé avec succès"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'enseignant",
      error: err.message
    });
  }
};

// 🔍 Obtenir les élèves liés à un enseignant
exports.getElevesByEnseignant = async (req, res) => {
  try {
    const eleves = await Eleve.find({ enseignants: req.params.id }); // Utiliser enseignants: ID_enseignant
    res.status(200).json(eleves);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// 🔍 Obtenir les classes d'un enseignant
exports.getClassesByEnseignant = async (req, res) => {
  try {
    const teacherId = req.params.id;
    console.log('🔍 Recherche des classes pour l\'enseignant:', teacherId);

    // Rechercher directement toutes les classes où l'enseignant est listé
    const classes = await Classe.find({
      enseignants: teacherId
    })
    .select('niveau section enseignants eleves')
    .populate('eleves', 'nom prenom')
    .populate('enseignants', 'nom prenom _id');

    // Log détaillé pour chaque classe
    classes.forEach((classe, index) => {
      console.log(`\n📚 Détails de la classe ${index + 1}:`)
      console.log('ID:', classe._id)
      console.log('Niveau:', classe.niveau)
      console.log('Section:', classe.section)
      console.log('Élèves:', {
        count: classe.eleves?.length || 0,
        data: classe.eleves?.map(e => ({
          id: e._id,
          nom: e.nom,
          prenom: e.prenom
        }))
      })
      console.log('Enseignants:', {
        count: classe.enseignants?.length || 0,
        data: classe.enseignants?.map(e => ({
          id: e._id,
          nom: e.nom,
          prenom: e.prenom
        }))
      })
    })

    // Vérifier si certaines classes n'ont pas d'élèves
    const classesWithoutStudents = classes.filter(c => !c.eleves || c.eleves.length === 0)
    if (classesWithoutStudents.length > 0) {
      console.log('\n⚠️ Classes sans élèves:', classesWithoutStudents.map(c => ({
        id: c._id,
        niveau: c.niveau,
        section: c.section
      })))
    }

    console.log('\n📊 Résumé:', {
      totalClasses: classes.length,
      classesWithStudents: classes.filter(c => c.eleves && c.eleves.length > 0).length,
      classesWithoutStudents: classesWithoutStudents.length,
      totalStudents: classes.reduce((acc, c) => acc + (c.eleves?.length || 0), 0)
    })

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });

  } catch (err) {
    console.error('❌ Erreur dans getClassesByEnseignant:', err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des classes",
      error: err.message
    });
  }
};

// Rechercher des enseignants
exports.searchEnseignants = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche est requis"
      });
    }

    // Créer une expression régulière insensible à la casse
    const searchRegex = new RegExp(searchTerm, 'i');

    // Rechercher dans les champs nom, prénom et matière
    const enseignants = await Enseignant.find({
      $or: [
        { nom: searchRegex },
        { prenom: searchRegex },
        { matiere: searchRegex },
        // Recherche dans le nom complet (nom + prénom)
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$nom", " ", "$prenom"] },
              regex: searchRegex
            }
          }
        },
        // Recherche dans le nom inversé (prénom + nom)
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$prenom", " ", "$nom"] },
              regex: searchRegex
            }
          }
        }
      ]
    }).populate('classes', 'niveau section');

    res.status(200).json(enseignants);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche des enseignants",
      error: err.message
    });
  }
};
