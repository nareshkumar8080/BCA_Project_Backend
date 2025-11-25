const express = require("express");
const {
  getStats,
  listUsers,
  updateUserStatus,
  deleteUser,
  listRides,
  deleteRide,
  getComplaints,
} = require("../controllers/adminController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, authorizeRoles("admin"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/rides", listRides);
router.delete("/rides/:id", deleteRide);
router.get("/complaints", getComplaints);

module.exports = router;


