const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  calendarId: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar", required: true },
  availability: [
    {
      day: { type: String, required: true },     // e.g. 'sunday'
      start: { type: String, required: true },   // e.g. '08:00'
      end: { type: String, required: true }      // e.g. '17:00'
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WeeklyAvailability", availabilitySchema);

