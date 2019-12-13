// imports
import Validator from "validator";

// local imports
import isEmpty from "./isEmpty";

const validateQuestionInput = data => {

  const errors = {};

  data.question = !isEmpty(data.question) ? data.question : '';

  if (!Validator.isLength(data.question, { min: 3, max: 255 })) {
    errors.question = "The minimum character expected is 3 while maximum is 255"
  }

  if (Validator.isEmpty(data.question)) {
    errors.question = 'Question field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};

const validateAnswerInput = data => {

  const errors = {};

  data.answer = !isEmpty(data.answer) ? data.answer : '';

  if (Validator.isEmpty(data.answer)) {
    errors.answer = 'Answer field is required';
  }

  if (!Validator.isLength(data.answer, { min: 5, max: 400 })) {
    errors.answer = 'The minimum character expected is 5 while maximum is 400';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}

const validateCommentInput = data => {

  const errors = {};

  data.comment = !isEmpty(data.comment) ? data.comment : '';

  if (Validator.isEmpty(data.comment)) {
    errors.comment = 'Comment field is required';
  }

  if (!Validator.isLength(data.comment, { max: 100 })) {
    errors.comment = 'The minimum character expected is 1 while maximum is 100';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };

};

export {
  validateQuestionInput,
  validateAnswerInput,
  validateCommentInput
};
