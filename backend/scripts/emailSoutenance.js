require('dotenv').config();
const mongoose = require('mongoose');
const { sendEmail } = require('../config/emailConfig');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    try {
      console.log('\n🎯 EMAIL ALERTE STRESS POUR SOUTENANCE\n');

      // Récupérer le premier élève avec parent
      const { Eleve } = require('../models');
      const student = await Eleve.findOne().populate('parent');

      if (!student) {
        console.log('❌ Aucun élève trouvé');
        return;
      }

      if (!student.parent) {
        console.log('❌ Aucun parent associé');
        return;
      }

      const parentEmail = student.parent.email;
      console.log(`✅ Élève: ${student.prenom} ${student.nom}`);
      console.log(`📧 Email parent: ${parentEmail}`);
      console.log(`🏫 Classe: ${student.classeId || 'Non assigné'}\n`);

      // Email d'alerte stress
      const subject = '🚨 ALERTE URGENTE - Stress Élève';
      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerte Stress - Soutenance</title>
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
        <p>Cher(e) <strong>${student.parent.prenom} ${student.parent.nom}</strong>,</p>
        
        <p>Notre système de surveillance du stress a détecté une situation CRITIQUE nécessitant votre attention immédiate concernant votre enfant <strong>${student.prenom} ${student.nom}</strong>.</p>
        
        <div class="alert-box">
            <h3>📊 Informations de surveillance</h3>
            <p><strong>Élève :</strong> ${student.prenom} ${student.nom}</p>
            <p><strong>Classe :</strong> ${student.classeId || 'Non assigné'}</p>
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

      console.log('📤 Envoi de l\'email d\'alerte...');
      await sendEmail(parentEmail, subject, html);

      console.log('✅ Email d\'alerte envoyé avec succès !');
      console.log(`📧 Vérifiez votre boîte email: ${parentEmail}`);
      console.log('\n🎯 Tu peux maintenant montrer cet email à ta soutenance !');
      console.log('📧 N\'oublie pas de vérifier les spams aussi');

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      console.log('\n🔧 Solutions possibles :');
      console.log('1. Vérifie que l\'email du parent est correct');
      console.log('2. Vérifie la configuration Gmail dans emailConfig.js');
      console.log('3. Vérifie les spams');
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB:', err);
  }); 