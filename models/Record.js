// models/record.js
const mongoose = require('mongoose');

// Define the schema for a field
const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Field name (e.g., "businessName", "heroImage")
  type: { type: String, required: true }, // Field type (e.g., "text", "image")
  multiple: { type: Boolean, default: false }, // If multiple values are allowed for the field (e.g., multiple images)
  reference: { type: String }, // If the field type is a reference, store the referenced data type
});

// Define the schema for a record
const recordSchema = new mongoose.Schema(
  {
    dataType: { type: String, required: true }, // The data type this record belongs to (e.g., "Business", "Service")
    values: { type: mongoose.Schema.Types.Mixed, default: {} }, // Dynamic values for each field in the data type
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who created the record
  },
  {
    timestamps: true, // Automatically handle createdAt and updatedAt
  }
);

module.exports = mongoose.model('Record', recordSchema);
