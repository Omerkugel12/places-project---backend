const HttpError = require("../models/http-error.js");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const Place = require("../models/places-model.js");
const User = require("../models/users-model.js");
const mongoose = require("mongoose");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    next(err);
  }

  if (!place) {
    const error = new HttpError(
      `Could not find a place for the provided id: ${placeId}.`,
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    const err = new HttpError(
      "Something went wrong, could not find places for the provided user.",
      500
    );
    next(err);
  }

  // if (places.length === 0) {
  //   const error = new HttpError(
  //     `Could not find a place for the provided userId: ${userId}`,
  //     404
  //   );
  //   return next(error);
  // }

  res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { title, description, address } = req.body;

  const createdPlace = new Place({
    title,
    description,
    address,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    const err = new HttpError("Creating place failed, please try again", 500);
    return next(err);
  }

  if (!user) {
    const err = new HttpError("Could not find user for provided id", 404);
    return next(err);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError("Creating place failed, please try again", 500);
    return next(err);
  }

  res
    .status(201)
    .json({ message: "Place created successfully!", place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { pid: placeId } = req.params;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findByIdAndUpdate(placeId, {
      title: title,
      description: description,
    });
  } catch (error) {
    const err = new HttpError(
      "Something went wrong, Could not update place",
      500
    );
    return next(err);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const err = new HttpError("You are not allowed to edit this place.", 403);
    return next(err);
  }

  res
    .status(200)
    .json({ message: "Place updated successfully!", place: place });
};

const deletePlace = async (req, res, next) => {
  const { pid: placeId } = req.params;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    const err = new HttpError(
      "Something went wrong, Could not update place",
      500
    );
    return next(err);
  }

  if (!place) {
    const err = new HttpError("Could not find place for provided id.", 500);
    return next(err);
  }

  if (place.creator._id.toString() !== req.userData.userId) {
    const err = new HttpError("You are not allowed to delete this place.", 403);
    return next(err);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);
    const err = new HttpError(
      "Something went wrong, Could not update place",
      500
    );
    return next(err);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Place deleted successfully!" });
};

module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
