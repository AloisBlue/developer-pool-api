// imports
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// local imports
import databaseKeys from "../../config/keys";

const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  avatar: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
});

userSchema.methods.hashPassword = function hashPassword(newUser, res) {
  const { password } = newUser;
  const errors = {};
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      throw err;
    }
    bcrypt.hash(password, salt, (error, hash) => {
      if (error) {
        throw error;
      }
      this.password = hash;
      newUser.save()
        .then(user => {
          res.json(user)
        })
        .catch(() => {
          errors.userName = "User name already taken";
          return res.status(409).json({
            status: '409',
            errors
          });
        });
    });
  });
}

userSchema.methods.comparePassword = function comparePassword(password, userFound) {
  const match = bcrypt
    .compare(password, userFound.password)
    .then(isMatch => {
      if (!isMatch) {
        return false;
      }
      return true;
    });
    return match;
};

userSchema.methods.generateAuthToken = function generateAuthToken() {
  const token = jwt.sign({
    _id: this._id,
    email: this.email,
    password: this.password,
    isAdmin: this.isAdmin
  },
    databaseKeys.keys.SECRET_KEY,
    { expiresIn: 3600 }
);
  return token;
};

export default mongoose.model('User', userSchema);
