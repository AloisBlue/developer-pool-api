// imports
import express from "express";

// local imports
import auth from "../middlewares/auth";
import Question from "../models/Question";
import {
  validateQuestionInput, validateAnswerInput, validateCommentInput
} from "../validations/questionInput";

const router = express.Router();


// @task: Post a question
// @Access: Private(User)
// @desc: Enable logged in users to ask questions
router.post("/question", auth, (req, res) => {
  const { errors, isValid } = validateQuestionInput(req.body.addQuestion);
  if (!isValid) {
    res.status(400).json({
      status: '400',
      errors
    });
  }

  const { question } = req.body.addQuestion;
  Question
    .findOne({question})
    .then(questionFound => {
      if (questionFound) {
        // abort the process and give relevant response
          return res.status(409).json({
            status: '409',
            questionExists: 'question already asked',
            request: {
              type: 'GET',
              url: `http://127.0.0.1:8080/api/questions/${questionFound._id}`
            }
          });
      }
      const newQuestion = new Question({
        user: req.user._id,
        question
      });
      // save to database
      newQuestion
        .save()
        .then(savedQuestion => {
          res.status(201).json({
            status: '201',
            savedQuestion: {
              _id: savedQuestion._id,
              question: savedQuestion.question,
              user: {
                _id: savedQuestion.user._id
              }
            }
          })
        })
        .catch(error => res.json(error));
    })
    .catch(err => res.json(err));
});

// @task: Get all question
// @Access: Public
// @desc: Enable anyone to view the questions
router.get("/questions", (req, res) => {
  Question
    .find()
    .select('_id question user')
    .populate('user', ['userName'])
    .then(questionsFound => {
      if (questionsFound.length === 0) {
        return res.json({
          status: '404',
          errors: {
            notFound: 'There are no questions available'
          }
        });
      }
      // continue
      res.json({
        status: '200',
        message: 'Question(s) listed below',
        count: questionsFound.length,
        questionsFound
      });
    })
    .catch(err => res.json(err));
});

// @task: Get a question by id
// @Access: Private
// @desc: Enable logged in user to view the question by id
router.get("/:question_id", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .select('_id question answers user')
    .populate('user', ['userName'])
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      res.status(200).json({
        status: '200',
        questionFound
      });
    })
    .catch(() => res.status(404).json({
      status: '404',
      errors: {
        notFound: 'Question by that id not found'
      }
    }));
});

// @task: Edit (PUT) a question if there are no answers
// @Access: Private(User)
// @desc: Enable question owner to edit, should be logged in
router.put("/:question_id", auth, (req, res) => {
  const params = req.params.question_id;
  const updateQuestion = req.body.putQuestion;
  const { question } = updateQuestion;
  const { errors, isValid } = validateQuestionInput(updateQuestion);

  // validate question update field input
  if (!isValid) {
    return res.status(400).json({
      status: '400',
      errors
    });
  }

  Question
    .findOne({ _id: params })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // check to confirm the update is granted to the user who asked the question
      if (questionFound.user.toString() !== req.user._id) {
        return res.status(401).json({
          status: '401',
          errors: {
            noAuth: 'You don/t have that permission to edit the question'
          }
        });
      }

      // check if question already has answers
      // ensure no updates if the question already has answers
      if (questionFound.answers.length !== 0) {
        return res.status(400).json({
          status: '400',
          errors: {
            answerFound: 'The question cannot be edited since it already has answers'
          }
        });
      }

      // check for changes in question
      // ensure no updates if no changes detected
      if (questionFound.question === question) {
        return res.status(409).json({
          status: '409',
          errors: {
            noChange: 'No changes in question detected'
          }
        });
      }

      Question
        .findOneAndUpdate({ _id: params }, updateQuestion, { new: true })
        .select('_id question answers user')
        .then(updatedQuestion => {
          res.status(200).json({
            status: '200',
            message: 'Question successfully updated',
            updatedQuestion
          })
        })
        .catch(err => res.json(err));
    })
    .catch(() => res.status(404).json({
      status: '404',
      errors: {
        notFound: 'Question by that id not found'
      }
    }));
});

// @task: Delete a question by id
// @Access: Private(Admin, User)
// @desc: Enable question owner and admin to delete question
router.delete("/:question_id", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      // check if question exists
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id is either deleted or does not exists'
          }
        });
      }

      // check owner
      if (questionFound.user.toString() === req.user._id || req.user.isAdmin === true) {
        questionFound
          .remove()
          .then(() => res.status(200).json({
            status: '200',
            message: 'Question deleted'
          }))
          .catch(err => res.json(err));
      } else {
        return res.status(401).json({
          status: '401',
          errors: {
            noAuth: 'You don/t have that permission to delete the question'
          }
        });
      }
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id is either deleted or does not exists'
        }
      });
    });
});

