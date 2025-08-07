// models/Category.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CategorySchema = new Schema({
  businessId: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  calendarId: {
    type: Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true
  },
  categoryName: {
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
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true 
});

module.exports = mongoose.model('Category', CategorySchema);
