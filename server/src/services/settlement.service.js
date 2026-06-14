/**
 * Settlement Service — records payments between group members.
 *
 * Business rules:
 * 1. Both paidBy and paidTo must be members of the group.
 * 2. Cannot settle with yourself.
 * 3. Amount must be > 0 (enforced by Zod, double-checked here).
 * 4. Partial settlements are allowed — no check against outstanding balance.
 *    (Users can overpay if they want; balance logic handles it cleanly.)
 */

const prisma = require('../utils/prisma');
const { createError } = require('../utils/response');

/**
 * Record a settlement within a group.
 * @param {string} groupId
 * @param {string} paidById - the logged-in user (debtor settling up)
 * @param {{ paidToId: string, amount: number }} data
 */
async function createSettlement(groupId, paidById, { paidToId, amount }) {
  // Rule 2: Cannot settle with yourself
  if (paidById === paidToId) {
    throw createError('You cannot settle with yourself', 400);
  }

  // Rule 1: Both users must be group members
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true }
  });

  if (!group) throw createError('Group not found', 404);

  const memberIds = new Set(group.members.map(m => m.userId));

  if (!memberIds.has(paidById)) {
    throw createError('You are not a member of this group', 403);
  }
  if (!memberIds.has(paidToId)) {
    throw createError('Recipient is not a member of this group', 400);
  }

  // Create the settlement record
  const settlement = await prisma.settlement.create({
    data: {
      groupId,
      paidById,
      paidToId,
      amount
    },
    include: {
      paidBy: { select: { id: true, fullName: true, email: true } },
      paidTo: { select: { id: true, fullName: true, email: true } }
    }
  });

  return settlement;
}

/**
 * Get settlement history for a group.
 * Ordered by most recent first.
 */
async function getGroupSettlements(groupId, userId) {
  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!membership) throw createError('Access denied', 403);

  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, fullName: true, email: true } },
      paidTo: { select: { id: true, fullName: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return settlements;
}

module.exports = { createSettlement, getGroupSettlements };
