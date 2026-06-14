/**
 * Balance Service — computes pairwise debts from expenses and settlements.
 *
 * Algorithm:
 * 1. For each expense: each non-payer participant owes the payer their share.
 * 2. For each settlement: reduces the debt from payer to receiver.
 * 3. Net each pair: if A owes B ₹400 and B owes A ₹200, net = B owes A ₹200.
 *
 * The `amount` field in ExpenseSplit stores the participant's share (always positive).
 * The `paidById` on the Expense tells us who actually paid.
 */

const prisma = require('../utils/prisma');
const { createError } = require('../utils/response');

/**
 * Compute pairwise debts for a single group.
 * Returns an array of { from, to, amount } objects (all netted, amount > 0).
 */
async function getGroupBalances(groupId, userId) {
  // Verify user is a member
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  if (!membership) throw createError('Access denied', 403);

  // Fetch all expenses with splits
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
      paidBy: { select: { id: true, fullName: true, email: true } }
    }
  });

  // Fetch all settlements
  const settlements = await prisma.settlement.findMany({
    where: { groupId }
  });

  // Fetch all group members for name resolution
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, fullName: true, email: true } } }
  });
  const userMap = {};
  members.forEach(m => {
    userMap[m.userId] = m.user;
  });

  // Build the debt map
  const debts = computeDebts(expenses, settlements);

  // Format debts with user info
  const formattedDebts = debts.map(d => ({
    from: userMap[d.from] || { id: d.from, fullName: 'Unknown' },
    to: userMap[d.to] || { id: d.to, fullName: 'Unknown' },
    amount: d.amount
  }));

  // Compute summary for the requesting user
  const userSummary = computeUserSummary(formattedDebts, userId);

  return { debts: formattedDebts, userSummary };
}

/**
 * Compute overall dashboard balances for a user across all their groups.
 */
async function getDashboardBalances(userId) {
  // Get all groups the user belongs to
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: { select: { id: true, name: true } } }
  });

  let totalOwed = 0;    // others owe you
  let totalOwing = 0;   // you owe others
  const byGroup = [];

  for (const membership of memberships) {
    const { debts, userSummary } = await getGroupBalances(
      membership.groupId,
      userId
    );

    totalOwed += userSummary.totalOwed;
    totalOwing += userSummary.totalOwing;

    // Only include groups with non-zero balances
    if (userSummary.totalOwed > 0 || userSummary.totalOwing > 0) {
      byGroup.push({
        groupId: membership.group.id,
        groupName: membership.group.name,
        totalOwed: userSummary.totalOwed,
        totalOwing: userSummary.totalOwing,
        netBalance: userSummary.netBalance
      });
    }
  }

  return {
    totalOwed: round2(totalOwed),
    totalOwing: round2(totalOwing),
    netBalance: round2(totalOwed - totalOwing),
    byGroup
  };
}

// ─── Core Algorithm ───────────────────────────────────────────────────────────

/**
 * Builds a raw debt map from expenses and settlements, then nets each pair.
 * @returns {{ from: string, to: string, amount: number }[]}
 */
function computeDebts(expenses, settlements) {
  // debtMap[debtorId][creditorId] = raw amount debtor owes creditor
  const debtMap = {};

  const addDebt = (from, to, amount) => {
    if (from === to) return; // you don't owe yourself
    if (!debtMap[from]) debtMap[from] = {};
    debtMap[from][to] = (debtMap[from][to] || 0) + amount;
  };

  // Step 1: From expenses — each non-payer participant owes the payer their share
  for (const expense of expenses) {
    const payerId = expense.paidById;
    for (const split of expense.splits) {
      if (split.userId !== payerId) {
        addDebt(split.userId, payerId, Number(split.amount));
      }
    }
  }

  // Step 2: From settlements — reduces debt (settlement = debtor paying creditor)
  for (const settlement of settlements) {
    // paidById is the person settling their debt (the debtor)
    // paidToId is the person receiving the settlement (the creditor)
    addDebt(settlement.paidById, settlement.paidToId, -Number(settlement.amount));
  }

  // Step 3: Net each pair
  const result = [];
  const processed = new Set();

  for (const from of Object.keys(debtMap)) {
    for (const to of Object.keys(debtMap[from])) {
      const pairKey = [from, to].sort().join('-');
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);

      const aOwesB = (debtMap[from]?.[to] || 0);
      const bOwesA = (debtMap[to]?.[from] || 0);
      const net = round2(aOwesB - bOwesA);

      if (net > 0) {
        result.push({ from, to, amount: net });
      } else if (net < 0) {
        result.push({ from: to, to: from, amount: round2(Math.abs(net)) });
      }
      // If net === 0, they're settled — don't include
    }
  }

  return result;
}

/**
 * Compute a per-user summary from the formatted debts array.
 */
function computeUserSummary(debts, userId) {
  let totalOwed = 0;  // money others owe you
  let totalOwing = 0; // money you owe others

  for (const debt of debts) {
    if (debt.to.id === userId) {
      totalOwed += debt.amount;
    }
    if (debt.from.id === userId) {
      totalOwing += debt.amount;
    }
  }

  return {
    totalOwed: round2(totalOwed),
    totalOwing: round2(totalOwing),
    netBalance: round2(totalOwed - totalOwing)
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { getGroupBalances, getDashboardBalances };
