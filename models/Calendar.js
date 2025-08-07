// models/Calendar.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CalendarSchema = new Schema({
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  calendarName: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
isDefault: { type: Boolean, default: false },

  // Soft‐delete fields:
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
});

// (optional) index on isDeleted if you like:
// CalendarSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Calendar', CalendarSchema);
