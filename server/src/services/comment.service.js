const prisma = require('../utils/prisma');
const { createError } = require('../utils/response');

async function addComment(expenseId, userId, message) {
  // 1. Verify expense exists
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { groupId: true }
  });
  if (!expense) throw createError('Expense not found', 404);

  // 2. Verify user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: expense.groupId, userId } }
  });
  if (!membership) throw createError('Only group members can comment on expenses', 403);

  // 3. Create the comment
  const comment = await prisma.expenseComment.create({
    data: {
      expenseId,
      userId,
      content: message
    },
    include: {
      user: { select: { id: true, fullName: true } }
    }
  });

  return comment;
}

async function getExpenseComments(expenseId, userId) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { groupId: true }
  });
  if (!expense) throw createError('Expense not found', 404);

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: expense.groupId, userId } }
  });
  if (!membership) throw createError('Access denied', 403);

  const comments = await prisma.expenseComment.findMany({
    where: { expenseId },
    include: {
      user: { select: { id: true, fullName: true } }
    },
    orderBy: { createdAt: 'desc' } // Newest first
  });

  return comments;
}

module.exports = { addComment, getExpenseComments };
