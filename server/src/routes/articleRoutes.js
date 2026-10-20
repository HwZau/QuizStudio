const express = require('express');
const controller = require('../controllers/articleController');
const { verifyUser, verifyAdmin } = require('../middleware/authenticate');
const { validId } = require('../utils/http');

const router = express.Router();
router.use(verifyUser);
router.route('/')
  .get(controller.listArticles)
  .post(verifyAdmin, controller.createArticle);
router.route('/:articleId')
  .all(validId)
  .get(controller.getArticle)
  .put(verifyAdmin, controller.updateArticle)
  .delete(verifyAdmin, controller.deleteArticle);

module.exports = router;
