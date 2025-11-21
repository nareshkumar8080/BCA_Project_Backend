const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");

exports.getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalRides, todaysRides, bookedRides] = await Promise.all([
    User.countDocuments(),
    Ride.countDocuments(),
    Ride.countDocuments({ date: new Date().toISOString().slice(0, 10) }),
    Ride.countDocuments({ status: "booked" }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalRides,
      todaysRides,
      bookedRides,
    },
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ success: true, data: users });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select("-password");
  res.json({ success: true, data: user });
});

exports.listRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find().populate("riderId", "name email");
  res.json({ success: true, data: rides });
});

exports.deleteRide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Ride.findByIdAndDelete(id);
  await Booking.deleteMany({ rideId: id });
  res.json({ success: true, message: "Ride removed" });
});

exports.getComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find()
    .populate("userId", "name email")
    .populate("rideId", "from to date time status");
  res.json({ success: true, data: complaints });
});


