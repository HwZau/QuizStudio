class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function pickFields(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }

  const result = {};
  for (const field of fields) {
    if (Object.hasOwn(body, field)) result[field] = body[field];
  }
  if (Object.keys(result).length === 0) {
    throw new HttpError(400, `Provide at least one of: ${fields.join(', ')}.`);
  }
  return result;
}

function validId(req, _res, next) {
  const id = req.params.quizId || req.params.questionId || req.params.articleId;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return next(new HttpError(400, 'Invalid MongoDB ObjectId.'));
  }
  next();
}

module.exports = { HttpError, pickFields, validId };
