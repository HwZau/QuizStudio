const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const { HttpError, pickFields } = require('../utils/http');

const questionFields = ['text', 'options', 'keywords', 'correctAnswerIndex'];

async function listQuestions(_req, res) {
  res.json(await Question.find().sort({ _id: 1 }).populate('author', 'username'));
}

async function getQuestion(req, res) {
  const question = await Question.findById(req.params.questionId).populate('author', 'username');
  if (!question) throw new HttpError(404, 'Question not found.');
  res.json(question);
}

async function createQuestion(req, res) {
  const question = await Question.create({
    ...pickFields(req.body, questionFields),
    author: req.user._id
  });
  res.status(201).json(question);
}

async function updateQuestion(req, res) {
  const changes = pickFields(req.body, questionFields);
  const question = await Question.findById(req.params.questionId);
  if (!question) throw new HttpError(404, 'Question not found.');
  question.set(changes);
  await question.save();
  res.json(question);
}

async function deleteQuestion(req, res) {
  const question = await Question.findById(req.params.questionId);
  if (!question) throw new HttpError(404, 'Question not found.');
  await Quiz.updateMany(
    { questions: question._id },
    { $pull: { questions: question._id } }
  );
  await question.deleteOne();
  res.status(204).end();
}

module.exports = {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  questionFields
};
