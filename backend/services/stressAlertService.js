const { sendEmail } = require('../config/emailConfig');
const { Eleve } = require('../models');
const { Parent } = require('../models');

class StressAlertService {
  constructor() {
    this.stressHistory = new Map(); // Stocke l'historique du stress par élève
    this.alertThreshold = 70; // Seuil d'alerte (70%)
    this.checkInterval = 2 * 60 * 1000; // Vérification toutes les 2 minutes
    this.alertCooldown = 10 * 60 * 1000; // Cooldown de 10 minutes entre alertes
    this.lastAlertTime = new Map(); // Dernière alerte par élève
    this.firstAlertSent = new Map(); // Pour tracker si c'est la première alerte
  }

  // Vérifier le niveau de stress d'un élève
  async checkStudentStress(studentId, currentStressLevel) {
    try {
      // Récupérer l'historique du stress pour cet élève
      if (!this.stressHistory.has(studentId)) {
        this.stressHistory.set(studentId, []);
      }

      const history = this.stressHistory.get(studentId);
      const now = new Date();

      // Ajouter le niveau actuel à l'historique
      history.push({
        level: currentStressLevel,
        timestamp: now
      });

      // Garder seulement les 10 dernières mesures (20-30 minutes)
      if (history.length > 10) {
        history.shift();
      }

      // Vérifier si le stress augmente de manière significative
      const isStressIncreasing = this.analyzeStressTrend(history);
      const isHighStress = currentStressLevel > this.alertThreshold;
      const isFirstAlert = !this.firstAlertSent.has(studentId);
      const canSendAlert = this.canSendAlert(studentId);

      // Envoyer une alerte si :
      // 1. C'est la première fois que le stress est élevé (alerte immédiate)
      // 2. Ou si le stress reste élevé et qu'on peut envoyer un rappel
      if (isHighStress && (isFirstAlert || canSendAlert)) {
        await this.sendStressAlert(studentId, currentStressLevel, history, isFirstAlert);
        this.lastAlertTime.set(studentId, now);
        this.firstAlertSent.set(studentId, true);
      }

      // Réinitialiser le flag de première alerte si le stress redescend
      if (!isHighStress && this.firstAlertSent.has(studentId)) {
        this.firstAlertSent.delete(studentId);
      }

      return {
        currentLevel: currentStressLevel,
        isIncreasing: isStressIncreasing,
        isHigh: isHighStress,
        isFirstAlert: isFirstAlert,
        history: history
      };

    } catch (error) {
      console.error('Erreur lors de la vérification du stress:', error);
      throw error;
    }
  }

  // Analyser la tendance du stress
  analyzeStressTrend(history) {
    if (history.length < 3) return false;

    const recent = history.slice(-3); // 3 dernières mesures
    const previous = history.slice(-6, -3); // 3 mesures précédentes

    if (previous.length < 3) return false;

    const recentAvg = recent.reduce((sum, item) => sum + item.level, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.level, 0) / previous.length;

    // Le stress augmente si la moyenne récente est 15% plus élevée que la précédente
    return recentAvg > previousAvg * 1.15;
  }

  // Vérifier si on peut envoyer une alerte (cooldown)
  canSendAlert(studentId) {
    const lastAlert = this.lastAlertTime.get(studentId);
    if (!lastAlert) return true;

    const timeSinceLastAlert = Date.now() - lastAlert.getTime();
    return timeSinceLastAlert > this.alertCooldown;
  }

