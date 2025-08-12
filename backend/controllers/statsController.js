const { Classe, Eleve, Enseignant, Parent } = require('../models');

const getStats = async (req, res) => {
  console.log('🔍 Début de la récupération des statistiques');
  console.log('👤 Utilisateur:', req.user);
  
  try {
    console.log('📊 Récupération des compteurs...');
    
    // Récupérer les statistiques en parallèle pour de meilleures performances
    const [teachersCount, studentsCount, parentsCount, classesCount, classesList] = await Promise.all([
      Enseignant.countDocuments(),
      Eleve.countDocuments(),
      Parent.countDocuments(),
      Classe.countDocuments(),
      Classe.find().select('niveau section')
    ]);

    console.log('📈 Statistiques récupérées:', {
      teachers: teachersCount,
      students: studentsCount,
      parents: parentsCount,
      classes: classesCount,
      classesList
    });

    res.json({
      teachers: teachersCount,
      students: studentsCount,
      parents: parentsCount,
      classes: classesCount,
      classesList
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

const getStressStats = async (req, res) => {
  console.log('🔍 Début de la récupération des statistiques de stress');
  try {
    // Générer des valeurs aléatoires pour chaque niveau de stress
    const stressCounts = {
      Faible: Math.floor(Math.random() * 20) + 5,  // Entre 5 et 25 élèves
      Modéré: Math.floor(Math.random() * 15) + 3,  // Entre 3 et 18 élèves
      Élevé: Math.floor(Math.random() * 10) + 1    // Entre 1 et 11 élèves
    };

    console.log('📈 Statistiques de stress récupérées:', stressCounts);
    res.json(stressCounts);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques de stress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de stress des élèves'
    });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    // Récupérer les élèves avec leurs dates d'inscription
    const eleves = await Eleve.find()
      .populate('classe', 'niveau section')
      .sort({ dateInscription: -1 })
      .limit(2);

    // Récupérer les classes avec leurs dates de création
    const classes = await Classe.find()
      .sort({ createdAt: -1 })
      .limit(2);

    const activities = [];

    // Ajouter les activités des élèves
    eleves.forEach(eleve => {
      activities.push({
        title: 'Nouvel élève inscrit',
        description: `${eleve.prenom} ${eleve.nom} - ${eleve.classe ? eleve.classe.niveau + ' ' + eleve.classe.section : 'Non assigné'}`,
        timestamp: eleve.dateInscription || eleve.createdAt,
        type: 'student'
      });
    });

    // Ajouter les activités des classes
    classes.forEach(classe => {
      activities.push({
        title: 'Nouvelle classe créée',
        description: `${classe.niveau} ${classe.section}`,
        timestamp: classe.createdAt,
        type: 'class'
      });
    });

    // Trier toutes les activités par date (les plus récentes en premier)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limiter à 3 activités les plus récentes
    const recentActivities = activities.slice(0, 3);

    // Si aucune activité n'est trouvée, ajouter une activité par défaut
    if (recentActivities.length === 0) {
      recentActivities.push({
        title: 'Aucune activité récente',
        description: 'Aucune activité n\'a été enregistrée',
        timestamp: new Date(),
        type: 'info'
      });
    }

    res.json(recentActivities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités récentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités récentes'
    });
  }
};

const generateStressAdvice = (history) => {
  const advice = [];
  
  console.log('Génération des conseils pour l\'historique:', history);

  // Analyser les périodes de stress élevé
  const highStressDays = history.filter(h => h.stress === 'Élevé').length;
  const moderateStressDays = history.filter(h => h.stress === 'Modéré').length;
  
  if (highStressDays >= 2) {
    advice.push({
      type: 'danger',
      message: 'Plusieurs jours de stress élevé détectés. Recommandation : Activités de relaxation quotidiennes et suivi.'
    });
  }
  
  if (moderateStressDays >= 3) {
    advice.push({
      type: 'attention',
      message: 'Stress modéré persistant. Suggestion : Exercices de respiration réguliers et gestion du temps.'
    });
  }
  
  // Analyser les tendances
  // Assurez-vous qu'il y a au moins deux jours pour calculer une tendance
  if (history.length >= 2) {
    const recentTrend = history[0].stressLevel - history[1].stressLevel;
    if (recentTrend > 20) {
      advice.push({
        type: 'danger',
        message: 'Augmentation rapide du stress. Action recommandée : Pause immédiate et exercices de relaxation.'
      });
    } else if (recentTrend < -20) {
        advice.push({
            type: 'success',
            message: 'Diminution notable du stress. Continuez les bonnes pratiques.'
        });
    }
  }

  // Si aucun conseil spécifique n'est généré, ajouter un conseil par défaut
  if (advice.length === 0) {
    advice.push({
      type: 'success',
      message: 'Votre niveau de stress est stable. Continuez à maintenir un bon équilibre.'
    });
  }
  
  console.log('Conseils générés:', advice);
  return advice;
};

const generatePreventiveAlerts = (history, student) => {
  const alerts = [];
  
  // Analyser les patterns de stress
  const stressPatterns = history.map(h => ({
    date: h.date,
    level: h.stress === 'Faible' ? 20 : h.stress === 'Modéré' ? 50 : 80
  }));
  
  // Détecter les tendances à la hausse
  const recentLevels = stressPatterns.slice(0, 3).map(p => p.level);
  const isIncreasing = recentLevels[0] > recentLevels[1] && recentLevels[1] > recentLevels[2];
  
  if (isIncreasing) {
    alerts.push({
      type: 'warning',
      title: 'Tendance à la hausse',
      message: `Le niveau de stress de ${student.prenom} ${student.nom} montre une tendance à la hausse sur les 3 derniers jours`,
      severity: 'warning',
      timestamp: new Date()
    });
  }
  
  // Détecter les niveaux de stress élevés persistants
  const highStressCount = history.filter(h => h.stress === 'Élevé').length;
  if (highStressCount >= 2) {
    alerts.push({
      type: 'danger',
      title: 'Stress élevé persistant',
      message: `${student.prenom} ${student.nom} présente un niveau de stress élevé depuis ${highStressCount} jours`,
      severity: 'danger',
      timestamp: new Date()
    });
  }
  
  return alerts;
};

const getAlerts = async (req, res) => {
  try {
    // Liste des alertes possibles en français
    const possibleAlerts = [
      {
        type: 'attention',
        title: 'Niveau de stress élevé',
        severity: 'attention',
        timestamp: new Date()
      },
      {
        type: 'stable',
        title: 'Niveau de stress normal',
        severity: 'stable',
        timestamp: new Date()
      },
      {
        type: 'attention',
        title: 'Tendance à la hausse',
        severity: 'attention',
        timestamp: new Date()
      },
      {
        type: 'danger',
        title: 'Stress élevé persistant',
        severity: 'danger',
        timestamp: new Date()
      },
      {
        type: 'attention',
        title: 'Tendance à la hausse',
        severity: 'attention',
        timestamp: new Date()
      },
      {
        type: 'stable',
        title: 'Amélioration du stress',
        severity: 'stable',
        timestamp: new Date()
      }
    ];

    // Sélectionner une alerte aléatoire
    const randomIndex = Math.floor(Math.random() * possibleAlerts.length);
    const selectedAlert = possibleAlerts[randomIndex];

    // Retourner un tableau avec une seule alerte
    res.json([selectedAlert]);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes'
    });
  }
};

