const { test, expect } = require('@playwright/test');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server/src/app');
const User = require('../server/src/models/User');
const Question = require('../server/src/models/Question');
const Quiz = require('../server/src/models/Quiz');
const demoQuestions = require('../server/scripts/demoQuestions');

let server;
let baseUrl;
let databaseName;
const pageErrors = new WeakMap();

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  process.env.JWT_SECRET = 'assignment4-browser-tests-local-secret';
  databaseName = 'Assignment4E2E_' + process.pid + '_' + Date.now();
  await mongoose.connect('mongodb://127.0.0.1:27017', { dbName: databaseName });
  await User.init();
  const passwordHash = await bcrypt.hash('password123', 4);
  const mary = await User.create({ username: 'Mary', passwordHash, admin: true });
  await User.create({ username: 'John', passwordHash, admin: false });
  const questions = await Question.insertMany(demoQuestions.map((question) => ({ ...question, author: mary._id })));
  await Quiz.create({
    title: 'Assignment 4 Quiz', description: 'Reference quiz',
    questions: questions.map((question) => question._id)
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

test.afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1 && databaseName?.startsWith('Assignment4E2E_')) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

async function login(page, username) {
  await page.goto(baseUrl + '/login');
  await page.getByLabel('Username', { exact: true }).fill(username.toLowerCase());
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByText('Welcome, ' + username, { exact: true })).toBeVisible();
}

