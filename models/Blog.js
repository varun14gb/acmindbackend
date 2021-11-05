const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorRoll: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Blog", UserSchema);
