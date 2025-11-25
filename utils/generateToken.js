const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  const payload = {
    id: user._id,
    role: user.role,
    email: user.email,
    isVerified: user.isVerified,
  };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
}

module.exports = {
  generateAccessToken,
};