  // Envoyer une alerte de stress aux parents
  async sendStressAlert(studentId, stressLevel, history, isFirstAlert) {
    try {
      // Récupérer les informations de l'élève et de ses parents
      const student = await Eleve.findById(studentId)
        .populate('parent', 'nom prenom email')
        .populate('classeId', 'niveau section');

      if (!student || !student.parent) {
        console.error('Élève ou parent non trouvé:', studentId);
        return;
      }

      const parent = student.parent;
      const classe = student.classeId;

      // Calculer la tendance
      const trend = this.calculateTrend(history);
      const recommendation = this.getRecommendation(stressLevel, trend);

      // Créer le contenu de l'email
      const emailContent = this.createEmailTemplate({
        studentName: `${student.nom} ${student.prenom}`,
        parentName: `${parent.nom} ${parent.prenom}`,
        classe: `${classe.niveau} ${classe.section}`,
        stressLevel: stressLevel,
        trend: trend,
        recommendation: recommendation,
        timestamp: new Date().toLocaleString('fr-FR'),
        isFirstAlert: isFirstAlert
      });

      // Envoyer l'email
      await sendEmail(
        parent.email,
        `Alerte Stress - ${student.prenom} ${student.nom}`,
        emailContent
      );

      console.log(`✅ Alerte de stress envoyée aux parents de ${student.prenom} ${student.nom}`);

    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte de stress:', error);
      throw error;
    }
  }

  // Calculer la tendance du stress
  calculateTrend(history) {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-3);
    const previous = history.slice(-6, -3);

    if (previous.length < 3) return 'stable';

    const recentAvg = recent.reduce((sum, item) => sum + item.level, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.level, 0) / previous.length;

