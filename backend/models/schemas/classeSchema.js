const mongoose = require('mongoose');

const classeSchema = new mongoose.Schema({
  niveau: {
    type: String,
    required: [true, 'Le niveau est requis'],
    enum: {
      values: ['bac', '3eme', '2eme', '1ere'],
      message: '{VALUE} n\'est pas un niveau valide'
    }
  },
  section: {
    type: String,
    required: [true, 'La section est requise'],
    validate: {
      validator: function(v) {
        // Accepte les sections de base et les sections avec un numéro (ex: eco 1, eco 2)
        return /^(svt|eco|math|info|tech)( [1-9][0-9]*)?$/i.test(v.toLowerCase());
      },
      message: props => `${props.value} n'est pas une section valide`
    }
  },
  eleves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Eleve'
  }],
  enseignants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enseignant' 
  }]
}, {
  timestamps: true
});

// Middleware pre-save pour convertir la section en minuscules
classeSchema.pre('save', function(next) {
  if (this.section) {
    this.section = this.section.toLowerCase();
  }
  next();
});

module.exports = classeSchema; 