test('login matches the reference and signup, validation and logout work', async ({ page }, testInfo) => {
  await page.goto(baseUrl + '/dashboard/quiz');
  await expect(page).toHaveURL(baseUrl + '/login');
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible();
  await page.getByLabel('Username', { exact: true }).fill('John');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.screenshot({ path: testInfo.outputPath('login.png') });
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid username or password');
  await page.getByRole('link', { name: "Don't have an account? Register here", exact: true }).click();
  await page.getByLabel('Username', { exact: true }).fill('NewStudent');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page).toHaveURL(baseUrl + '/dashboard');
  await expect(page.getByText('Welcome, NewStudent', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(baseUrl + '/login');
});

test('learner takes five questions one at a time, gets score 4 and restarts', async ({ page }, testInfo) => {
  await login(page, 'John');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.locator('nav')).toHaveText('HomeQuizArticleLogout');
  await page.screenshot({ path: testInfo.outputPath('dashboard.png') });
  await page.reload();
  await expect(page.getByText('Welcome, John', { exact: true })).toBeVisible();
  await page.goto(baseUrl + '/admin/questions');
  await expect(page).toHaveURL(baseUrl + '/dashboard');
  await page.getByRole('link', { name: 'Start Quiz', exact: true }).click();
  for (let index = 0; index < demoQuestions.length; index += 1) {
    const question = demoQuestions[index];
    await expect(page.getByRole('heading', { name: question.text, exact: true })).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(4);
    const selection = index === 0 ? 1 : question.correctAnswerIndex;
    await page.getByRole('radio', { name: question.options[selection], exact: true }).check();
    if (index === 4) await page.screenshot({ path: testInfo.outputPath('quiz.png') });
    await page.getByRole('button', { name: 'Submit Answer', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Quiz Completed' })).toBeVisible();
  await expect(page.getByText('Your score: 4', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('completed.png') });
  await page.getByRole('button', { name: 'Restart Quiz', exact: true }).click();
  await expect(page.getByRole('heading', { name: demoQuestions[0].text, exact: true })).toBeVisible();
  await expect(page.locator('input[type=radio]:checked')).toHaveCount(0);
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await page.goto(baseUrl + '/dashboard/quiz');
  await expect(page).toHaveURL(baseUrl + '/login');
});

test('admin lands on its dashboard and creates, edits and deletes questions', async ({ page }, testInfo) => {
  await login(page, 'Mary');
  await expect(page).toHaveURL(baseUrl + '/admin');
  await expect(page.getByRole('heading', { name: 'Admin Dashboard', exact: true })).toBeVisible();
  await expect(page.locator('nav')).toHaveText('HomeManage QuestionsManage QuizzesManage ArticlesLogout');
  await page.screenshot({ path: testInfo.outputPath('admin.png') });
  await page.getByRole('link', { name: 'Open question manager', exact: true }).click();
  await expect(page.locator('.question-list > li')).toHaveCount(5);
  await expect(page.locator('.question-options-editor input')).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath('questions.png'), fullPage: true });
  await page.getByLabel('Question Text:', { exact: true }).fill('Temporary question?');
  for (let index = 1; index <= 4; index += 1) {
    await page.getByRole('textbox', { name: 'Option ' + index, exact: true }).fill('Answer ' + index);
  }
  await page.getByLabel('Correct Answer Index:', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Add Question', exact: true }).click();
  const item = page.locator('.question-list > li').filter({ hasText: 'Temporary question?' });
  await expect(item).toBeVisible();
  await expect(item.locator('ul li')).toHaveCount(4);
  await item.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Correct Answer Index:', { exact: true })).toHaveValue('2');
  await page.getByLabel('Question Text:', { exact: true }).fill('Updated question?');
  await page.getByRole('button', { name: 'Update Question', exact: true }).click();
  const updated = page.locator('.question-list > li').filter({ hasText: 'Updated question?' });
  await expect(updated).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await updated.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(updated).toHaveCount(0);
  await expect(page.locator('.question-list > li')).toHaveCount(5);
});

test('quiz management retains create, update and delete behavior', async ({ page }) => {
  await login(page, 'Mary');
  await page.getByRole('link', { name: 'Open quiz manager', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quizzes', exact: true })).toBeVisible();
  await page.getByLabel('Title:', { exact: true }).fill('Temporary Quiz');
  await page.getByLabel('Description:', { exact: true }).fill('Temporary description');
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Add Quiz', exact: true }).click();
  const item = page.locator('.list-group-item').filter({ hasText: 'Temporary Quiz' });
  await expect(item).toBeVisible();
  await item.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Title:', { exact: true }).fill('Updated Quiz');
  await page.getByRole('button', { name: 'Update Quiz', exact: true }).click();
  const updated = page.locator('.list-group-item').filter({ hasText: 'Updated Quiz' });
  await expect(updated).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await updated.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(updated).toHaveCount(0);
});

test('article CRUD is available to admin and learners can read it', async ({ page, browser }, testInfo) => {
  await login(page, 'Mary');
  await page.getByRole('link', { name: 'Open article manager', exact: true }).click();
  await page.getByLabel('Title:', { exact: true }).fill('How to take a quiz');
  await page.getByLabel('Content:', { exact: true }).fill('Choose one answer.\nThen submit your answer.');
  await page.getByRole('button', { name: 'Add Article', exact: true }).click();
  const article = page.locator('.article-entry').filter({ hasText: 'How to take a quiz' });
  await expect(article).toBeVisible();
  await article.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Title:', { exact: true }).fill('Quiz instructions');
  await page.getByRole('button', { name: 'Update Article', exact: true }).click();
  const updated = page.locator('.article-entry').filter({ hasText: 'Quiz instructions' });
  await expect(updated).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('articles-admin.png'), fullPage: true });
  const context = await browser.newContext();
  const learner = await context.newPage();
  try {
    await login(learner, 'John');
    await learner.getByRole('link', { name: 'Browse Articles', exact: true }).click();
    await expect(learner.getByRole('heading', { name: 'Quiz instructions', exact: true })).toBeVisible();
    await expect(learner.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);
    await expect(learner.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
    await learner.goto(baseUrl + '/admin/articles');
    await expect(learner).toHaveURL(baseUrl + '/dashboard');
  } finally { await context.close(); }
  page.once('dialog', (dialog) => dialog.accept());
  await updated.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(updated).toHaveCount(0);
});

test('mobile login and question management fit a narrow screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, 'Mary');
  await page.getByRole('link', { name: 'Manage Questions', exact: true }).click();
  await expect(page.locator('.question-list > li')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile-questions.png'), fullPage: true });
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile-login.png') });
});
