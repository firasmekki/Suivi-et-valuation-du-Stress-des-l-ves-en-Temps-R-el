const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  classe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classe',
    required: true
  },
  etudiant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Etudiant',
    required: true
  },
  matiere: {
    type: String,
    required: true
  },
  controle: {
    note: {
      type: Number,
      min: 0,
      max: 20
    },
    appreciation: String
  },
  examen: {
    note: {
      type: Number,
      min: 0,
      max: 20
    },
    appreciation: String
  },
  moyenne: {
    type: Number,
    min: 0,
    max: 20,
    default: 0
  },
  enseignant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware pour calculer la moyenne avant la sauvegarde
noteSchema.pre('save', function(next) {
  if (this.controle?.note && this.examen?.note) {
    this.moyenne = (this.controle.note + this.examen.note) / 2;
  } else if (this.controle?.note) {
    this.moyenne = this.controle.note;
  } else if (this.examen?.note) {
    this.moyenne = this.examen.note;
  } else {
    this.moyenne = 0;
  }
  this.dateModification = Date.now();
  next();
});

// Index composé pour s'assurer qu'un étudiant n'a qu'une note par classe et par matière
noteSchema.index({ classe: 1, etudiant: 1, matiere: 1 }, { unique: true });

module.exports = mongoose.models.Note || mongoose.model('Note', noteSchema); 