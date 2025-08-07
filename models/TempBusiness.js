const mongoose = require('mongoose');
const { Schema } = mongoose;

const BusinessSchema = new Schema({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  values: {
    businessName: { type: String, required: true },
    yourName: String,
    phoneNumber: String,
    locationName: String,
    businessAddress: String,
    businessEmail: String,
    heroImage: String,
    
  },
  slug: {
    type: String,
    required: true,
    unique: true,      // ← enforce unique slugs
    trim: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true 

});



module.exports = mongoose.model('Business', BusinessSchema);