    if (recentAvg > previousAvg * 1.2) return 'augmentation_significative';
    if (recentAvg > previousAvg * 1.1) return 'augmentation_moderee';
    if (recentAvg < previousAvg * 0.9) return 'diminution';
    return 'stable';
  }

  // Obtenir des recommandations basées sur le niveau de stress
  getRecommendation(stressLevel, trend) {
    if (stressLevel > 80) {
      return {
        urgency: 'élevée',
        action: 'Intervention immédiate recommandée. Contactez l\'établissement.',
        tips: [
          'Encouragez votre enfant à prendre des pauses régulières',
          'Assurez-vous qu\'il dort suffisamment (8-10 heures)',
          'Pratiquez des exercices de respiration ensemble'
        ]
      };
    } else if (stressLevel > 60) {
      return {
        urgency: 'modérée',
        action: 'Surveillance accrue recommandée.',
        tips: [
          'Discutez avec votre enfant de ses préoccupations',
          'Encouragez les activités physiques',
          'Limitez le temps d\'écran avant le coucher'
        ]
      };
    } else {
      return {
        urgency: 'faible',
        action: 'Surveillance normale.',
        tips: [
          'Maintenez une routine régulière',
          'Encouragez les activités de détente',
          'Restez à l\'écoute de votre enfant'
        ]
      };
    }
  }

  // Créer le template d'email professionnel
  createEmailTemplate(data) {
    const urgencyColor = data.recommendation.urgency === 'élevée' ? '#dc3545' : 
                        data.recommendation.urgency === 'modérée' ? '#ffc107' : '#28a745';

    const alertType = data.isFirstAlert ? 'ALERTE URGENTE' : 'RAPPEL DE SURVEILLANCE';
    const alertIcon = data.isFirstAlert ? '🚨' : '⚠️';
    const alertMessage = data.isFirstAlert 
      ? 'ALERTE URGENTE - Le niveau de stress de votre enfant nécessite une attention immédiate !'
      : 'Rappel - Le niveau de stress de votre enfant reste élevé et nécessite une surveillance continue.';

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${alertType} - ${data.studentName}</title>
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
            background: ${data.isFirstAlert ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)'};
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
            background-color: ${data.isFirstAlert ? '#f8d7da' : '#fff3cd'};
            border: 1px solid ${data.isFirstAlert ? '#f5c6cb' : '#ffeaa7'};
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .stress-level {
            display: inline-block;
            background-color: ${urgencyColor};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 10px 0;
          }
          .recommendation {
            background-color: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
          }
          .tips {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .tips ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .tips li {
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          .contact-info {
            background-color: #e3f2fd;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
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
          <h1>${alertIcon} ${alertType}</h1>
          <p>${alertMessage}</p>
          ${data.isFirstAlert ? '<div class="urgent-badge">⚠️ ACTION IMMÉDIATE REQUISE</div>' : ''}
        </div>
        
        <div class="content">
          <p>Cher(e) <strong>${data.parentName}</strong>,</p>
          
          <p>${data.isFirstAlert 
            ? 'Notre système de surveillance du stress a détecté une situation CRITIQUE nécessitant votre attention immédiate concernant votre enfant.'
            : 'Notre système de surveillance continue de détecter un niveau de stress élevé chez votre enfant.'
          } <strong>${data.studentName}</strong>.</p>
          
          <div class="alert-box">
            <h3>📊 Informations de surveillance</h3>
            <p><strong>Élève :</strong> ${data.studentName}</p>
            <p><strong>Classe :</strong> ${data.classe}</p>
            <p><strong>Niveau de stress actuel :</strong> <span class="stress-level">${data.stressLevel}%</span></p>
            <p><strong>Tendance :</strong> ${this.getTrendText(data.trend)}</p>
            <p><strong>Dernière mise à jour :</strong> ${data.timestamp}</p>
            ${data.isFirstAlert ? '<p><strong>🚨 PREMIÈRE ALERTE :</strong> Cette alerte a été déclenchée automatiquement car le seuil critique a été dépassé.</p>' : ''}
          </div>
          
          <div class="recommendation">
            <h3>💡 Recommandations</h3>
            <p><strong>Niveau d'urgence :</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${data.recommendation.urgency}</span></p>
            <p><strong>Action recommandée :</strong> ${data.recommendation.action}</p>
            ${data.isFirstAlert ? '<p><strong>⚠️ IMPORTANT :</strong> Veuillez contacter l\'établissement dans les plus brefs délais.</p>' : ''}
          </div>
          
          <div class="tips">
            <h3>🌟 Conseils pour aider votre enfant</h3>
            <ul>
              ${data.recommendation.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
          
          <div class="contact-info">
            <h3>📞 Contact et support</h3>
            <p>Si vous avez des questions ou souhaitez discuter de cette situation :</p>
            <ul>
              <li><strong>Conseiller d'éducation :</strong> Disponible pour un entretien</li>
              <li><strong>Infirmière scolaire :</strong> Pour un suivi médical si nécessaire</li>
              <li><strong>Service psychologique :</strong> Pour un accompagnement spécialisé</li>
            </ul>
          </div>
          
          <p><strong>Important :</strong> ${data.isFirstAlert 
            ? 'Cette alerte CRITIQUE a été générée automatiquement. Une intervention rapide est recommandée.'
            : 'Ce rappel est généré automatiquement par notre système de surveillance continue.'
          } Nous vous encourageons à communiquer ouvertement avec votre enfant et à contacter l'établissement si vous avez des préoccupations.</p>
          
          <p>Cordialement,<br>
          <strong>L'équipe de surveillance du bien-être scolaire</strong></p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le système de surveillance du stress scolaire.</p>
          <p>Pour toute question technique, contactez le support informatique.</p>
          <p>© 2024 Système de Gestion du Stress Scolaire - Tous droits réservés</p>
        </div>
      </body>
      </html>
    `;
  }

  // Obtenir le texte de la tendance
  getTrendText(trend) {
    const trends = {
      'augmentation_significative': 'Augmentation significative du stress',
      'augmentation_moderee': 'Augmentation modérée du stress',
      'diminution': 'Diminution du stress',
      'stable': 'Niveau de stress stable'
    };
    return trends[trend] || 'Tendance non déterminée';
  }

  // Méthode pour simuler la surveillance continue
  startMonitoring() {
    console.log('🔄 Démarrage de la surveillance du stress...');
    
    setInterval(() => {
      console.log('📊 Vérification périodique du stress...');
      // Ici, vous pouvez ajouter la logique pour récupérer les données de stress
      // depuis vos capteurs ou votre base de données
    }, this.checkInterval);
  }
}

module.exports = new StressAlertService(); 