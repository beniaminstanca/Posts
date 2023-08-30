const User = require("../models/user");
const bycrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator/check");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    const error = new Error("Vlidation failed");
    error.data = errors.array();
    error.statusCode = 422;
    throw error;
  }

  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  try {
    const hashedPw = await bycrypt.hash(password, 12);
    const user = new User({ email, password: hashedPw, name });
    const userSaveResult = await user.save();
    res
      .status(201)
      .json({
        message: "User created successfuly",
        userId: userSaveResult._id,
      });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  try {
    const user = await User.findOne({ email: email });
    console.log(user);
    if (!user) {
      const error = new Error("User with this email couldn't not be found");
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isEqual = await bycrypt.hash(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
      "mysecret",
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: token, userId: loadedUser._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  //   User.findOne({ email: email })
  //     .then((user) => {
  //       if (!user) {
  //         const error = new Error("User with this email could not be found");
  //         error.statusCode = 401;
  //         throw error;
  //       }
  //       loadedUser = user;
  //       return bycrypt.hash(password, user.password);
  //     })
  //     .then((isEqual) => {
  //       if (!isEqual) {
  //         const error = new Error("Wrong password");
  //         error.statusCode = 401;
  //         throw error;
  //       }
  //       const token = jwt.sign(
  //         {
  //           email: loadedUser.email,
  //           userId: loadedUser._id.toString(),
  //         },
  //         "mysecret",
  //         { expiresIn: "1h" }
  //       );
  //       res.status(200).json({ token: token, userId: loadedUser._id.toString() });
  //     })
  //     .catch((err) => {
  //       if (!err.statusCode) {
  //         err.statusCode = 500;
  //       }
  //       next(err);
  //     });
};
