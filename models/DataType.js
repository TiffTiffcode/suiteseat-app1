//C:\Users\tiffa\OneDrive\Desktop\Live\models\DataType.js
const mongoose = require('mongoose');
const { canon } = require('../utils/canon');

const DataTypeSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true, unique: true },
  nameCanonical: { type: String, index: true, unique: true },
  description:   { type: String, default: '' },
}, { timestamps: true });

// keep canonical in sync on create/save
DataTypeSchema.pre('save', function(next) {
  if (this.isModified('name')) this.nameCanonical = canon(this.name);
  next();
});

// keep canonical in sync on findOneAndUpdate (PATCH)
DataTypeSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() || {};
  const $set = update.$set ?? (update.$set = {});
  // handle either direct "name" or $set.name
  const newName = $set.name ?? update.name;
  if (typeof newName === 'string') {
    $set.nameCanonical = canon(newName);
    // prevent manual nameCanonical override in the same update
    if ('nameCanonical' in update) delete update.nameCanonical;
  }
  this.setUpdate(update);
  next();
});

module.exports = mongoose.models.DataType || mongoose.model('DataType', DataTypeSchema);
