const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },

    // Add this line:
    softHoldExpiresAt: Date,

    calendarId: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar", required: true }, // Add this!

    appointmentDate: { type: String, required: true }, // e.g. "2025-06-27"
    appointmentTime: { type: String, required: true }, // e.g. "14:00"
    duration: { type: Number, default: 30 }, // in minutes

    clientName: { type: String },
    serviceName: { type: String },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },


    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Appointment", appointmentSchema);