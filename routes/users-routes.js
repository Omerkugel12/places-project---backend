const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload.js");

const {
  getUsers,
  signup,
  login,
} = require("../controllers/users-controller.js");

const router = express.Router();

router.get("/", getUsers);
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 5 }),
  ],
  signup
);
router.post(
  "/login",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 5 }),
  ],
  login
);

module.exports = router;
