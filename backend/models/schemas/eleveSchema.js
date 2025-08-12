const mongoose = require('mongoose');

const eleveSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis']
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis']
  },
  dateNaissance: {
    type: Date,
    required: [true, 'La date de naissance est requise']
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
  horlogeId: {
    type: String,
    default: null
  },
  photo: {
    type: String
  },
  classe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classe'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: [true, 'Le parent est requis']
  }
}, {
  timestamps: true
});

module.exports = eleveSchema; 