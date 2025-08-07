const mongoose = require("mongoose");

const upcomingHourSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  calendarId: { type: String, required: true },
  date: { type: Date, required: true },
  isAvailable: { type: Boolean, default: false },
  start: { type: String },
  end: { type: String },
  createdBy: { type: String } // ✅ Add this line
});

module.exports = mongoose.model("UpcomingHour", upcomingHourSchema);
