// controllers/classeController.js
const { Classe, Eleve, Enseignant } = require('../models');

// 🔍 Trouver la classe d'un élève
exports.getClasseByEleve = async (req, res) => {
  try {
    const classe = await Classe.findOne({ eleves: req.params.id })
      .populate('eleves', 'nom prenom email')
      .populate('enseignant', 'nom prenom email');

    if (!classe) return res.status(404).json({ message: 'Classe non trouvée' });
    res.status(200).json(classe);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// 🔍 Trouver les classes d'un enseignant
exports.getClassesByEnseignant = async (req, res) => {
  try {
    const classes = await Classe.find({ enseignants: req.params.id })
      .populate('eleves', 'nom prenom email')
      .populate('enseignants', 'nom prenom email');

    res.status(200).json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Créer une nouvelle classe
exports.createClasse = async (req, res) => {
  try {
    let { niveau, section } = req.body;
    
    // Convertir en minuscules
    section = section.toLowerCase();

    // Validation des données
    if (!niveau || !section) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir le niveau et la section'
      });
    }

    // Vérifier si une classe avec le même niveau et section existe déjà
    const existingClasses = await Classe.find({
      niveau,
      section: new RegExp(`^${section}( [0-9]+)?$`)
    }).sort({ section: -1 }); // Trier par section pour obtenir le dernier numéro

    let sectionToCreate = section;
    
    if (existingClasses.length > 0) {
      // Si c'est la première classe existante et qu'elle n'a pas de numéro
      if (existingClasses.length === 1 && !existingClasses[0].section.match(/ [0-9]+$/)) {
        // Renommer la première classe pour ajouter " 1"
        await Classe.findByIdAndUpdate(
          existingClasses[0]._id,
          { section: `${section} 1` }
        );
        // La nouvelle classe aura " 2"
        sectionToCreate = `${section} 2`;
      } else {
        // Trouver le plus grand numéro utilisé
        let maxNumber = 1;
        existingClasses.forEach(classe => {
          const match = classe.section.match(/ ([0-9]+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        });
        // Utiliser le numéro suivant
        sectionToCreate = `${section} ${maxNumber + 1}`;
      }
    }

    // Créer la nouvelle classe
    const classe = new Classe({
      niveau,
      section: sectionToCreate,
      eleves: [],
      enseignants: []
    });

    const savedClasse = await classe.save();

    res.status(201).json({
      success: true,
      message: 'Classe créée avec succès',
      classe: {
        id: savedClasse._id,
        niveau: savedClasse.niveau,
        section: savedClasse.section,
        nombreEleves: 0,
        nombreEnseignants: 0
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la classe',
      error: error.message
    });
  }
};

// Mettre à jour la numérotation des classes existantes
exports.updateClassesNumbering = async (req, res) => {
  try {
    // Grouper les classes par niveau et section de base
    const classes = await Classe.find().sort({ createdAt: 1 });
    const groupedClasses = {};

    // Créer les groupes en utilisant le niveau et la section de base
    classes.forEach(classe => {
      const baseSection = classe.section.split(' ')[0]; // Prendre la section sans le numéro
      const key = `${classe.niveau}_${baseSection}`;
      if (!groupedClasses[key]) {
        groupedClasses[key] = [];
      }
      groupedClasses[key].push(classe);
    });

    // Traiter chaque groupe
    for (const key in groupedClasses) {
      const classesGroup = groupedClasses[key];
      if (classesGroup.length > 1) {
        // Extraire le niveau et la section de base
        const [niveau, baseSection] = key.split('_');
        
        // Mettre à jour chaque classe du groupe
        const updatePromises = classesGroup.map(async (classe, index) => {
          const newSection = `${baseSection} ${index + 1}`;
          console.log(`Mise à jour de la classe ${classe._id}: ${newSection}`);
          
          return Classe.findByIdAndUpdate(
            classe._id,
            { 
              niveau,
              section: newSection
            },
            { new: true }
          );
        });

        // Attendre que toutes les mises à jour soient terminées
        await Promise.all(updatePromises);
      }
    }

    // Récupérer les classes mises à jour
    const updatedClasses = await Classe.find().sort({ niveau: 1, section: 1 });

    res.status(200).json({
      success: true,
      message: 'Numérotation des classes mise à jour avec succès',
      data: updatedClasses
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la numérotation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la numérotation',
      error: error.message
    });
  }
};

// Récupérer toutes les classes avec formatage amélioré
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Classe.find()
      .populate('eleves', 'nom prenom')
      .populate('enseignants', 'nom prenom')
      .sort({ niveau: 1, section: 1, createdAt: 1 });

    // Formater les classes pour l'affichage
    const formattedClasses = classes.map(classe => ({
      id: classe._id,
      niveau: classe.niveau,
      section: classe.section,
      eleves: (classe.eleves || []).map(e => ({
        _id: e._id,
        nom: e.nom,
        prenom: e.prenom
      })),
      enseignants: classe.enseignants,
      effectif: classe.eleves ? classe.eleves.length : 0
    }));

    res.status(200).json({
      success: true,
      count: classes.length,
      data: formattedClasses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des classes',
      error: error.message
    });
  }
};

// Récupérer une classe par ID
exports.getClasseById = async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id)
      .populate('eleves', 'nom prenom')
      .populate('enseignants', 'nom prenom');

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: classe
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la classe',
      error: error.message
    });
  }
};

