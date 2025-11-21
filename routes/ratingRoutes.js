const express = require("express");
const { rateUser, getUserRatings } = require("../controllers/ratingController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/add", authenticate, rateUser);
router.get("/:userId", getUserRatings);

module.exports = router;


