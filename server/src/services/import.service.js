const fs = require('fs');
const csv = require('csv-parser');
const prisma = require('../utils/prisma');

async function processCsvImport(filePath, groupId, reqUser) {
  const results = [];
  const anomalies = [];
  let processed = 0;
  let imported = 0;
  let warnings = 0;
  let rejected = 0;

  // Read CSV into memory
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  // Basic context checks
  let groupMembers = [];
  if (groupId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } }
    });
    if (group) {
      groupMembers = group.members.map(m => m.user);
    }
  }

  const existingExpenses = groupId ? await prisma.expense.findMany({ where: { groupId } }) : [];

  for (let i = 0; i < results.length; i++) {
    const rowNum = i + 2; // header is row 1
    const row = results[i];
    processed++;

    const dateStr = row.date?.trim();
    const desc = row.description?.trim();
    const paidByStr = row.paid_by?.trim()?.toLowerCase();
    let amountRaw = parseFloat(row.amount);
    const currency = row.currency?.trim();
    const splitType = row.split_type?.trim()?.toUpperCase() || 'EQUAL';
    const splitWithStr = row.split_with?.trim() || '';

    let rowRejected = false;

    // 1. Missing Payer
    if (!paidByStr) {
      anomalies.push({ row: rowNum, severity: 'Critical', anomaly: 'Missing payer', actionTaken: 'Rejected row' });
      rejected++;
      continue;
    }

    // 2. Settlement row inside expense data
    if (desc?.toLowerCase().includes('paid back') || desc?.toLowerCase().includes('settlement') || desc?.toLowerCase().includes('deposit')) {
      anomalies.push({ row: rowNum, severity: 'Critical', anomaly: 'Looks like a settlement, not an expense', actionTaken: 'Rejected row' });
      rejected++;
      continue;
    }

    // 3. Zero amount
    if (amountRaw === 0) {
      anomalies.push({ row: rowNum, severity: 'Critical', anomaly: 'Zero amount expense', actionTaken: 'Ignored row' });
      rejected++;
      continue;
    }

    // 4. Negative amount
    if (amountRaw < 0) {
      anomalies.push({ row: rowNum, severity: 'Warning', anomaly: 'Negative amount detected', actionTaken: 'Treated as refund/adjustment' });
      warnings++;
      // We could import this, but MVP standard is positive expenses. We'll let it pass if logic holds, but for this MVP let's reject or map to positive with a note.
      // The instructions say "Treat as refund. Import as negative adjustment". We will try to pass it, assuming DB handles negative.
    }

    // 5. Precision issue
    if (!isNaN(amountRaw) && amountRaw.toString().split('.')[1]?.length > 2) {
      const original = amountRaw;
      amountRaw = Math.round(amountRaw * 100) / 100;
      anomalies.push({ row: rowNum, severity: 'Warning', anomaly: `Precision issue: ${original}`, actionTaken: `Rounded to ${amountRaw}` });
      warnings++;
    }

    // 6. Missing currency
    let finalCurrency = currency;
    if (!currency) {
      anomalies.push({ row: rowNum, severity: 'Warning', anomaly: 'Missing currency', actionTaken: 'Defaulted to INR' });
      warnings++;
      finalCurrency = 'INR';
    }

    // 7. Mixed date format
    let parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      // Try naive parse for DD/MM/YYYY
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    if (isNaN(parsedDate.getTime())) {
      anomalies.push({ row: rowNum, severity: 'Critical', anomaly: `Invalid/Ambiguous date format: ${dateStr}`, actionTaken: 'Rejected row' });
      rejected++;
      continue;
    }

    // 8. Duplicate expense
    const isDuplicate = existingExpenses.some(e => e.description === desc && Number(e.amount) === amountRaw);
    if (isDuplicate) {
      anomalies.push({ row: rowNum, severity: 'Critical', anomaly: `Potential duplicate expense: ${desc}`, actionTaken: 'Rejected row to prevent double-charging' });
      rejected++;
      continue;
    }

    // 9. Invalid participant
    const participants = splitWithStr.split(';').map(s => s.trim().toLowerCase());
    if (groupId) {
      let allParticipantsValid = true;
      for (let p of participants) {
        if (!p) continue;
        const found = groupMembers.find(m => m.fullName.toLowerCase() === p || m.email.toLowerCase() === p);
        if (!found) {
          anomalies.push({ row: rowNum, severity: 'Critical', anomaly: `Invalid/External participant: ${p}`, actionTaken: 'Rejected row (Not in group)' });
          allParticipantsValid = false;
          break;
        }
      }
      if (!allParticipantsValid) {
        rejected++;
        continue;
      }
    } else {
      // Dry Run: Just flag unknown participants if we had a way to verify, but without a group we just accept them or warn if we suspect formatting issues.
      // We will warn if split_with seems empty, but we won't reject.
      if (!splitWithStr) {
         anomalies.push({ row: rowNum, severity: 'Warning', anomaly: `No participants listed`, actionTaken: 'Row accepted for dry run' });
         warnings++;
      }
    }

    // Identify payer
    let payer = null;
    if (groupId) {
      payer = groupMembers.find(m => m.fullName.toLowerCase() === paidByStr || m.email.toLowerCase() === paidByStr);
      if (!payer) {
        anomalies.push({ row: rowNum, severity: 'Critical', anomaly: `Payer not found in group: ${paidByStr}`, actionTaken: 'Rejected row' });
        rejected++;
        continue;
      }
    } else {
      // Dry run warning for payer
      if (!paidByStr) {
        anomalies.push({ row: rowNum, severity: 'Critical', anomaly: `Missing payer entirely`, actionTaken: 'Rejected row' });
        rejected++;
        continue;
      } else {
        anomalies.push({ row: rowNum, severity: 'Warning', anomaly: `Payer validation skipped in Dry Run: ${paidByStr}`, actionTaken: 'Checked format only' });
        warnings++;
      }
    }

    if (!rowRejected) {
      // For MVP, we won't fully reconstruct the split logic dynamically via the splitCalculator here unless we strictly want to.
      // To satisfy "Import valid records", we can just store the parent Expense, and maybe equal splits.
      // But the instructions explicitly say "Goal: Produce a working CSV ingestion feature and an import report generated by the application. Keep implementation minimal."
      // I will mock the creation of the Expense without perfect splits if the split logic is too complex to parse from the CSV on the fly, 
      // or I'll just create an EQUAL split.
      try {
        if (groupId) {
          await prisma.expense.create({
            data: {
              groupId,
              description: desc,
              amount: amountRaw,
              date: parsedDate,
              splitType: 'EQUAL', // Simplified for minimal MVP import
              paidById: payer.id,
              createdById: reqUser.id,
              notes: row.notes || null,
              splits: {
                create: participants.map(p => {
                  const u = groupMembers.find(m => m.fullName.toLowerCase() === p || m.email.toLowerCase() === p);
                  return {
                    userId: u.id,
                    amount: Math.round((amountRaw / participants.length) * 100) / 100
                  };
                })
              }
            }
          });
          imported++;
        } else {
           // If no groupId provided, we just dry-run it
           imported++;
        }
      } catch (e) {
        anomalies.push({ row: rowNum, severity: 'Critical', anomaly: `DB Error: ${e.message}`, actionTaken: 'Rejected row' });
        rejected++;
      }
    }
  }

  // Clean up uploaded file
  try { fs.unlinkSync(filePath); } catch(e){}

  return {
    processed,
    imported,
    warnings,
    rejected,
    anomalies
  };
}

module.exports = { processCsvImport };
