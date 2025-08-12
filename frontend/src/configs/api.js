// Configuration de l'API
const API_CONFIG = {
  baseURL: 'http://localhost:5000', // URL par défaut
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
}

// Instance Axios personnalisée
import axios from 'axios'

// Mise à jour de l'URL si définie dans les variables d'environnement
if (import.meta.env.VITE_API_URL) {
  API_CONFIG.baseURL = import.meta.env.VITE_API_URL
}

const api = axios.create(API_CONFIG)

// Fonction pour nettoyer les données d'authentification
const clearAuthData = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
  // Rediriger vers la page de connexion
  window.location.href = '/login'
}

// Intercepteur pour les requêtes
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Intercepteur pour les réponses
api.interceptors.response.use(
  response => response,
  error => {
    // Gérer les erreurs d'authentification
    if (error.response?.status === 401) {
      console.log('Token expiré ou invalide')
      clearAuthData()
      error.userMessage = 'Votre session a expiré. Veuillez vous reconnecter.'
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Erreur réseau:', error)
      error.userMessage = 'Le serveur est inaccessible. Veuillez vérifier votre connexion et que le backend est démarré.'
    } else if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
    } else if (!error.response) {
      error.userMessage = 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
    }
    return Promise.reject(error)
  }
)

export default api 