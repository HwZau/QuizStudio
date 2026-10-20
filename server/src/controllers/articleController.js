const Article = require('../models/Article');
const { HttpError, pickFields } = require('../utils/http');

function fields(body) {
  const data = pickFields(body, ['title', 'content']);
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new HttpError(400, key + ' must be a nonempty string.');
    }
  }
  return data;
}

async function findArticle(id) {
  const article = await Article.findById(id);
  if (!article) throw new HttpError(404, 'Article not found.');
  return article;
}

async function listArticles(_req, res) {
  res.json(await Article.find().sort({ createdAt: 1, _id: 1 }).populate('author', 'username'));
}
async function getArticle(req, res) {
  res.json(await findArticle(req.params.articleId));
}
async function createArticle(req, res) {
  const article = await Article.create({ ...fields(req.body), author: req.user._id });
  res.status(201).json(article);
}
async function updateArticle(req, res) {
  const article = await findArticle(req.params.articleId);
  article.set(fields(req.body));
  await article.save();
  res.json(article);
}
async function deleteArticle(req, res) {
  const article = await findArticle(req.params.articleId);
  await article.deleteOne();
  res.status(204).end();
}
module.exports = { listArticles, getArticle, createArticle, updateArticle, deleteArticle };
