const express = require('express');
const controller = require('../controllers/quizController');
const { validId } = require('../utils/http');
const { verifyUser, verifyAdmin } = require('../middleware/authenticate');

const router = express.Router();

router.route('/')
  .get(verifyUser, controller.listQuizzes)
  .post(verifyUser, verifyAdmin, controller.createQuiz);

router.route('/:quizId')
  .all(validId)
  .get(verifyUser, controller.getQuiz)
  .put(verifyUser, verifyAdmin, controller.updateQuiz)
  .delete(verifyUser, verifyAdmin, controller.deleteQuiz);

router.get('/:quizId/populate', validId, verifyUser, controller.getCapitalQuestions);
router.post('/:quizId/submit', validId, verifyUser, controller.submitQuiz);
router.post('/:quizId/question', validId, verifyUser, verifyAdmin, controller.addQuestion);
router.post('/:quizId/questions', validId, verifyUser, verifyAdmin, controller.addQuestions);

module.exports = router;
