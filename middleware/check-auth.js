const HttpError = require("../models/http-error.js");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];
    // console.log("req.headers.autorization: ", req.headers.autorization);
    if (!token) {
      throw new Error("No token provided");
    }
    const decodedToken = jwt.verify(token, "supersecret_dont_share");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    const err = new HttpError("Authentication failed, please login again", 401);
    return next(err);
  }
};
