const express = require("express");
const router = express.Router();
require("dotenv").config();
const CreateError = require("http-errors");
const User = require("../app/models/User.model");

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw CreateError.BadRequest();
    }
    const isExist = await User.findOne({ username: email, password });
    if (isExist) {
      throw CreateError.Conflict(`${email} already exists`);
    }
    const isCreate = await User.create({ username: email, password });
    return res.json({
      status: "Successfully created",
      element: isCreate,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", function (req, res) {
  res.send("Welcome to User Page");
});

module.exports = router;
