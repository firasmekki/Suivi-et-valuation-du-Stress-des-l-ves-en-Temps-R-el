const mongoose = require('mongoose');

// Import schemas
const classeSchema = require('./schemas/classeSchema');
const eleveSchema = require('./schemas/eleveSchema');
const enseignantSchema = require('./schemas/enseignantSchema');
const parentSchema = require('./schemas/parentSchema');
const moduleSchema = require('./schemas/moduleSchema');
const noteSchema = require('./Note');

// Import Admin model
const Admin = require('./Admin');

// Initialize models
const Classe = mongoose.model('Classe', classeSchema);
const Eleve = mongoose.model('Eleve', eleveSchema);
const Enseignant = mongoose.model('Enseignant', enseignantSchema);
const Parent = mongoose.model('Parent', parentSchema);
const Module = mongoose.model('Module', moduleSchema);
const Note = require('./Note');

// Export models
module.exports = {
  Admin,
  Classe,
  Eleve,
  Enseignant,
  Parent,
  Module,
  Note
}; 