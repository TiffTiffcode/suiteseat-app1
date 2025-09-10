const mongoose = require('mongoose');
const { canon } = require('../utils/canon');

function slugify(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

const OptionValueSchema = new mongoose.Schema({
  optionSetId:   { type: mongoose.Schema.Types.ObjectId, ref: 'OptionSet', required: true, index: true },
  label:         { type: String, required: true, trim: true },
  value:         { type: String, trim: true, default: null }, // auto from label; hidden from users
  order:         { type: Number, default: 0 },

  // kind-specific optional metadata:
  imageUrl:      { type: String, default: null },  // image
  numberValue:   { type: Number, default: null },  // number
  boolValue:     { type: Boolean, default: null }, // boolean
  colorHex:      { type: String, default: null },  // color

  deletedAt:     { type: Date, default: null, index: true },

  // NEW: canonical for case/space-insensitive matching
  labelCanonical:{ type: String, index: true },
}, { timestamps: true });

OptionValueSchema.pre('validate', function(next) {
  if (!this.value && this.label) this.value = slugify(this.label);
  next();
});

OptionValueSchema.pre('save', function(next) {
  if (this.isModified('label')) this.labelCanonical = canon(this.label);
  next();
});
OptionValueSchema.pre('findOneAndUpdate', function(next) {
  const u = this.getUpdate() || {};
  const set = u.$set || u;
  if (set.label) {
    set.labelCanonical = canon(set.label);
    // If you want the slug to TRACK label changes, also do:
    // set.value = slugify(set.label);
    if (u.$set) u.$set = set; else Object.assign(u, set);
    this.setUpdate(u);
  }
  next();
});

// keep the old uniqueness if you want, but add a better one by canonical:
OptionValueSchema.index({ optionSetId: 1, labelCanonical: 1, deletedAt: 1 }, { unique: true });

module.exports = mongoose.models.OptionValue || mongoose.model('OptionValue', OptionValueSchema);
