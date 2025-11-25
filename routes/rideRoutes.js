const express = require("express");
const {
  addRide,
  getRealTimeRides,
  getRideById,
  getMyRides,
  updateRide,
  deleteRide,
  listAll,
} = require("../controllers/rideController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/admin/all", authenticate, authorizeRoles("admin"), listAll);
router.get("/mine", authenticate, getMyRides);
router.get("/", getRealTimeRides);
router.get("/:id", getRideById);

router.use(authenticate);
router.post("/", addRide);
router.patch("/:id", updateRide);
router.delete("/:id", deleteRide);

module.exports = router;

