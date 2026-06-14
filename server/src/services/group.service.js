const prisma = require('../utils/prisma');
const { createError } = require('../utils/response');

async function createGroup(userId, { name, description }) {
  // Create group and add creator as a member in a single transaction
  const group = await prisma.group.create({
    data: {
      name,
      description,
      createdById: userId,
      members: {
        create: {
          userId
        }
      }
    },
    include: {
      members: {
        include: { user: { select: { id: true, fullName: true, email: true } } }
      }
    }
  });
  return group;
}

async function getUserGroups(userId) {
  return await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { members: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getGroupById(groupId, userId) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, fullName: true, email: true } } }
      },
      createdBy: { select: { id: true, fullName: true } },
      expenses: {
        include: { paidBy: { select: { id: true, fullName: true } } },
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!group) throw createError('Group not found', 404);

  // Check if user is a member
  const isMember = group.members.some(m => m.userId === userId);
  if (!isMember) throw createError('Access denied. You are not a member of this group.', 403);

  return group;
}

async function addMember(groupId, creatorId, { email }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true }
  });
  
  if (!group) throw createError('Group not found', 404);
  if (group.createdById !== creatorId) throw createError('Only the group creator can add members', 403);

  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) throw createError('User with this email not found', 404);

  const isAlreadyMember = group.members.some(m => m.userId === userToAdd.id);
  if (isAlreadyMember) throw createError('User is already a member', 400);

  const member = await prisma.groupMember.create({
    data: { groupId, userId: userToAdd.id },
    include: { user: { select: { id: true, fullName: true, email: true } } }
  });

  return member;
}

async function removeMember(groupId, creatorId, memberId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw createError('Group not found', 404);
  if (group.createdById !== creatorId) throw createError('Only the group creator can remove members', 403);
  if (creatorId === memberId) throw createError('Creator cannot be removed from the group', 400);

  // Check if member is part of any expenses
  const expenses = await prisma.expenseSplit.findFirst({
    where: { expense: { groupId }, userId: memberId }
  });
  
  if (expenses) throw createError('Cannot remove a member who has active expenses in this group', 400);

  // Use the unique constraint to delete
  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: memberId
      }
    }
  });
}

async function leaveGroup(groupId, userId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw createError('Group not found', 404);
  if (group.createdById === userId) throw createError('Creator cannot leave the group. Delete the group instead.', 400);

  // Check if user is part of any expenses
  const expenses = await prisma.expenseSplit.findFirst({
    where: { expense: { groupId }, userId: userId }
  });
  
  if (expenses) throw createError('Cannot leave group while you have active expenses', 400);

  await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    }
  });
}

async function deleteGroup(groupId, userId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw createError('Group not found', 404);
  if (group.createdById !== userId) throw createError('Only the group creator can delete the group', 403);

  // Delete only if there are no active expenses
  const activeExpenses = await prisma.expense.count({ where: { groupId } });
  if (activeExpenses > 0) throw createError('Cannot delete a group with active expenses. Please settle or delete expenses first.', 400);

  // group members are automatically cascade deleted by Prisma
  await prisma.group.delete({ where: { id: groupId } });
}

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  addMember,
  removeMember,
  leaveGroup,
  deleteGroup
};
