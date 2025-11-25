const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    password: { type: String, required: true },
    rating: { type: Number, default: 5 },
    ridesCompleted: { type: Number, default: 0 },
    role: { type: String, enum: ["student", "rider",], default: "student" },
    // role: { type: String, enum: ["student", "rider", "admin"], default: "student" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailVerificationToken: String,
    emailVerificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);


