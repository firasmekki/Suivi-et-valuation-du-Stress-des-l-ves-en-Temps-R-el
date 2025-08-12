const nodemailer = require('nodemailer');

// Configuration email
const EMAIL_CONFIG = {
  user: 'schooltest880@gmail.com',
  pass: 'gjrk mtue romg ctfl', // Mot de passe d'application Gmail
  host: 'smtp.gmail.com',
  port: 465,
  secure: true
};

// Créer un transporteur SMTP
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  secure: EMAIL_CONFIG.secure,
  auth: {
    user: process.env.EMAIL_USER || EMAIL_CONFIG.user,
    pass: process.env.EMAIL_PASSWORD || EMAIL_CONFIG.pass
  },
  debug: true, // Active les logs détaillés
  logger: true // Active le logging
});

// Vérifier la configuration au démarrage
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Erreur de configuration email:', error);
    console.log('\n📧 Instructions de configuration Gmail :');
    console.log('1. Allez sur https://myaccount.google.com/security');
    console.log('2. Activez la "Validation en deux étapes"');
    console.log('3. Allez dans "Mots de passe des applications"');
    console.log('4. Créez un nouveau mot de passe d\'application');
    console.log('5. Utilisez ce nouveau mot de passe dans la configuration');
  } else {
    console.log('✅ Serveur email prêt');
    console.log('📧 Email configuré:', process.env.EMAIL_USER || EMAIL_CONFIG.user);
  }
});

// Fonction pour envoyer un email
const sendEmail = async (to, subject, html) => {
  try {
    console.log('📤 Tentative d\'envoi d\'email...');
    console.log('👤 Destinataire:', to);
    console.log('📑 Sujet:', subject);

    const mailOptions = {
      from: `"School Management System" <${process.env.EMAIL_USER || EMAIL_CONFIG.user}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès!');
    console.log('📌 ID du message:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erreur d\'envoi:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
}; 