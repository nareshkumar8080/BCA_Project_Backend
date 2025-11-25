const createError = require("http-errors");
const User = require("../models/User");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");
const Rating = require("../models/Rating");
const asyncHandler = require("../utils/asyncHandler");

exports.getStats = asyncHandler(async (req, res) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    riderCount,
    customerCount,
    adminCount,
    totalRides,
    todaysRides,
    activeRides,
    bookedRides,
    completedRides,
    totalBookings,
    todaysBookings,
    totalComplaints,
    openComplaints,
    inactiveUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "rider" }),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "admin" }),
    Ride.countDocuments(),
    Ride.countDocuments({ date: todayStr }),
    Ride.countDocuments({ status: "active" }),
    Ride.countDocuments({ status: "booked" }),
    Ride.countDocuments({ status: "completed" }),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: "open" }),
    User.countDocuments({ isActive: false }),
  ]);

  const [recentUsers, recentRides] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(6).select("name email role rating isActive createdAt"),
    Ride.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("riderId", "name email rating")
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        users: totalUsers,
        riders: riderCount,
        customers: customerCount,
        admins: adminCount,
        inactiveUsers,
      },
      rides: {
        total: totalRides,
        today: todaysRides,
        active: activeRides,
        booked: bookedRides,
        completed: completedRides,
      },
      bookings: {
        total: totalBookings,
        today: todaysBookings,
      },
      complaints: {
        total: totalComplaints,
        open: openComplaints,
      },
      recentUsers,
      recentRides,
    },
  });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filters = {};
  if (role && role !== "all") {
    filters.role = role;
  }
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filters.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  const users = await User.find(filters).sort({ createdAt: -1 }).select("-password");
  res.json({ success: true, data: users });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (req.user.id === id && isActive === false) {
    throw createError(400, "You cannot deactivate your own admin account");
  }

  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select("-password");
  if (!user) {
    throw createError(404, "User not found");
  }
  res.json({ success: true, data: user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.id === id) {
    throw createError(400, "You cannot delete your own account");
  }

  const user = await User.findById(id);
  if (!user) {
    throw createError(404, "User not found");
  }

  const rideIds = await Ride.find({ riderId: id }).distinct("_id");

  await Promise.all([
    Booking.deleteMany({ $or: [{ userId: id }, { rideId: { $in: rideIds } }] }),
    Ride.deleteMany({ _id: { $in: rideIds } }),
    Complaint.deleteMany({ $or: [{ userId: id }, { rideId: { $in: rideIds } }] }),
    Rating.deleteMany({ $or: [{ byUser: id }, { toUser: id }] }),
    User.deleteOne({ _id: id }),
  ]);

  res.json({ success: true, message: "User deleted successfully" });
});

exports.listRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find().populate("riderId", "name email rating");
  res.json({ success: true, data: rides });
});

exports.deleteRide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Ride.findByIdAndDelete(id);
  await Booking.deleteMany({ rideId: id });
  await Complaint.deleteMany({ rideId: id });
  res.json({ success: true, message: "Ride removed" });
});

exports.getComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find()
    .populate("userId", "name email")
    .populate("rideId", "from to date time status");
  res.json({ success: true, data: complaints });
});


