const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const { questionFields } = require('./questionController');
const { HttpError, pickFields } = require('../utils/http');

async function checkQuestionIds(ids) {
  if (!Array.isArray(ids)) {
    throw new HttpError(400, 'questions must be an array of question IDs.');
  }
  const values = ids.map(String);
  if (values.some((id) => !/^[a-f\d]{24}$/i.test(id))) {
    throw new HttpError(400, 'questions contains an invalid ObjectId.');
  }
  if (new Set(values).size !== values.length) {
    throw new HttpError(400, 'questions contains duplicate IDs.');
  }
  const count = await Question.countDocuments({ _id: { $in: values } });
  if (count !== values.length) {
    throw new HttpError(400, 'questions contains an ID that does not exist.');
  }
}

async function findQuiz(id) {
  const quiz = await Quiz.findById(id);
  if (!quiz) throw new HttpError(404, 'Quiz not found.');
  return quiz;
}

function questionPopulation(user) {
  return { path: 'questions', select: user.admin ? '' : '-correctAnswerIndex' };
}

async function listQuizzes(req, res) {
  res.json(await Quiz.find().populate(questionPopulation(req.user)));
}

async function getQuiz(req, res) {
  const quiz = await Quiz.findById(req.params.quizId).populate(questionPopulation(req.user));
  if (!quiz) throw new HttpError(404, 'Quiz not found.');
  res.json(quiz);
}

async function createQuiz(req, res) {
  const data = pickFields(req.body, ['title', 'description', 'questions']);
  if (data.questions !== undefined) await checkQuestionIds(data.questions);
  const quiz = await Quiz.create(data);
  res.status(201).json(await quiz.populate('questions'));
}

async function updateQuiz(req, res) {
  const changes = pickFields(req.body, ['title', 'description', 'questions']);
  if (changes.questions !== undefined) await checkQuestionIds(changes.questions);
  const quiz = await findQuiz(req.params.quizId);
  quiz.set(changes);
  await quiz.save();
  res.json(await quiz.populate('questions'));
}

async function deleteQuiz(req, res) {
  const quiz = await Quiz.findByIdAndDelete(req.params.quizId);
  if (!quiz) throw new HttpError(404, 'Quiz not found.');
  res.status(204).end();
}

async function getCapitalQuestions(req, res) {
  const quiz = await Quiz.findById(req.params.quizId).populate({
    ...questionPopulation(req.user),
    match: { text: { $regex: '\\bcapital\\b', $options: 'i' } }
  });
  if (!quiz) throw new HttpError(404, 'Quiz not found.');
  res.json(quiz);
}

async function submitQuiz(req, res) {
  const answers = req.body?.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new HttpError(400, 'answers must be an object keyed by question ID.');
  }
  const quiz = await Quiz.findById(req.params.quizId).populate('questions');
  if (!quiz) throw new HttpError(404, 'Quiz not found.');
  const review = quiz.questions.map((question) => {
    const selectedIndex = answers[question.id];
    const validSelection = Number.isInteger(selectedIndex) &&
      selectedIndex >= 0 && selectedIndex < question.options.length;
    return {
      questionId: question.id,
      text: question.text,
      selectedIndex: validSelection ? selectedIndex : null,
      correctAnswerIndex: question.correctAnswerIndex,
      correctOption: question.options[question.correctAnswerIndex],
      correct: validSelection && selectedIndex === question.correctAnswerIndex
    };
  });
  res.json({
    quizId: quiz.id,
    title: quiz.title,
    score: review.filter((item) => item.correct).length,
    total: review.length,
    review
  });
}

async function addQuestion(req, res) {
  const quiz = await findQuiz(req.params.quizId);
  const data = pickFields(req.body, questionFields);
  const question = await Question.create({ ...data, author: req.user._id });
  try {
    quiz.questions.push(question._id);
    await quiz.save();
  } catch (error) {
    await Question.deleteOne({ _id: question._id });
    throw error;
  }
  res.status(201).json(question);
}

async function addQuestions(req, res) {
  const quiz = await findQuiz(req.params.quizId);
  if (!Array.isArray(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'Request body must be a nonempty JSON array.');
  }
  const payloads = req.body.map((item) => pickFields(item, questionFields));
  const drafts = payloads.map((item) => new Question({ ...item, author: req.user._id }));
  for (const draft of drafts) await draft.validate();

  const questions = await Question.insertMany(drafts);
  try {
    quiz.questions.push(...questions.map((question) => question._id));
    await quiz.save();
  } catch (error) {
    await Question.deleteMany({ _id: { $in: questions.map((question) => question._id) } });
    throw error;
  }
  res.status(201).json({ message: 'Questions added successfully.', questions });
}

module.exports = {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getCapitalQuestions,
  submitQuiz,
  addQuestion,
  addQuestions
};
