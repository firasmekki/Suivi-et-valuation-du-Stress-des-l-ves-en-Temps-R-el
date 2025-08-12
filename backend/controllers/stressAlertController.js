const stressAlertService = require('../services/stressAlertService');
const { Eleve } = require('../models');

// Contrôleur pour les alertes de stress
const stressAlertController = {
  // Tester l'envoi d'une alerte de stress
  async testStressAlert(req, res) {
    try {
      const { studentId, stressLevel } = req.body;

      if (!studentId || stressLevel === undefined) {
        return res.status(400).json({
          success: false,
          message: 'ID de l\'élève et niveau de stress requis'
        });
      }

      // Vérifier que l'élève existe
      const student = await Eleve.findById(studentId)
        .populate('parent', 'nom prenom email')
        .populate('classeId', 'niveau section');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Élève non trouvé'
        });
      }

      if (!student.parent) {
        return res.status(400).json({
          success: false,
          message: 'Aucun parent associé à cet élève'
        });
      }

      // Vérifier le stress et envoyer l'alerte si nécessaire
      const result = await stressAlertService.checkStudentStress(studentId, stressLevel);

      res.json({
        success: true,
        message: 'Vérification du stress effectuée',
        data: {
          student: {
            id: student._id,
            nom: student.nom,
            prenom: student.prenom,
            classe: student.classeId ? `${student.classeId.niveau} ${student.classeId.section}` : 'Non assigné'
          },
          stressLevel: result.currentLevel,
          isIncreasing: result.isIncreasing,
          isHigh: result.isHigh,
          alertSent: result.isIncreasing || result.isHigh
        }
      });

    } catch (error) {
      console.error('Erreur lors du test d\'alerte de stress:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test d\'alerte de stress',
        error: error.message
      });
    }
  },

  // Forcer l'envoi d'une alerte de stress (pour les tests)
  async forceStressAlert(req, res) {
    try {
      const { studentId, stressLevel } = req.body;

      if (!studentId || stressLevel === undefined) {
        return res.status(400).json({
          success: false,
          message: 'ID de l\'élève et niveau de stress requis'
        });
      }

      // Vérifier que l'élève existe
      const student = await Eleve.findById(studentId)
        .populate('parent', 'nom prenom email')
        .populate('classeId', 'niveau section');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Élève non trouvé'
        });
      }

      if (!student.parent) {
        return res.status(400).json({
          success: false,
          message: 'Aucun parent associé à cet élève'
        });
      }

      // Créer un historique simulé pour forcer l'alerte
      const simulatedHistory = [
        { level: stressLevel - 20, timestamp: new Date(Date.now() - 10 * 60 * 1000) },
        { level: stressLevel - 15, timestamp: new Date(Date.now() - 8 * 60 * 1000) },
        { level: stressLevel - 10, timestamp: new Date(Date.now() - 6 * 60 * 1000) },
        { level: stressLevel - 5, timestamp: new Date(Date.now() - 4 * 60 * 1000) },
        { level: stressLevel, timestamp: new Date() }
      ];

      // Forcer l'envoi de l'alerte
      await stressAlertService.sendStressAlert(studentId, stressLevel, simulatedHistory, true);

      res.json({
        success: true,
        message: 'Alerte de stress envoyée avec succès',
        data: {
          student: {
            id: student._id,
            nom: student.nom,
            prenom: student.prenom,
            email: student.parent.email
          },
          stressLevel: stressLevel,
          alertSent: true
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi forcé d\'alerte:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'alerte',
        error: error.message
      });
    }
  },

  // Obtenir l'historique du stress d'un élève
  async getStressHistory(req, res) {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'ID de l\'élève requis'
        });
      }

      // Récupérer l'historique du stress depuis le service
      const history = stressAlertService.stressHistory.get(studentId) || [];

      res.json({
        success: true,
        data: {
          studentId: studentId,
          history: history,
          count: history.length
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique',
        error: error.message
      });
    }
  },

  // Obtenir les statistiques de stress
  async getStressStats(req, res) {
    try {
      const stats = {
        totalStudents: stressAlertService.stressHistory.size,
        activeAlerts: 0,
        highStressStudents: 0,
        increasingStressStudents: 0
      };

      // Calculer les statistiques
      for (const [studentId, history] of stressAlertService.stressHistory) {
        if (history.length > 0) {
          const currentLevel = history[history.length - 1].level;
          const isIncreasing = stressAlertService.analyzeStressTrend(history);
          
          if (currentLevel > stressAlertService.alertThreshold) {
            stats.highStressStudents++;
          }
          
          if (isIncreasing) {
            stats.increasingStressStudents++;
          }
        }
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  },

  // Démarrer la surveillance automatique
  async startMonitoring(req, res) {
    try {
      stressAlertService.startMonitoring();
      
      res.json({
        success: true,
        message: 'Surveillance du stress démarrée',
        data: {
          checkInterval: stressAlertService.checkInterval / 1000 / 60, // en minutes
          alertThreshold: stressAlertService.alertThreshold,
          alertCooldown: stressAlertService.alertCooldown / 1000 / 60 // en minutes
        }
      });

    } catch (error) {
      console.error('Erreur lors du démarrage de la surveillance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du démarrage de la surveillance',
        error: error.message
      });
    }
  },

  // Simuler une augmentation progressive du stress
  async simulateStressIncrease(req, res) {
    try {
      const { studentId, duration = 10 } = req.body; // durée en minutes

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'ID de l\'élève requis'
        });
      }

      // Vérifier que l'élève existe
      const student = await Eleve.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Élève non trouvé'
        });
      }

      // Simuler une augmentation progressive du stress
      const interval = 2 * 60 * 1000; // 2 minutes
      const steps = Math.floor((duration * 60 * 1000) / interval);
      let currentStep = 0;

      const simulation = setInterval(async () => {
        const stressLevel = 30 + (currentStep * 10); // Augmentation de 10% toutes les 2 minutes
        
        console.log(`📊 Simulation stress - Élève ${student.prenom}: ${stressLevel}%`);
        
        await stressAlertService.checkStudentStress(studentId, stressLevel);
        
        currentStep++;
        
        if (currentStep >= steps) {
          clearInterval(simulation);
          console.log('✅ Simulation terminée');
        }
      }, interval);

      res.json({
        success: true,
        message: 'Simulation d\'augmentation du stress démarrée',
        data: {
          studentId: studentId,
          duration: duration,
          steps: steps,
          interval: interval / 1000 / 60 // en minutes
        }
      });

    } catch (error) {
      console.error('Erreur lors de la simulation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la simulation',
        error: error.message
      });
    }
  }
};

module.exports = stressAlertController; 