const RATE_PER_KM = 5; // Rs per KM

function calculateFare(distanceKm = 0) {
  const distance = Number(distanceKm) || 0;
  const fare = distance * RATE_PER_KM;
  return Math.max(0, Math.round(fare * 100) / 100);
}

module.exports = {
  RATE_PER_KM,
  calculateFare,
};


