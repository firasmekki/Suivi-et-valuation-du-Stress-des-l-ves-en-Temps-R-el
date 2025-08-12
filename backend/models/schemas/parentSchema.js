const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis']
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis']
  },
  adresse: {
    type: String,
    required: [true, 'L\'adresse est requise']
  },
  telephone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis']
  },
  role: {
    type: String,
    default: 'parent'
  },
  enfants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Eleve'
  }]
}, {
  timestamps: true
});

module.exports = parentSchema; 