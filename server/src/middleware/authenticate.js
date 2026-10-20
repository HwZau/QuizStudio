const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Question = require('../models/Question');
const { HttpError } = require('../utils/http');

async function verifyUser(req, _res, next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  if (!match) return next(new HttpError(401, 'Authentication required.'));
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    const user = await User.findById(payload.sub);
    if (!user) return next(new HttpError(401, 'Invalid or expired token.'));
    req.user = user;
    next();
  } catch (_error) {
    next(new HttpError(401, 'Invalid or expired token.'));
  }
}

function verifyAdmin(req, _res, next) {
  if (!req.user.admin) {
    return next(new HttpError(403, 'You are not authorized to perform this operation!'));
  }
  next();
}

async function verifyAuthor(req, _res, next) {
  const question = await Question.findById(req.params.questionId);
  if (!question) return next(new HttpError(404, 'Question not found.'));
  if (!question.author.equals(req.user._id)) {
    return next(new HttpError(403, 'You are not the author of this question'));
  }
  req.question = question;
  next();
}

module.exports = { verifyUser, verifyAdmin, verifyAuthor };
