const mongoose = require('mongoose');
const { canon } = require('../utils/canon');

const DataTypeSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true, unique: true },
  nameCanonical:  { type: String, index: true, unique: true }, // careful: see note below
  description:    { type: String, default: '' },
}, { timestamps: true });

// Keep in sync
DataTypeSchema.pre('save', function(next) {
  if (this.isModified('name')) this.nameCanonical = canon(this.name);
  next();
});

module.exports = mongoose.models.DataType || mongoose.model('DataType', DataTypeSchema);
