const commentService = require('../services/comment.service');
const { sendSuccess } = require('../utils/response');

async function addComment(req, res, next) {
  try {
    const comment = await commentService.addComment(
      req.params.expenseId,
      req.user.id,
      req.body.message
    );
    sendSuccess(res, { comment }, 201);
  } catch (error) {
    next(error);
  }
}

async function getExpenseComments(req, res, next) {
  try {
    const comments = await commentService.getExpenseComments(
      req.params.expenseId,
      req.user.id
    );
    sendSuccess(res, { comments });
  } catch (error) {
    next(error);
  }
}

module.exports = { addComment, getExpenseComments };
