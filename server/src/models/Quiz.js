const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  questions: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    default: []
  }
});

module.exports = mongoose.model('Quiz', quizSchema);
