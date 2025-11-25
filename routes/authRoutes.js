const express = require("express");
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", authenticate, getProfile);

module.exports = router;


