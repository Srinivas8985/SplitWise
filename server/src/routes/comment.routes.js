const express = require('express');
const router = express.Router({ mergeParams: true });

const { addComment, getExpenseComments } = require('../controllers/comment.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { createCommentSchema } = require('../validators/comment.validator');

router.use(authenticate);

// Mounted under /api/v1/expenses/:expenseId/comments
router.post('/', validate(createCommentSchema), addComment);
router.get('/', getExpenseComments);

module.exports = router;
