const jwt = require("jsonwebtoken");
require("dotenv").config();

function auth(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const bearerToken = bearerHeader.split(" ")[1];
    jwt.verify(bearerToken, process.env.secretkey, (err, decoded) => {
      if (err) {
        res.json({
          success: false,
          message: "Authentication Failed",
        });
      } else {
        res.user = decoded;
        next();
      }
    });
  } else {
    res.json({
      success: false,
      message: "No Bearer Token",
    });
  }
}

module.exports = { auth };
