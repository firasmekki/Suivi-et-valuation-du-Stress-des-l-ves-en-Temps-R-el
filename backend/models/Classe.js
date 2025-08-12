const mongoose = require('mongoose');
const classeSchema = require('./schemas/classeSchema');

module.exports = mongoose.model('Classe', classeSchema); 