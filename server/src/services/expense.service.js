const prisma = require('../utils/prisma');
const { createError } = require('../utils/response');
const { equalSplit, unequalSplit, percentageSplit, shareSplit } = require('../utils/splitCalculator');

async function createExpense(groupId, creatorId, data) {
  const { description, amount, date, splitType, paidById, notes, splits: splitData } = data;

  // 1. Verify group exists and user is a member
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true }
  });

  if (!group) throw createError('Group not found', 404);
  const isMember = group.members.some(m => m.userId === creatorId);
  if (!isMember) throw createError('You must be a member of this group to add an expense', 403);

  // 2. Verify all users in splitData and paidById are members of the group
  const memberIds = new Set(group.members.map(m => m.userId));
  if (!memberIds.has(paidById)) {
    throw createError('The person who paid must be a member of the group', 400);
  }
  for (const split of splitData) {
    if (!memberIds.has(split.userId)) {
      throw createError(`User ${split.userId} is not a member of the group`, 400);
    }
  }

  // 3. Calculate splits
  let calculatedSplits = [];
  try {
    switch (splitType) {
      case 'EQUAL':
        calculatedSplits = equalSplit(amount, splitData.map(s => s.userId));
        break;
      case 'UNEQUAL':
        calculatedSplits = unequalSplit(amount, splitData);
        break;
      case 'PERCENTAGE':
        calculatedSplits = percentageSplit(amount, splitData);
        break;
      case 'SHARE':
        calculatedSplits = shareSplit(amount, splitData);
        break;
      default:
        throw createError('Invalid split type', 400);
    }
  } catch (error) {
    throw createError(`Split calculation failed: ${error.message}`, 400);
  }

  // 4. Build ExpenseSplit rows
  // `amount` = participant's share of the expense (always positive)
  // The payer info lives on Expense.paidById — balance calculations
  // derive "who owes whom" from paidById + each participant's share.
  const dbSplits = calculatedSplits.map(split => ({
    userId: split.userId,
    amount: split.amount,       // participant's share (e.g., ₹400 out of ₹1200)
    percentage: split.percentage,
    shares: split.shares
  }));

  // 5. Create Expense and ExpenseSplits in a transaction
  const expense = await prisma.expense.create({
    data: {
      groupId,
      description,
      amount,
      date: date ? new Date(date) : new Date(),
      splitType,
      paidById,
      createdById: creatorId,
      notes,
      splits: {
        create: dbSplits
      }
    },
    include: {
      paidBy: { select: { id: true, fullName: true } },
      splits: {
        include: { user: { select: { id: true, fullName: true } } }
      }
    }
  });

  return expense;
}

async function getGroupExpenses(groupId, userId) {
  // Check access
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!membership) throw createError('Access denied', 403);

  return await prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, fullName: true, email: true } },
      splits: {
        include: { user: { select: { id: true, fullName: true } } }
      }
    },
    orderBy: { date: 'desc' }
  });
}

async function getExpenseById(expenseId, userId) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: { select: { id: true, fullName: true } },
      createdBy: { select: { id: true, fullName: true } },
      splits: {
        include: { user: { select: { id: true, fullName: true } } }
      },
      comments: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!expense) throw createError('Expense not found', 404);

  // Check if user is in the group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: expense.groupId, userId } }
  });
  if (!membership) throw createError('Access denied', 403);

  return expense;
}

async function deleteExpense(expenseId, userId) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) throw createError('Expense not found', 404);
  
  if (expense.createdById !== userId) {
    throw createError('Only the creator of the expense can delete it', 403);
  }

  // Cascades to splits and comments
  await prisma.expense.delete({ where: { id: expenseId } });
}

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  deleteExpense
};
