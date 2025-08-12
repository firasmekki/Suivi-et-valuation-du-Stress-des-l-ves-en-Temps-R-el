const mongoose = require('mongoose');
const eleveSchema = require('./schemas/eleveSchema');

module.exports = mongoose.model('Etudiant', eleveSchema); 