// @task: Answer a question
// @Access: Private(Users)
// @desc: Enable users to answers a question
router.post("/:question_id/answer", auth, (req, res) => {
  const { addAnswer } = req.body;
  const { answer } = addAnswer;
  const { errors, isValid } = validateAnswerInput(addAnswer);

  // check for empty fields
  if (!isValid) {
    return res.status(400).json({
      status: '400',
      errors
    });
  }
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue

      // get user id and question id
      const user = req.user._id;
      const question = questionFound._id;

      // set answer
      const newAnswer = {
        answer,
        user,
        question
      };

      // add the answer
      questionFound
        .answers
        .unshift(newAnswer)

      // save the answer
      questionFound
        .save()
        .then(answered => {
          return res.status(201).json({
            status: '201',
            _id: answered._id,
            user: answered.user,
            question: answered.question,
            answers: answered.answers
          })
        })
        .catch(err => res.json(err));
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id not found'
        }
      });
    });
});

// @task: Check an answer
// @Access: Private(Users - question owner)
// @desc: Enable question owner to check one answer as accepted
router.post("/:question_id/:answer_id/check", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // confirm only the question owner can check it as accepted
      if (questionFound.user.toString() !== req.user._id) {
        return res.status(401).json({
          status: '401',
          errors: {
            notAuth: 'Only the question owner can check an answer'
          }
        });
      }

      // confirm no question is checked
      for (let i = 0; i < questionFound.answers.length; i++) {
        if (questionFound.answers[i].check) {
          return res.json({
            status: '400',
            errors: {
              alreadyChecked: 'You have already checked another answer'
            }
          });;
        }
      }

      // filter the answers to obtain favorite answer
      const filteredAnswer = questionFound
        .answers
        .filter(answer => answer._id.toString() === req.params.answer_id);

      // return not found if no answer_id that matches the params
      if (filteredAnswer.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Answer by that id not found'
          }
        });
      }

      // check key and user id value
      const check = {
        check: req.user._id
      }
      // save user id
      for (let i = 0; i < filteredAnswer.length; i++) {
        filteredAnswer[i]
          .set(check)
        questionFound
          .save()
          .then(checkedQuestion => {
            res.json({
              status: '201',
              message: 'Answer checked',
              checkedQuestion
            });
          })
          .catch(err => res.json(err));
        break;
      }
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Answer by that id not found'
        }
      });
    })
});

// @task: Uncheck an answer
// @Access: Private(Users - question owner)
// @desc: Enable question owner to uncheck an answer
router.post("/:question_id/:answer_id/uncheck", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // confirm only the question owner can uncheck an accepted answer
      if (questionFound.user.toString() !== req.user._id) {
        return res.status(401).json({
          status: '401',
          errors: {
            noAuth: 'Only the question owner can uncheck an answer'
          }
        });
      }

      // check if answer exists
      const confirmQuestionExists = questionFound
        .answers
        .filter(answer => answer._id.toString() === req.params.answer_id);

      // return if answer doesn't exist
      if (confirmQuestionExists.length === 0) {
        return  res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Answer by that id not found'
          }
        });
      }

      // confirm if the answer has been checked before unchecking
      for (let i = 0; confirmQuestionExists.length; i++) {
        if (!confirmQuestionExists[i].check) {
          return res.status(400).json({
            status: '400',
            errors: {
              notChecked: 'The answer has not been checked'
            }
          });
        }
        // uncheck answer
        confirmQuestionExists[i].check = null;
        // save
        questionFound
          .save()
          .then(answer => {
            return res.status(200).json({
              status: '200',
              message: 'Answer unchecked',
              answer
            });
          })
          .catch(err => res.json(err));
        break;
      }
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id not found'
        }
      });
    });
});

