const express = require("express");
const {
  addRide,
  getRealTimeRides,
  getRideById,
  updateRide,
  deleteRide,
  listAll,
} = require("../controllers/rideController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/admin/all", authenticate, authorizeRoles("admin"), listAll);
router.get("/", getRealTimeRides);
router.get("/:id", getRideById);

router.use(authenticate);
router.post("/", addRide);
router.patch("/:id", updateRide);
router.delete("/:id", deleteRide);

module.exports = router;

