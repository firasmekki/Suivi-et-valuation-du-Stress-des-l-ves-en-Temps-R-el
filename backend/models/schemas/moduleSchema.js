const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du module est requis']
  },
  description: {
    type: String
  },
  classe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classe',
    required: [true, 'La classe est requise']
  },
  enseignant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enseignant',
    required: [true, 'L\'enseignant est requis']
  }
}, {
  timestamps: true
});

module.exports = moduleSchema; 