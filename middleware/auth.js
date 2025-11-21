const jwt = require("jsonwebtoken");
const createError = require("http-errors");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(createError(401, "Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return next(createError(401, "Invalid or expired token"));
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(403, "Insufficient permissions"));
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};


