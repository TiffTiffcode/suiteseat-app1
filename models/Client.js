const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  phone: { type: String },
  email: { type: String },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Record" }, // or your Business model
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("Client", clientSchema);
