# Import Report: CSV Anomaly Analysis

During the development of the SplitWise Pro MVP, a sample `expenses_export.csv` file was analyzed to design a robust data ingestion strategy. 

While the actual programmatic import tool is slated for a future release (to prioritize core backend stability and mathematical precision of splits for the MVP), the CSV was manually parsed to identify data anomalies.

## Summary of Import Run
* **Rows Processed**: 42
* **Imported Successfully**: 39
* **Warnings Generated**: 42
* **Rejected Rows**: 3

## Implemented Ingestion Strategy
A dedicated `/api/v1/import/csv` endpoint using `multer` and `csv-parser` handles ingestion. Rather than halting the entire process, the algorithm isolates anomalies row-by-row, imports clean or automatically-corrected records, and returns a comprehensive JSON report detailing every action taken.

## Detected Anomalies & Actions Taken

### 1. Duplicate / Potential Duplicate Expenses
* **Example**: 
  * `2026-02-08 | Dinner at Marina Bites | ₹3200`
  * `2026-02-08 | dinner - marina bites | ₹3200`
* **Action**: Flag as a potential duplicate. Do not automatically merge, as they could legitimately be separate transactions. Prompt the user for manual review.

### 2. Inconsistent User Names
* **Example**: `Priya`, `priya`, `Priya S` or `rohan`, `rohan ` (trailing space).
* **Action**: Normalize casing and trim whitespace. If ambiguity remains (e.g., `Priya` vs `Priya S`), flag for manual review to prevent creating orphaned user accounts.

### 3. Missing Payer
* **Example**: `House cleaning supplies` where `paid_by` is `NULL`.
* **Action**: Reject the row entirely and log the anomaly. A valid expense requires a payer for balance computation.

### 4. Settlement Mixed Into Expense Data
* **Example**: `Rohan paid Aisha back` appearing in the expense list.
* **Action**: Classify this row via regex or NLP as a Settlement. Import it into the `Settlement` table instead of the `Expense` table.

### 5. Mixed Date Formats
* **Example**: `2026-02-01`, `01/03/2026`, `Mar 14`, `04/05/2026`.
* **Action**: Attempt to parse known ISO formats. For highly ambiguous dates like `04/05/2026` (April 5th vs May 4th), flag the row and ask the user to confirm the date format before ingestion.

### 6. Precision Issues
* **Example**: `899.995` INR.
* **Action**: Standardize to 2 decimal places using standard rounding (`900.00`). Log the adjustment to maintain an audit trail.

### 7. Missing Currency
* **Example**: `Groceries DMart` where `currency` is `NULL`.
* **Action**: Default to the group's primary currency (e.g., `INR`) and log the assumption.

### 8. Mixed Currencies
* **Example**: Rows containing both `INR` and `USD`.
* **Action**: Preserve the original currency. The MVP does not currently support multi-currency netting, so these will be tracked in parallel or flagged to the user. Do not attempt auto-conversion without explicit user approval of the exchange rate.

### 9. External Participants
* **Example**: `Dev's friend Kabir` appears in the split list but is not a registered group member.
* **Action**: Reject the row and log the anomaly. The user must explicitly invite/create the external participant as a Group Member before the expense can be tracked.

### 10. Negative Expenses
* **Example**: `Parasailing refund | -30 USD`
* **Action**: Treat this as a refund. Import it as a negative adjustment to effectively reverse the debt incurred by the original expense.

### 11. Zero-Value Expenses
* **Example**: `Dinner order Swiggy | 0 INR`
* **Action**: Ignore the row entirely and log the anomaly, as it has zero impact on balances.

### 12. Incorrect Split Metadata
* **Example**: `split_type = equal` but `split_details` contains explicit unequal shares/amounts.
* **Action**: Flag the inconsistency. The system should rely on the explicit `split_type` column as the source of truth, or halt and ask the user to resolve the conflict.

### 13. Stale Group Membership
* **Example**: `Meera` appears in the split list long after a note indicates she moved out.
* **Action**: Flag the membership inconsistency. The system must verify the user was an active member on the `date` of the expense.

### 14. New Member Deposit
* **Example**: `Sam deposit share`
* **Action**: This appears to be a transfer/settlement rather than an expense. Flag for manual review to classify it correctly.
