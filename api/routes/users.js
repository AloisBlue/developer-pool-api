// imports
import express from "express";
import gravatar from "gravatar";

// local imports
import User from "../models/User";
import { validateSignupInput, validateLoginInput } from "../validations/auth"

const router = express.Router();


// @task: Signup
// @Access: Public
// @desc: Enable signup functionality
router.post("/signup", (req, res) => {
  const { errors, isValid } = validateSignupInput(req.body.registerUser);
  if (!isValid) {
    return res.status(400).json({
      status: '400',
      errors
    });
  }

  const { firstName, lastName, userName, email, password  } = req.body.registerUser;

  User
  .findOne({ email })
  .then(userFound => {
    if (userFound) {
      errors.global = "Email already exists"
      return res.status(409).json({
        status: '409',
        errors
      })
    }

    const avatar = gravatar.url(req.body.registerUser.email, {
      s: '200',
      r: 'pg',
      d: 'mm'
    });

    const newUser = new User({
      firstName,
      lastName,
      userName,
      email,
      avatar,
      password
    });

    // hash password function from the model. It saves
    // and returns the newly added user or the error if any
    newUser.hashPassword(newUser, res);
  })
  .catch(err => {
    res.json(err)
  })
});

// @task: Login
// @Access: Public
// @desc: Enable login functionality and generate token
router.post("/login", (req, res) => {
  const { isValid, errors } = validateLoginInput(req.body.credentials);
  if (!isValid) {
    return res.status(400).json({
      status: '400',
      errors
    });
  }

  const { email, password } = req.body.credentials;
  User
    .findOne({ email })
    .then(userFound => {
      // check if user is registered
      if (!userFound) {
        errors.global = "Failed to log in. Confirm email and password";
        return res.status(401).json({
          status: '401',
          errors
        });
      }
      // continue and check password
      userFound.comparePassword(password, userFound)
        .then(match => {
          if (!match) {
            errors.global = "Invalid credentials";
            return res.status(401).json({
              status: '401',
              errors
            });
          }

          // generate authentification token
          const token = userFound.generateAuthToken();
          return res.status(200).json({
            status: '200',
            message: `You have logged in as ${email}`,
            token,
            user: {
                email: userFound.email,
                firstName: userFound.firstName,
                lastName: userFound.lastName,
                userName: userFound.userName,
                avatar: userFound.avatar
              }
          });
        })
        .catch(err => res.json(err));
    })
    .catch(err => {
      res.json(err)
    });
});


export default router;
