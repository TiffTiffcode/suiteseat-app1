// models/Field.js
const mongoose = require('mongoose');
const { canon } = require('../utils/canon');

const FieldSchema = new mongoose.Schema(
  {
    dataTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataType', required: true, index: true },
    name: { type: String, required: true, trim: true },
    nameCanonical: { type: String, index: true }, // 👈 add this
    type: { type: String, required: true },       // "Text" | "Number" | "Reference" | "Dropdown" | ...
    allowMultiple: { type: Boolean, default: false },
    referenceTo: { type: mongoose.Schema.Types.ObjectId, ref: 'DataType', default: null },
    optionSetId: { type: mongoose.Schema.Types.ObjectId, ref: 'OptionSet', default: null },
    deletedAt: { type: Date, default: null, index: true }, // soft delete
    defaultOptionValueId: { type: mongoose.Schema.Types.ObjectId, ref: 'OptionValue', default: null },
  },
  { timestamps: true }
);

FieldSchema.pre('save', function(next) {
  if (this.isModified('name')) this.nameCanonical = canon(this.name);
  next();
});
FieldSchema.pre('findOneAndUpdate', function(next) {
  const u = this.getUpdate() || {};
  const set = u.$set || u;
  if (set.name) {
    set.nameCanonical = canon(set.name);
    if (u.$set) u.$set = set; else Object.assign(u, set);
    this.setUpdate(u);
  }
  next();
});

// prevent dup names per DataType ignoring case/spaces (allows duplicates if soft-deleted)
FieldSchema.index({ dataTypeId: 1, nameCanonical: 1, deletedAt: 1 }, { unique: true });


module.exports = mongoose.models.Field || mongoose.model('Field', FieldSchema);

