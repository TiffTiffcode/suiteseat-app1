// models/Record.js
const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema(
  {
    dataTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataType', required: true },
    values: { type: mongoose.Schema.Types.Mixed, default: {} }, // key/value bag
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthUser', required: true },
    deletedAt: { type: Date, default: null } 

  },

  { timestamps: true }
);

module.exports = mongoose.models.Record || mongoose.model('Record', RecordSchema);
