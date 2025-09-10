// models/OptionSet.js
const mongoose = require('mongoose');           // ← THIS must be present
const { canon } = require('../utils/canon');

const OptionSetSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true, unique: true },
  nameCanonical: { type: String, trim: true }, // no unique/index here
  description:   { type: String, default: '' },
  kind:          { type: String, enum: ['text','image','number','boolean','color'], default: 'text' },
  deletedAt:     { type: Date, default: null, index: true },
}, { timestamps: true });

OptionSetSchema.pre('save', function(next) {
  if (this.isModified('name')) this.nameCanonical = canon(this.name);
  next();
});

OptionSetSchema.pre('findOneAndUpdate', function(next) {
  const u = this.getUpdate() || {};
  const set = u.$set || u;
  if (set.name) {
    set.nameCanonical = canon(set.name);
    if (u.$set) u.$set = set; else Object.assign(u, set);
    this.setUpdate(u);
  }
  next();
});

// one uniqueness definition (avoids duplicate-index warning)
OptionSetSchema.index(
  { nameCanonical: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.models.OptionSet || mongoose.model('OptionSet', OptionSetSchema);
