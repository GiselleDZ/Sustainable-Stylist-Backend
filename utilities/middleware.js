const { RateLimiterMemory } = require("rate-limiter-flexible");
const slowDown = require("express-slow-down");
const cors = require("cors");

const environment = process.env.NODE_ENV || "development";

// Rate Limiting Settings
const rateLimiter = new RateLimiterMemory({
  points: 2, // Allow 2 requests
  duration: 10, // Per 10 second
});

function rateLimiterMiddleware(req, res, next) {
  rateLimiter
    .consume(req.ip) // Use the requester's IP as a unique identifier
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send("Too many requests");
    });
}

const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 10, // Allow 30 requests per minute without delaying
  delayMs: 500, // Delay the next requests by 100ms per request
});

// use cors
// set origin for using cors
const origin =
  environment === "production"
    ? "https://sustainablestylist.ai"
    : "http://localhost:3000";

const corsOptions = {
  origin: origin,
  optionsSuccessStatus: 200,
};

module.exports = {
  rateLimiterMiddleware,
  speedLimiter,
  origin,
  corsOptions,
};
