# Plateforme de Suivi du Stress des Élèves - PFE

## Capture d’écran - Détail Étudiant (Analyse du Stress des Étudiants en Temps Réel )

Voici un exemple de capture d’écran montrant la liste des étudiants avec leur niveau de stress :

![Liste des étudiants](./capture/localhost_3000_students%20(7).png)

---

## Capture d’écran - Détail Étudiant (Analyse du Stress des Étudiants en Temps Réel )


Exemple d’affichage détaillé d’un étudiant avec graphiques de suivi du stress :

![Détail étudiant](./capture/localhost_3000_students%20(8).png)

---

## D’autres captures d’écran sont disponibles dans le dossier `capture`.

## 🚀 Fonctionnalités

- **Visualisation en temps réel** : Suivi des niveaux de stress par élève
- **Tableaux de bord personnalisés** : Interfaces adaptées selon le rôle (enseignant, parent, admin)
- **Alertes et rapports** : Notifications sur tendances de stress critiques
- **Gestion des profils élèves** : Création, modification, suppression
- **Simulation des données** : Génération de données biométriques simulées pour tests

## 🛠️ Technologies utilisées

### Backend
- **Node.js** & **Express.js**
- **MongoDB** (base de données principale)
- **InfluxDB** (stockage séries temporelles)
- **TensorFlow / Scikit-Learn** (analyse IA)

### Frontend
- **React.js** avec **Redux Toolkit**
- **Chart.js** pour les graphiques
- **Axios** pour les appels API
- **React Router** pour la navigation

## 📦 Installation

### Prérequis
- Node.js (version 14 ou plus)
- MongoDB (local ou cloud)
- npm ou yarn



## 📁 Structure du projet


├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── scripts/



├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   └── utils/
│   └── public/


├── capture/           # Dossier des captures d’écran


└── README.md


🔐 Sécurité
Authentification sécurisée avec JWT

Validation côté serveur

Variables sensibles dans .env

Protection CORS activée

🤝 Contribution
Forkez le projet

Créez une branche pour votre fonctionnalité

Faites vos commits

Poussez votre branche

Ouvrez une Pull Request

📄 Licence
Projet réalisé dans le cadre d’un Projet de Fin d’Études (PFE).

👨‍💻 Auteur
Firas Mekki – Développeur Full Stack
