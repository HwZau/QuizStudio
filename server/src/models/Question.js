const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  options: {
    type: [{ type: String, required: true, trim: true }],
    required: true,
    validate: {
      validator: (options) => options.length >= 2,
      message: 'A question must have at least two options.'
    }
  },
  keywords: { type: [{ type: String, trim: true }], default: [] },
  correctAnswerIndex: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator(index) {
        return Number.isInteger(index) && index < this.options.length;
      },
      message: 'correctAnswerIndex must point to an existing option.'
    }
  }
});

module.exports = mongoose.model('Question', questionSchema);