// Mettre à jour une classe
exports.updateClasse = async (req, res) => {
  try {
    const { niveau, section } = req.body;

    const classe = await Classe.findByIdAndUpdate(
      req.params.id,
      { niveau, section },
      { new: true, runValidators: true }
    )
    .populate('eleves', 'nom prenom')
    .populate('enseignants', 'nom prenom');

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: classe
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la classe',
      error: error.message
    });
  }
};

// Supprimer une classe
exports.deleteClasse = async (req, res) => {
  try {
    const classe = await Classe.findByIdAndDelete(req.params.id);

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Classe supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la classe',
      error: error.message
    });
  }
};

// Ajouter un enseignant à une classe
exports.addEnseignant = async (req, res) => {
  try {
    const { enseignantId } = req.body;
    const classe = await Classe.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({ success: false, message: 'Classe non trouvée' });
    }

    if (!classe.enseignants.includes(enseignantId)) {
      classe.enseignants.push(enseignantId);
      await classe.save();
      return res.status(200).json({ success: true, message: 'Enseignant ajouté à la classe.', data: classe });
    }

    res.status(409).json({ success: false, message: 'L\'enseignant est déjà assigné à cette classe.' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'enseignant:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de l\'enseignant.', error: error.message });
  }
};

// Retirer un enseignant d'une classe
exports.removeEnseignant = async (req, res) => {
  try {
    const { enseignantId } = req.params;
    const classe = await Classe.findById(req.params.id);

    if (!classe) {
      return res.status(404).json({ success: false, message: 'Classe non trouvée' });
    }

    const initialLength = classe.enseignants.length;
    classe.enseignants = classe.enseignants.filter(id => id.toString() !== enseignantId);

    if (classe.enseignants.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Enseignant non trouvé dans cette classe.' });
    }

    await classe.save();
    res.status(200).json({ success: true, message: 'Enseignant retiré de la classe.', data: classe });
  } catch (error) {
    console.error('Erreur lors du retrait de l\'enseignant:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du retrait de l\'enseignant.', error: error.message });
  }
};

// Nouvelle fonction pour récupérer les élèves d'une classe
exports.getElevesByClasse = async (req, res) => {
  try {
    const eleves = await Eleve.find({ classe: req.params.id })
      .populate('classe', 'niveau section')
      .select('-__v');

    res.status(200).json({
      success: true,
      count: eleves.length,
      data: eleves
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des élèves par classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des élèves de la classe',
      error: error.message
    });
  }
};