// @task: Upvote an answer
// @Access: Private(Users)
// @desc: Enable users to upvote an answer they like
router.post("/:question_id/:answer_id/upvote", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // find the answer
      const filteredAnswer = questionFound
        .answers
        .filter(answer => answer._id.toString() === req.params.answer_id);

      if (filteredAnswer.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Answer by that id not found'
          }
        });
      }
      // ensure a user upvotes once
      for (let i = 0; filteredAnswer.length; i++) {
        const filterUpvote = filteredAnswer[i]
          .upvote
          .filter(upvote => upvote.user.toString() === req.user._id);
        if (filterUpvote.length !== 0) {
          return res.status(400).json({
            status: '404',
            errors: {
              alreadyUpvoted: 'You have already upvoted this answer'
            }
          });
        }
        // set upvote
        const makeUpvote = {
          user: req.user._id
        };
        // make upvote
        filteredAnswer[i]
          .upvote
          .unshift(makeUpvote)
        // save
        questionFound
          .save()
          .then(answer => {
            res.status(201).json({
              status: '201',
              message: 'You have upvoted the answer',
              answer
            });
          })
          .catch(err => res.json(err));
        break;
      }
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id not found'
        }
      });
    });
});

// @task: Un-upvote an answer
// @Access: Private(Users)
// @desc: Enable users to un-upvote an answer they have upvoted
router.post("/:question_id/:answer_id/unupvote", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // find the answer
      const filteredAnswer = questionFound
        .answers
        .filter(answer => answer._id.toString() === req.params.answer_id);

      if (filteredAnswer.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Answer by that id not found'
          }
        });
      }

      // un-upvote if and only if the answer has been upvoted
      // ensure that only the upvoter can un-upvote
      for (let i = 0; filteredAnswer.length; i++) {
        const filterUpvote = filteredAnswer[i]
          .upvote
          .filter(upvote => upvote.user.toString() === req.user._id);

        if (filterUpvote.length === 0) {
          return res.status(400).json({
            status: '400',
            errors: {
              notUpvoted: 'You have not upvoted the answer'
            }
          });
        }

        // create remove index
        const removeIndex = filteredAnswer[i]
          .upvote
          .map(upvote => upvote.user.toString())
          .indexOf(req.user._id);

        // remove upvote
        filteredAnswer[i]
          .upvote
          .splice(removeIndex, 1)

        // save
        questionFound
          .save()
          .then(unupvote => {
            return res.status(200).json({
              status: '200',
              message: 'You have un upvoted the answer',
              unupvote
            });
          })
          .catch(err => res.json(err));
        break;
      };
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id not found'
        }
      });
    })
});

// @task: Downvote an answer
// @Access: Private(Users)
// @desc: Enable users to downvote an answer they don't prefer
router.post("/:question_id/:answer_id/downvote", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // find the answer
      const filteredAnswer = questionFound
        .answers
        .filter(answer => answer._id.toString() === req.params.answer_id);

      // return not found if no answer
      if (filteredAnswer.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Answer by that id not found'
          }
        });
      }

      for (let i = 0; filteredAnswer.length; i++) {
        // check if the user has already downvoted
        const filterDownvote = filteredAnswer[i]
          .downvote
          .filter(downvote => downvote.user.toString() === req.user._id);

        // return 400 bad request if the user has already downvoted
        if (filterDownvote.length !== 0) {
          return res.status(400).json({
            status: '400',
            errors: {
              alreadyDownvoted: 'You have already downvoted'
            }
          });
        }

        // create downvote
        const makeDownvote = {
          user: req.user._id
        };

        // set downvote
        filteredAnswer[i]
          .downvote
          .unshift(makeDownvote)

        // save
        questionFound
          .save()
          .then(downvote => {
            res.status(201).json({
              status: '201',
              message: 'You have downvoted the answer',
              downvote
            })
          })
          .catch(err => res.json(err));
        break;
      }
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id not found'
        }
      });
    });
});

// @task: Un-downvote an answer
// @Access: Private(Users)
// @desc: Enable users to un-downvote an answer they have downvoted
router.post("/:question_id/:answer_id/undownvote", auth, (req, res) => {
  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // find the answer
      const filteredAnswer = questionFound
        .answers
        .filter(answer => answer._id.toString() === req.params.answer_id);

      // return not found if no answer
      if (filteredAnswer.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Answer by that id not found'
          }
        });
      }
      // ensure no un-downvoting for non downvoted answers
      for (let i = 0; filteredAnswer.length; i++) {
        console.log(filteredAnswer[i]);
        // filter downvotes
        const filterDownvote = filteredAnswer[i]
          .downvote
          .filter(downvote => downvote.user.toString() === req.user._id);

        // return bad request if user has not downvoted
        if (filterDownvote.length === 0) {
          return res.status(400).json({
            status: '400',
            notDownvoted: 'You have not downvoted the answer'
          });
        }

        // create remove index
        const removeIndex = filteredAnswer[i]
          .downvote
          .map(undownvote => undownvote.user.toString())
          .indexOf(req.user._id);

        // un-downvote
        filteredAnswer[i]
          .downvote
          .splice(removeIndex, 1)

        // save
        questionFound
          .save()
          .then(undownvoted => {
            return res.status(200).json({
              status: '200',
              message: 'You have un downvoted the answer',
              undownvoted
            });
          })
          .catch(err => res.json(err));

        break;
      }
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id not found'
        }
      });
    });
});

