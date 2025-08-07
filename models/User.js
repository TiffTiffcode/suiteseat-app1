const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "business", "client"],
      default: "client",
      required: true,
    },

    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Record",
      default: null,
    },

    resetToken: { type: String },
resetTokenExpiry: { type: Date },


    address: { type: String, default: "" },
profilePhoto: {
  type: String,
  default: "/uploads/default-avatar.png"
},
    // ✅ Add this INSIDE the schema object
    lastSelectedBusinessId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true } // Keep this after the fields
);

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
