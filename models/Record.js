// models/Record.js
const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  dataTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataType', required: true },
  values:     { type: mongoose.Schema.Types.Mixed, default: {} },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: false },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'AuthUser', required: true },
  updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'AuthUser' },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

// lift createdBy/updatedBy from values if present
RecordSchema.pre('validate', function(next) {
  if (!this.createdBy && this.values && this.values.createdBy) {
    this.createdBy = this.values.createdBy;
  }
  if (!this.updatedBy && this.values && this.values.updatedBy) {
    this.updatedBy = this.values.updatedBy;
  }
  next();
});

// ✅ TEMP DEBUG: keep this ABOVE the export
RecordSchema.pre('validate', function(next) {
  console.log('[Record pre-validate] createdBy=', this.createdBy, 'dataTypeId=', this.dataTypeId);
  next();
});

module.exports = mongoose.models.Record || mongoose.model('Record', RecordSchema);