// @task: Comment on an answer
// @Access: Private(Users)
// @desc: Enable users to comment on an answer
router.post("/:question_id/:answer_id/comment", auth, (req, res) => {
  const { addComment } = req.body;
  const { errors, isValid } = validateCommentInput(addComment);

  // return error if no comment field or if field is empty
  if (!isValid) {
    return res.status(400).json({
      status: '400',
      errors
    });
  }

  Question
    .findOne({ _id: req.params.question_id })
    .then(questionFound => {
      if (!questionFound) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Question by that id not found'
          }
        });
      }
      // continue
      // find the answer
      const filteredAnswer = questionFound
        .answers
        .filter(answer => answer._id.toString() === req.params.answer_id);

      // return not found if no answer
      if (filteredAnswer.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'Answer by that id not found'
          }
        });
      }
      // access array like object
      for (let i = 0; filteredAnswer.length; i++) {
        // get the comment
        const { comment } = addComment;

        // create comment object
        const newComment = {
          user: req.user._id,
          answer: filteredAnswer[i]._id,
          comment
        };

        // set the object
        filteredAnswer[i]
          .comments
          .unshift(newComment);

        questionFound
          .save()
          .then(commented => {
            return res.status(201).json({
              status: '201',
              message: 'Answer commented',
              commented
            });
          })
          .catch(err => res.json(err));
        break;
      }
    })
    .catch(() => {
      return res.status(404).json({
        status: '404',
        errors: {
          notFound: 'Question by that id not found'
        }
      });
    });
});

// @task: Question with most answers
// @Access: Private(Users)
// @desc: Enable users to view the question with most answers
router.get("/questions/mostanswered", auth, (req, res) => {
  Question
    .find()
    .select('_id user question answers')
    .populate('user', ['userName'])
    .then(questionsFound => {
      if (questionsFound.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'There are no questions available'
          }
        })
      }
      // continue
      // map the answers and the number of answers in specifice questions
      const mappedAnswers = questionsFound
        .map(question => question.answers.length);

      // check for questions with no answers
      const noAnswers = questionsFound
        .filter(question => question.answers.length === 0);

      // return if no answers yet
      if (mappedAnswers.length === noAnswers.length) {
        return res.status(400).json({
          status: '400',
          errors: {
            noAnswers: 'There are no answers yet for the questions'
          }
        });
      }

      // get the search index on question with the highest answers
      const searchIndex = mappedAnswers
        .indexOf(Math.max(...mappedAnswers));

      // get the question with most answers
      const mostAnswered = questionsFound[searchIndex];

      // handle a case where there more than one question with equal -
      // and highest answers
      // map question answers
      const moreThanOneQuestion = questionsFound
        .map(question => question.answers);

      // get array of questions with highest matched answers
      const filterMoreThanOneQuestion = moreThanOneQuestion
        .filter(answers => answers.length === Math.max(...mappedAnswers));

      if (filterMoreThanOneQuestion.length <= 1) {
        return res.status(200).json({
          status: '200',
          answersCount: mostAnswered.answers.length,
          message: `The question from ${mostAnswered.user.userName} received most answers, (${mostAnswered.answers.length}) in total`,
          mostAnswered
        });
      }
      return res.status(200).json({
        status: '200',
        answersCount: mostAnswered.answers.length,
        message: `The question from ${mostAnswered.user.userName} received most answers, (${mostAnswered.answers.length}) in total`,
        note: 'There are other question with the same number of answers. However, this question was asked earlier.',
        mostAnswered
      });
    })
    .catch(err => res.json(err))
});

// @task: All user questions
// @Access: Private(Users)
// @desc: Enable users to view all their questions
router.get("/questions/all", auth, (req, res) => {
  Question
    .find({ user: req.user._id })
    .select('_id user question answers')
    .then(userQuestions => {
      if (userQuestions.length === 0) {
        return res.status(404).json({
          status: '404',
          errors: {
            notFound: 'This user has no questions yet'
          }
        });
      }
      // continue
      const noOfQuestions = userQuestions.length;

      res.status(200).json({
        status: '200',
        questionsCount: noOfQuestions,
        message: `You have ${noOfQuestions} questions`,
        userQuestions
      });
    })
    .catch(err => res.json(err));
});

export default router;
