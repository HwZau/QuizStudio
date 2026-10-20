require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const Question = require('../src/models/Question');
const Quiz = require('../src/models/Quiz');
const demoQuestions = require('./demoQuestions');

async function seedQuiz(admin) {
  const questions = [];
  for (const data of demoQuestions) {
    let question = await Question.findOne({ text: data.text, author: admin._id });
    if (!question) question = await Question.create({ ...data, author: admin._id });
    questions.push(question);
  }
  let quiz = await Quiz.findOne({ title: 'Assignment 4 Quiz' });
  if (!quiz) {
    quiz = await Quiz.create({
      title: 'Assignment 4 Quiz',
      description: 'General knowledge questions from the assignment reference.',
      questions: questions.map((question) => question._id)
    });
  }
  console.log('Demo quiz ready: ' + quiz.title);
  return quiz;
}

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  if (!username) throw new Error('Set ADMIN_USERNAME to an existing admin account.');
  await connectDatabase();
  const admin = await User.findByUsername(username).where({ admin: true });
  if (!admin) throw new Error('Admin not found. Run create-admin first.');
  await seedQuiz(admin);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}
module.exports = { seedQuiz };
