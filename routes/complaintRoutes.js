const express = require("express");
const { addComplaint, getComplaints } = require("../controllers/complaintController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/add", authenticate, addComplaint);
router.get("/", authenticate, authorizeRoles("admin"), getComplaints);

module.exports = router;


