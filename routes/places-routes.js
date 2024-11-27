const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload.js");
const checkAuth = require("../middleware/check-auth.js");

const {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
} = require("../controllers/places-controller.js");

const router = express.Router();

router.get("/:pid", getPlaceById);
router.get("/user/:uid", getPlacesByUserId);
router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  updatePlace
);

router.delete("/:pid", deletePlace);

module.exports = router;
