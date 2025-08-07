// models/Service.js
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true, // Removes whitespace from both ends of a string
        maxlength: [100, 'Service name cannot be more than 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'] // Ensures price is not negative
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters'],
        default: '' // Make it optional, default to empty string if not provided
    },
    duration: { // Duration in minutes (or whatever unit you decide)
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute'] // Ensures duration is a positive number
    },
    imageUrl: { // Store the URL of the image, not the image data itself
        type: String,
        trim: true,
        default: '' // Optional, defaults to an empty string
    },
addons: {
  type: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      duration: { type: Number, required: true, min: 1 },
      description: { type: String, default: "" }
    }
  ],
  default: []
},

    // Foreign keys to link to other models
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business', // This should match the name of your Business model
        required: [true, 'Business association is required']
    },
    calendarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Calendar', // This should match the name of your Calendar model
        required: [true, 'Calendar association is required']
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // This should match the name of your Category model
        required: [true, 'Category association is required']
    },
    createdBy: { // To track which user created this service (assuming a User model)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This should match the name of your User model
        required: true
    },
    isDeleted: { // For soft deletion instead of permanent deletion
        type: Boolean,
        default: false // Defaults to false, meaning the service is active
    }
}, {
    timestamps: true // This automatically adds `createdAt` and `updatedAt` fields
});

// Optional: Add a unique index to prevent logical duplicates based on key fields
// This helps prevent a user from creating two "Haircut" services for the *same*
// business/calendar/category combination.
// Consider carefully if this uniqueness constraint makes sense for your application.
// If you want to allow "Haircut" in Business A, Calendar B, Category C, AND
// another "Haircut" (even if identical) in Business A, Calendar B, Category D,
// then this exact index might be too strict. Adjust as needed.
ServiceSchema.index({
    serviceName: 1,      // Index on serviceName
    businessId: 1,       // Index on businessId
    calendarId: 1,       // Index on calendarId
    categoryId: 1,       // Index on categoryId
    createdBy: 1,        // Index on createdBy (for user-specific uniqueness)
    isDeleted: 1         // Include isDeleted in the index for partial filtering
}, {
    unique: true, // Enforce uniqueness for the combination of these fields
    // This allows you to have a "deleted" service with the same name/associations
    // as an active one. Only active services must be unique.
    partialFilterExpression: { isDeleted: false }
});


// Export the Mongoose Model
module.exports = mongoose.model('Service', ServiceSchema);