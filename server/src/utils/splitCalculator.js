/**
 * Split Calculator Utility
 *
 * All 4 split types with rounding rules:
 * - Amounts rounded to 2 decimal places
 * - Rounding remainder assigned to the last participant
 */

/**
 * Equal Split — divides total equally among participants
 * @param {number} totalAmount
 * @param {string[]} participantIds
 * @returns {{ userId: string, amount: number }[]}
 */
function equalSplit(totalAmount, participantIds) {
  const count = participantIds.length;
  const perPerson = Math.floor((totalAmount * 100) / count) / 100;
  let distributed = 0;

  const splits = participantIds.map((userId, index) => {
    if (index === count - 1) {
      // Last participant absorbs the rounding remainder
      const amount = Math.round((totalAmount - distributed) * 100) / 100;
      return { userId, amount };
    }
    distributed += perPerson;
    return { userId, amount: perPerson };
  });

  return splits;
}

/**
 * Unequal Split — user-specified amounts per participant
 * @param {number} totalAmount
 * @param {{ userId: string, amount: number }[]} splits
 * @returns {{ userId: string, amount: number }[]}
 */
function unequalSplit(totalAmount, splits) {
  const sum = splits.reduce((acc, s) => acc + s.amount, 0);
  const roundedSum = Math.round(sum * 100) / 100;
  const roundedTotal = Math.round(totalAmount * 100) / 100;

  if (roundedSum !== roundedTotal) {
    throw new Error(
      `Split amounts (${roundedSum}) do not equal the total (${roundedTotal})`
    );
  }

  return splits.map((s) => ({
    userId: s.userId,
    amount: Math.round(s.amount * 100) / 100,
  }));
}

/**
 * Percentage Split — percentage per participant, must sum to 100%
 * @param {number} totalAmount
 * @param {{ userId: string, percentage: number }[]} percentages
 * @returns {{ userId: string, amount: number, percentage: number }[]}
 */
function percentageSplit(totalAmount, percentages) {
  const totalPercent = percentages.reduce((acc, p) => acc + p.percentage, 0);
  const roundedPercent = Math.round(totalPercent * 100) / 100;

  if (roundedPercent !== 100) {
    throw new Error(
      `Percentages must sum to 100% (got ${roundedPercent}%)`
    );
  }

  let distributed = 0;
  const count = percentages.length;

  const splits = percentages.map((p, index) => {
    if (index === count - 1) {
      const amount = Math.round((totalAmount - distributed) * 100) / 100;
      return { userId: p.userId, amount, percentage: p.percentage };
    }
    const amount = Math.round(((p.percentage / 100) * totalAmount) * 100) / 100;
    distributed += amount;
    return { userId: p.userId, amount, percentage: p.percentage };
  });

  return splits;
}

/**
 * Share-Based Split — proportional based on assigned shares
 * @param {number} totalAmount
 * @param {{ userId: string, shares: number }[]} shareData
 * @returns {{ userId: string, amount: number, shares: number }[]}
 */
function shareSplit(totalAmount, shareData) {
  const totalShares = shareData.reduce((acc, s) => acc + s.shares, 0);

  if (totalShares <= 0) {
    throw new Error('Total shares must be greater than 0');
  }

  let distributed = 0;
  const count = shareData.length;

  const splits = shareData.map((s, index) => {
    if (index === count - 1) {
      const amount = Math.round((totalAmount - distributed) * 100) / 100;
      return { userId: s.userId, amount, shares: s.shares };
    }
    const amount = Math.round(((s.shares / totalShares) * totalAmount) * 100) / 100;
    distributed += amount;
    return { userId: s.userId, amount, shares: s.shares };
  });

  return splits;
}

module.exports = { equalSplit, unequalSplit, percentageSplit, shareSplit };
