const createError = require("http-errors");
const Rating = require("../models/Rating");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");

exports.rateUser = asyncHandler(async (req, res) => {
  const { rideId, toUserId, stars, review } = req.body;

  if (!rideId || !toUserId || !stars) {
    throw createError(400, "Missing required fields");
  }

  // Check if user account is active
  const user = await User.findById(req.user.id);
  if (!user || !user.isActive) {
    throw createError(403, "Account deactivated. You cannot rate users.");
  }

  if (req.user.id === toUserId) {
    throw createError(400, "You cannot rate yourself");
  }

  if (!mongoose.Types.ObjectId.isValid(rideId) || !mongoose.Types.ObjectId.isValid(toUserId)) {
    throw createError(400, "Invalid identifiers supplied");
  }

  const numericStars = Number(stars);
  if (Number.isNaN(numericStars) || numericStars < 1 || numericStars > 5) {
    throw createError(400, "Stars must be between 1 and 5");
  }

  const rideObjectId = new mongoose.Types.ObjectId(rideId);
  const toUserObjectId = new mongoose.Types.ObjectId(toUserId);
  const ride = await Ride.findById(rideObjectId).populate("riderId", "name email");
  if (!ride) {
    throw createError(404, "Ride not found");
  }
  if (ride.status !== "completed") {
    throw createError(400, "Ride must be completed before leaving a rating");
  }

  const completedBookings = await Booking.find({
    rideId: rideObjectId,
    status: "completed",
  })
    .populate("userId", "name email")
    .lean();

  if (!completedBookings.length) {
    throw createError(400, "Ride does not have any completed passengers");
  }

  const isRider = ride.riderId?._id?.toString() === req.user.id;
  const isPassenger = completedBookings.some(
    (booking) => booking.userId?._id?.toString() === req.user.id
  );

  if (!isRider && !isPassenger && req.user.role !== "admin") {
    throw createError(403, "You must be part of this ride to rate");
  }

  const allowedTargets = new Set();
  if (isPassenger || req.user.role === "admin") {
    allowedTargets.add(ride.riderId?._id?.toString());
  }
  if (isRider || req.user.role === "admin") {
    completedBookings.forEach((booking) => {
      if (booking.userId?._id) {
        allowedTargets.add(booking.userId._id.toString());
      }
    });
  }

  const toUserString = toUserObjectId.toString();

  if (!allowedTargets.has(toUserString)) {
    throw createError(400, "Invalid rating target for this ride");
  }

  const existing = await Rating.findOne({
    rideId: rideObjectId,
    byUser: req.user.id,
    toUser: toUserObjectId,
  });
  if (existing) {
    throw createError(400, "You already shared a rating for this ride");
  }

  const rating = await Rating.create({
    byUser: req.user.id,
    toUser: toUserObjectId,
    rideId,
    stars: numericStars,
    review,
  });

  const [aggregate] = await Rating.aggregate([
    { $match: { toUser: toUserObjectId } },
    { $group: { _id: "$toUser", avgStars: { $avg: "$stars" } } },
  ]);

  if (aggregate?.avgStars !== undefined) {
    await User.findByIdAndUpdate(
      toUserId,
      { rating: Number(aggregate.avgStars.toFixed(2)) },
      { new: false }
    );
  }

  res.status(201).json({
    success: true,
    data: rating,
  });
});

exports.getUserRatings = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const ratings = await Rating.find({ toUser: userId }).populate("byUser", "name");

  const average =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + Number(r.stars), 0) / ratings.length : 0;

  res.json({
    success: true,
    data: {
      average: Number(average.toFixed(2)),
      total: ratings.length,
      reviews: ratings,
    },
  });
});
