const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // You can reference the user model later
    required: true
  },
  calendarIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar', // We'll set up the Calendar model next
  }]
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
