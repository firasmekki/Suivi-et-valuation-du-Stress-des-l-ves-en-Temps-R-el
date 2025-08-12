const mongoose = require('mongoose');

const enseignantSchema = new mongoose.Schema({
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
  matiere: {
    type: String,
    required: [true, 'La matière est requise']
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
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classe'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware pour peupler automatiquement les classes
enseignantSchema.pre('find', function() {
  this.populate('classes', 'niveau section');
});

enseignantSchema.pre('findOne', function() {
  this.populate('classes', 'niveau section');
});

module.exports = enseignantSchema; 