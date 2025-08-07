const mongoose = require("mongoose");

const dataTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fields: [
    {
      name: { type: String, required: true },
      type: { type: String, required: true },
      fields: [{ name: String, type: String, reference: String }],
      reference: { type: String, default: null }, // The reference model to populate
      multiple: { type: Boolean, default: false }, // Whether it can hold multiple references
    },
  ],
});

module.exports = mongoose.model("DataType", dataTypeSchema);
