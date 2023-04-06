const fs = require("fs");
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
    secret: process.env.SECRET,
    cookie: {
      secure: true,
      httpOnly: true,
    },
    // ... other session options
  })
);

// use cors
app.use(cors(corsOptions));

// Read the key and certificate
let privateKey, certificate;
if (environment === "production") {
  privateKey = fs.readFileSync("sustainablestylistai.key", "utf8");
  certificate = fs.readFileSync("sustainablestylistai.crt", "utf8");
} else {
  privateKey = fs.readFileSync("server.key", "utf8");
  certificate = fs.readFileSync("server.cert", "utf8");
}

// Create an HTTPS service with the Express app
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

// plug routes
app.use("/stylist", stylistRoutes);
app.use("/shopper", shopperRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to my secure server!");
});

httpsServer.listen(PORT, () => {
  console.log(`Secure server listening on port ${PORT}`);
});
