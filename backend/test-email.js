const { sendEmail } = require('./config/emailConfig');

// Adresse email de test
const TEST_EMAIL = 'schooltest880@gmail.com'; // Utilisation du même compte que l'expéditeur pour le test

async function testEmail() {
  try {
    console.log('🔄 Démarrage du test d\'envoi d\'email...');
    console.log('📧 Envoi à:', TEST_EMAIL);
    
    await sendEmail(
      TEST_EMAIL,
      'Test Email - School Management System',
      `
        <h1>Test d'envoi d'email</h1>
        <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
        <p>Date et heure du test: ${new Date().toLocaleString()}</p>
      `
    );
    console.log('✅ Email de test envoyé avec succès!');
  } catch (error) {
    console.error('❌ Erreur détaillée:', error);
    if (error.code === 'EAUTH') {
      console.error('⚠️ Erreur d\'authentification - Vérifiez vos identifiants Gmail');
    }
  }
}

console.log('🚀 Démarrage du script de test...');
testEmail(); 