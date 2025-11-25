const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
{
byUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
stars: { type: Number, min: 1, max: 5, required: true },
review: { type: String },
},
{ timestamps: true }
);

module.exports = mongoose.model("Rating", ratingSchema);
