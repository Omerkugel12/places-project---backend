const fs = require("fs");
const path = require("path");
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 5000;
const HttpError = require("./models/http-error.js");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mszwmyg.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

const placesRoutes = require("./routes/places-routes.js");
const usersRoutes = require("./routes/users-routes.js");

const app = express();

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
//   next();
// });

app.use(bodyParser.json());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));

  // Serve index.html for any other route
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// app.use((req, res, next) => {
//   const error = new HttpError("Could not find the route.", 404);
//   throw error;
// });

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured!" });
});

mongoose
  .connect(uri)
  .then(() => {
    app.listen(PORT, () => {
      console.log("listening on port " + PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });
