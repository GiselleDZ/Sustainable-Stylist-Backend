const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");

require("dotenv").config();

const stylistRoutes = require("./api/stylist.js");
const shopperRoutes = require("./api/shopper.js");
const {
  rateLimiterMiddleware,
  speedLimiter,
  corsOptions,
} = require("./utilities/middleware.js");

// create app
const app = express();

const environment = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 8000;

// Use Helmet middleware
app.use(helmet());

// Use body-parser middleware to parse JSON payloads
app.use(bodyParser.json());

// Use Rate Limiter
app.use(rateLimiterMiddleware);

// Use Speed Limiter to slow down requests for clients making too many requests, to mitigate denial-of-service attacks
app.use(speedLimiter);

// use expression session cookie options
app.use(
  session({
    secret: process.env.SECRET || "dev-secret",
    cookie: {
      secure: environment === "production",
      httpOnly: true,
    },
  })
);

// use cors
app.use(cors(corsOptions));

// plug routes
app.use("/stylist", stylistRoutes);
app.use("/shopper", shopperRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Sustainable Stylist API!");
});

// In production (Railway/Render), TLS is terminated by the platform — run plain HTTP.
// In development, use HTTPS if local certs exist, otherwise HTTP.
if (environment === "production") {
  http.createServer(app).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
} else {
  const keyPath = "server.key";
  const certPath = "server.cert";
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const credentials = {
      key: fs.readFileSync(keyPath, "utf8"),
      cert: fs.readFileSync(certPath, "utf8"),
    };
    https.createServer(credentials, app).listen(PORT, () => {
      console.log(`Secure dev server listening on port ${PORT}`);
    });
  } else {
    http.createServer(app).listen(PORT, () => {
      console.log(`Dev server listening on port ${PORT} (HTTP)`);
    });
  }
}
