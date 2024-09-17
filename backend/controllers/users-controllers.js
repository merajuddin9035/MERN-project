const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};
const getUserById = async (req, res, next) => {
  const userId = req.params.id; // Get the user ID from the URL parameters

  let user;
  try {
    user = await User.findById(userId, '-password'); // Exclude the password field

    if (!user) {
      const error = new HttpError('Could not find a user for the provided id.', 404);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not retrieve the user.',
      500
    );
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) }); // Return the user object
};


const deleteUser = async (req, res, next) => {
  const userId = req.params.id;

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      const error = new HttpError('Could not find a user for this id.', 404);
      return next(error);
    }

    await user.remove(); 
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete user.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted user.' });
};

const updateUser = async (req, res, next) => {
  const userId = req.params.id;
  const { name, email, password } = req.body;

  let user;
  try {
    user = await User.findById(userId);

    if (!user) {
      const error = new HttpError('Could not find a user for this id.', 404);
      return next(error);
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update user.',
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};




const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: 'https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg',
    password,
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Loggin in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  res.json({
    message: 'Logged in!',
    user: existingUser.toObject({ getters: true })
  });
};

exports.getUsers = getUsers;
exports.getUserById= getUserById;
exports.deleteUser=deleteUser;
exports.updateUser=updateUser;
exports.signup = signup;
exports.login = login;
