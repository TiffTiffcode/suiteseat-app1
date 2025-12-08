// models/Hold.js
const mongoose = require('mongoose');

const HoldSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  calendarId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  // For rescheduling, link to the original appointment
  appointmentId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
  clientUserId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

  start: { type: Date, required: true, index: true },
  end:   { type: Date, required: true, index: true },

  // auto-expire after 5 mins
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL: documents auto-removed after `expiresAt`
HoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Optional: prevent two holds on the exact same slot/calendar
HoldSchema.index(
  { calendarId: 1, start: 1, end: 1 },
  { unique: true, partialFilterExpression: { } }
);

module.exports = mongoose.model('Hold', HoldSchema);
