import mongoose from "mongoose";

const { Schema } = mongoose;

const questionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  question: {
    type: String,
    required: true
  },
  answers: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      question: {
        type: Schema.Types.ObjectId,
        ref: 'Question'
      },
      answer: {
        type: String,
        required: true
      },
      comments: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
          },
          answer: {
            type: Schema.Types.ObjectId,
            ref: 'Question'
          },
          comment: {
            type: String,
            required: true
          }
        }
      ],
      check: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        max: 1
      },
      upvote: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        }
      ],
      downvote: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        }
      ],
      time: {
        type: Date,
        default: Date.now
      }
    }
  ]
}
);

export default mongoose.model('Question', questionSchema)
