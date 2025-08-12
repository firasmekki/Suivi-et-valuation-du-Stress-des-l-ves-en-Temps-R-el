import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Importation des traductions
const resources = {
  fr: {
    translation: {
      'Accueil': 'Accueil',
      'Élèves': 'Élèves',
      'Liste des élèves': 'Liste des élèves',
      'Ajouter un élève': 'Ajouter un élève',
      'Enseignants': 'Enseignants',
      'Liste des enseignants': 'Liste des enseignants',
      'Ajouter un enseignant': 'Ajouter un enseignant',
      'Menu Principal': 'Menu Principal'
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n 