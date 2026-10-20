const express = require('express');
const controller = require('../controllers/questionController');
const { validId } = require('../utils/http');
const { verifyUser, verifyAdmin } = require('../middleware/authenticate');

const router = express.Router();

router.route('/')
  .get(verifyUser, verifyAdmin, controller.listQuestions)
  .post(verifyUser, verifyAdmin, controller.createQuestion);

router.route('/:questionId')
  .all(validId)
  .get(verifyUser, verifyAdmin, controller.getQuestion)
  .put(verifyUser, verifyAdmin, controller.updateQuestion)
  .delete(verifyUser, verifyAdmin, controller.deleteQuestion);

module.exports = router;