const getClassStats = async (req, res) => {
  try {
    const classes = await Classe.find()
      .populate({
        path: 'eleves',
        select: 'niveauStress absences'
      });

    const classStats = classes.map(classe => {
      // Calculer le nombre d'élèves
      const studentCount = classe.eleves ? classe.eleves.length : 0;

      // Générer un niveau de stress aléatoire entre 0 et 10
      const averageStress = (Math.random() * 10).toFixed(1);

      // Calculer le taux d'absence
      let totalAbsences = 0;
      let studentsWithAbsences = 0;

      if (classe.eleves && classe.eleves.length > 0) {
        classe.eleves.forEach(eleve => {
          if (eleve.absences && eleve.absences.length > 0) {
            totalAbsences += eleve.absences.length;
            studentsWithAbsences++;
          }
        });
      }

      const absenceRate = studentsWithAbsences > 0 ? (totalAbsences / studentsWithAbsences).toFixed(1) : 0;

      // Déterminer le statut de la classe
      let status = 'stable';
      if (averageStress > 7 || absenceRate > 3) {
        status = 'attention';
      }

      return {
        id: classe._id,
        name: `${classe.niveau} ${classe.section}`,
        studentCount,
        averageStress: parseFloat(averageStress),
        absenceRate: parseFloat(absenceRate),
        status
      };
    });

    res.json(classStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de classe'
    });
  }
};

const predictStressLevel = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Récupérer l'historique des 7 derniers jours (données aléatoires pour démo)
    const history = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const stressLevel = Math.floor(Math.random() * 100); // Stress aléatoire entre 0 et 99
      
      history.push({
        date: date.toISOString().split('T')[0],
        stressLevel,
        stress: stressLevel > 70 ? 'Élevé' : stressLevel > 30 ? 'Modéré' : 'Faible'
      });
    }
    
    // Calculer la moyenne pondérée des 7 derniers jours
    const weights = [0.1, 0.1, 0.15, 0.15, 0.2, 0.15, 0.15];
    let weightedSum = 0;
    
    history.forEach((day, index) => {
      weightedSum += day.stressLevel * weights[index];
    });
    
    const predictedStress = Math.round(weightedSum);
    
    // Déterminer la tendance
    const recentTrend = history[0].stressLevel - history[1].stressLevel;
    const trend = recentTrend > 0 ? '↑' : recentTrend < 0 ? '↓' : '→';
    
    // Calculer le niveau de confiance
    const variance = history.reduce((acc, day) => {
      return acc + Math.pow(day.stressLevel - predictedStress, 2);
    }, 0) / history.length;
    
    const confidence = Math.max(60, Math.min(95, 100 - Math.sqrt(variance)));

    // Générer les conseils basés sur l'historique
    const advice = generateStressAdvice(history);
    
    console.log('Prédiction générée pour', studentId, ':', { predictedStress, trend, confidence, history: history.slice(0,10), advice });

    res.json({
      predictedStress,
      trend,
      confidence: Math.round(confidence),
      history: history.reverse(),
      advice
    });
    
  } catch (error) {
    console.error('Erreur lors de la prédiction du niveau de stress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prédiction du niveau de stress'
    });
  }
};

module.exports = {
  getStats,
  getStressStats,
  getRecentActivity,
  getAlerts,
  getClassStats,
  predictStressLevel
}; 