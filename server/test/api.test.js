const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
process.env.JWT_SECRET = 'assignment-4-test-secret-with-sufficient-length';
const app = require('../src/app');
const User = require('../src/models/User');

let server;
let baseUrl;

before(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017', {
    dbName: `SimpleQuizAssignment4Test_${process.pid}_${Date.now()}`
  });
  await User.init();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

async function request(method, path, body, token) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

test('username login and uniqueness ignore case while preserving spelling and password case', async () => {
  const password = 'CaseSensitive123!';
  const created = await request('POST', '/auth/register', { username: 'Case.User+One', password });
  assert.equal(created.status, 201);
  assert.equal(created.body.user.username, 'Case.User+One');

  for (const username of ['case.user+one', 'CASE.USER+ONE', '  cAsE.uSeR+oNe  ']) {
    const result = await request('POST', '/auth/login', { username, password });
    assert.equal(result.status, 200);
    assert.equal(result.body.user._id, created.body.user._id);
    assert.equal(result.body.user.username, 'Case.User+One');
  }
  const aliasLogin = await request('POST', '/users/login', { username: 'CASE.USER+ONE', password });
  assert.equal(aliasLogin.status, 200);
  assert.equal(aliasLogin.body.user._id, created.body.user._id);
  assert.equal((await request('POST', '/auth/login', {
    username: 'case.user+one', password: password.toLowerCase()
  })).status, 401);
  assert.equal((await request('POST', '/auth/login', {
    username: 'caseXuser+one', password
  })).status, 401);
  assert.equal((await request('POST', '/auth/register', {
    username: 'case.user+one', password
  })).status, 409);
  assert.equal((await request('POST', '/users/signup', {
    username: 'CASE.USER+ONE', password
  })).status, 409);

  const registrations = await Promise.all([
    request('POST', '/auth/register', { username: 'ConcurrentName', password }),
    request('POST', '/auth/register', { username: 'CONCURRENTNAME', password })
  ]);
  assert.deepEqual(registrations.map((result) => result.status).sort(), [201, 409]);
});

test('login, admin CRUD, quiz play and server grading', async () => {
  const learner = await request('POST', '/auth/register', {
    username: 'learner', password: 'password123', admin: true
  });
  const admin = await request('POST', '/auth/register', {
    username: 'admin', password: 'password123'
  });
  assert.equal(learner.status, 201);
  assert.equal(learner.body.user.admin, false);
  await User.findByIdAndUpdate(admin.body.user._id, { admin: true });
  const adminLogin = await request('POST', '/auth/login', {
    username: 'admin', password: 'password123'
  });
  const adminToken = adminLogin.body.token;
  const learnerToken = learner.body.token;

  assert.equal((await request('GET', '/quizzes')).status, 401);
  assert.equal((await request('POST', '/questions', {
    text: 'Forbidden', options: ['A', 'B'], correctAnswerIndex: 0
  }, learnerToken)).status, 403);

  const first = await request('POST', '/questions', {
    text: 'Capital of France?', options: ['Paris', 'London'], correctAnswerIndex: 0
  }, adminToken);
  const second = await request('POST', '/questions', {
    text: 'Capital of Germany?', options: ['Paris', 'Berlin'], correctAnswerIndex: 1
  }, adminToken);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);

  const quiz = await request('POST', '/quizzes', {
    title: 'Capitals', description: 'Geography practice',
    questions: [first.body._id, second.body._id]
  }, adminToken);
  assert.equal(quiz.status, 201);
  const quizId = quiz.body._id;
  const learnerQuiz = await request('GET', `/quizzes/${quizId}`, undefined, learnerToken);
  assert.equal(learnerQuiz.status, 200);
  assert.equal(learnerQuiz.body.questions.length, 2);
  assert.ok(learnerQuiz.body.questions.every((q) => !Object.hasOwn(q, 'correctAnswerIndex')));
  const adminQuiz = await request('GET', `/quizzes/${quizId}`, undefined, adminToken);
  assert.equal(adminQuiz.body.questions[0].correctAnswerIndex, 0);

  const result = await request('POST', `/quizzes/${quizId}/submit`, {
    answers: { [first.body._id]: 0, [second.body._id]: 0 }
  }, learnerToken);
  assert.equal(result.status, 200);
  assert.equal(result.body.score, 1);
  assert.equal(result.body.total, 2);
  assert.equal(result.body.review[1].correctOption, 'Berlin');
  assert.equal((await request('GET', '/questions', undefined, learnerToken)).status, 403);
  assert.equal((await request('PUT', `/quizzes/${quizId}`, {
    title: 'Forbidden'
  }, learnerToken)).status, 403);

  const changed = await request('PUT', `/questions/${first.body._id}`, {
    text: 'Capital of France updated?'
  }, adminToken);
  assert.equal(changed.status, 200);
  assert.equal(changed.body.text, 'Capital of France updated?');
  assert.equal((await request('DELETE', `/questions/${first.body._id}`, undefined, adminToken)).status, 204);
  const afterDelete = await request('GET', `/quizzes/${quizId}`, undefined, learnerToken);
  assert.equal(afterDelete.body.questions.length, 1);
  assert.equal((await request('DELETE', `/quizzes/${quizId}`, undefined, adminToken)).status, 204);
});

test('articles require login, restrict writes to admins and validate data', async () => {
  const learner = await request('POST', '/auth/register', {
    username: 'article-reader', password: 'password123'
  });
  const admin = await request('POST', '/auth/register', {
    username: 'article-editor', password: 'password123'
  });
  await User.findByIdAndUpdate(admin.body.user._id, { admin: true });
  const adminToken = admin.body.token;
  const learnerToken = learner.body.token;
  const payload = { title: 'Quiz guide', content: 'Choose one answer for each question.' };

  assert.equal((await request('GET', '/articles')).status, 401);
  assert.equal((await request('POST', '/articles', payload, learnerToken)).status, 403);
  assert.equal((await request('POST', '/articles', { title: ' ' }, adminToken)).status, 400);
  assert.equal((await request('POST', '/articles', { title: 'Guide', content: 42 }, adminToken)).status, 400);
  assert.equal((await request('GET', '/articles/invalid-id', undefined, learnerToken)).status, 400);
  assert.equal((await request('GET', '/articles/000000000000000000000000', undefined, learnerToken)).status, 404);

  const created = await request('POST', '/articles', { ...payload, author: learner.body.user._id }, adminToken);
  assert.equal(created.status, 201);
  assert.equal(created.body.author, admin.body.user._id);
  const id = created.body._id;
  const list = await request('GET', '/articles', undefined, learnerToken);
  assert.equal(list.status, 200);
  assert.ok(list.body.some((item) => item._id === id));
  assert.equal((await request('GET', `/articles/${id}`, undefined, learnerToken)).body.content, payload.content);
  assert.equal((await request('PUT', `/articles/${id}`, { title: 'Forbidden' }, learnerToken)).status, 403);
  assert.equal((await request('DELETE', `/articles/${id}`, undefined, learnerToken)).status, 403);
  assert.equal((await request('PUT', `/articles/${id}`, { title: '' }, adminToken)).status, 400);
  const updated = await request('PUT', `/articles/${id}`, { title: 'Updated guide' }, adminToken);
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, 'Updated guide');
  assert.equal(updated.body.content, payload.content);
  assert.equal((await request('DELETE', `/articles/${id}`, undefined, adminToken)).status, 204);
  assert.equal((await request('GET', `/articles/${id}`, undefined, learnerToken)).status, 404);
});
