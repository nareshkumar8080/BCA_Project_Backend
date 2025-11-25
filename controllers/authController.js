const crypto = require("crypto");
const createError = require("http-errors");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { generateAccessToken } = require("../utils/generateToken");
const { sendEmail } = require("../utils/emailService");
const {
  verificationTemplate,
  forgotPasswordTemplate,
} = require("../utils/emailTemplates");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  gender: user.gender,
  role: user.role,
  rating: user.rating,
  ridesCompleted: user.ridesCompleted,
  isVerified: user.isVerified,
  isActive: user.isActive,
});

const generateCode = () => crypto.randomInt(100000, 999999).toString();

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, gender, password, role = "student" } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw createError(400, "Email already in use");
  }

  const allowedRoles = ["student", "rider", "admin"];
  const normalizedRole = allowedRoles.includes(role) ? role : "student";

  const verificationCode = generateCode();
  const user = await User.create({
    name,
    email,
    phone,
    gender,
    password,
    role: normalizedRole,
    emailVerificationToken: verificationCode,
    emailVerificationTokenExpires: Date.now() + 15 * 60 * 1000,
  });

  await sendEmail({
    to: email,
    ...verificationTemplate(name, verificationCode),
  });

  res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email.",
    data: sanitizeUser(user),
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw createError(400, "Invalid credentials");
  }

  if (!user.isActive) {
    throw createError(403, "Account deactivated. Contact admin.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError(400, "Invalid credentials");
  }

  if (!user.isVerified) {
    throw createError(401, "Email not verified");
  }

  const token = generateAccessToken(user);
  res.json({
    success: true,
    token,
    data: sanitizeUser(user),
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.emailVerificationToken) {
    throw createError(400, "Invalid verification request");
  }

  if (user.emailVerificationToken !== code || user.emailVerificationTokenExpires < Date.now()) {
    throw createError(400, "Invalid or expired verification code");
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();

  const token = generateAccessToken(user);
  res.json({
    success: true,
    message: "Email verified successfully",
    token,
    data: sanitizeUser(user),
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw createError(404, "User not found");
  }

  const resetCode = generateCode();
  user.resetPasswordToken = resetCode;
  user.resetPasswordTokenExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  await sendEmail({
    to: email,
    ...forgotPasswordTemplate(user.name, resetCode),
  });

  res.json({
    success: true,
    message: "Password reset code sent to email",
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.resetPasswordToken !== code || user.resetPasswordTokenExpires < Date.now()) {
    throw createError(400, "Invalid or expired reset code");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully",
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({
    success: true,
    data: sanitizeUser(user),
  });
});


