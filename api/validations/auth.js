import Validator from "validator";

import isEmpty from "./isEmpty";

const validateSignupInput = data => {

  const errors = {};

  data.firstName = !isEmpty(data.firstName) ? data.firstName : '',
  data.lastName = !isEmpty(data.lastName) ? data.lastName : '',
  data.userName = !isEmpty(data.userName) ? data.userName : '',
  data.email = !isEmpty(data.email) ? data.email : '',
  data.password = !isEmpty(data.password) ? data.password : '',
  data.confirmPassword = !isEmpty(data.confirmPassword) ? data.confirmPassword : '';

  if (!Validator.isLength(data.firstName, { min: 1, max: 20 })) {
    errors.firstName = 'First name must be between 1 and 20 characters';
  }

  if (Validator.isEmpty(data.firstName)) {
    errors.firstName = 'First name field is required';
  }

  if (!Validator.isLength(data.lastName, { min: 1, max: 20 })) {
    errors.lastName = 'Last name must be between 1 and 20 characters';
  }

  if (Validator.isEmpty(data.lastName)) {
    errors.lastName = 'Last name field is required';
  }

  if (!Validator.isLength(data.userName, { min: 1, max: 20 })) {
    errors.userName = 'User name must be between 1 and 20 characters';
  }

  if (Validator.isEmpty(data.userName)) {
    errors.userName = 'User name field is required';
  }

  if (!Validator.isEmail(data.email)) {
    errors.email = 'Email is invalid'
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = 'Email field is required'
  }

  if (!data.password.match('^(?=.{8,}$)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%&^+=!]).*')) {
    errors.password = 'A good password should contain uppercase, lowercase, special characters @#$%&^+=! , digits and above 8 characters'
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords must match!!!';
  }

  if (Validator.isEmpty(data.confirmPassword)) {
    errors.confirmPassword = 'Confirm password field is required'
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

const validateLoginInput = data => {

  const errors = {};

  data.email = !isEmpty(data.email) ? data.email : '',
  data.password = !isEmpty(data.password) ? data.password : '';

  if (!Validator.isEmail(data.email)) {
    errors.email = 'Email is invalid';
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = 'Email field is required';
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };

};

export {
  validateSignupInput,
  validateLoginInput
};
