# Spreetrail Project Scope

## Problem Statement
Managing shared expenses among friends, roommates, and travel companions often leads to confusion, lost receipts, and awkward conversations about money. Manually tracking who paid for what and calculating who owes whom is error-prone, especially when splits are not perfectly equal.

## Objectives
To provide a streamlined, transparent, and easy-to-use Minimum Viable Product (MVP) application that allows users to record shared expenses, automatically calculate exact debts, and track repayments.

## Target Users
* Roommates sharing rent and utilities.
* Friends traveling together.
* Co-workers organizing team lunches.
* Anyone who frequently shares costs with a recurring group of people.

## Functional Requirements
* Users must be able to register and authenticate.
* Users must be able to create groups and invite other registered users via email.
* Users must be able to record an expense within a group, specifying the payer, the total amount, and how it should be split.
* The system must support Equal, Unequal, Percentage, and Share-based splits.
* The system must accurately compute the net balance (who owes whom) between any two users in a group.
* Users must be able to record partial or full settlements to clear debts.
* Users must be able to leave comments on specific expenses.

## Implemented Features
1. **JWT Authentication**: Registration, Login, and Session persistence.
2. **Group Management**: Full CRUD for groups, including adding/removing members.
3. **Advanced Expense Logic**: Creation of expenses with 4 distinct splitting algorithms, robust rounding logic, and cascade deletion.
4. **Dynamic Balance Engine**: On-the-fly calculation of pairwise debts aggregated from all expenses and settlements.
5. **Settlements**: UI and API to record debt repayments.
6. **Expense Chat**: Simple append-only comment thread on the expense detail view.
7. **CSV Import**: Minimal CSV import parsing with robust anomaly detection and reporting.

## Non-Functional Requirements
* **Data Integrity**: Financial calculations must not lose pennies due to floating-point errors (handled via strict 2-decimal rounding).
* **Security**: Users can only view data, create expenses, and leave comments in groups they belong to.
* **Performance**: Balance calculations must be reasonably fast for typical group sizes (< 50 members).

---

## Database Schema

### `User`
Stores registered user credentials and profile information.
* `id` (UUID, PK)
* `email` (String, Unique)
* `password` (String, Hashed)
* `fullName` (String)

### `Group`
Represents a shared ledger context.
* `id` (UUID, PK)
* `name` (String)
* `description` (String, Optional)
* `createdById` (UUID, FK -> User)
* **Relations**: Cascades deletes to GroupMember, Expense, and Settlement.

### `GroupMember`
Mapping table linking Users to Groups.
* `id` (UUID, PK)
* `groupId` (UUID, FK -> Group)
* `userId` (UUID, FK -> User)
* **Constraints**: Unique compound key `[groupId, userId]`.

### `Expense`
A single financial transaction.
* `id` (UUID, PK)
* `groupId` (UUID, FK -> Group)
* `description` (String)
* `amount` (Decimal)
* `date` (DateTime)
* `splitType` (Enum: EQUAL, UNEQUAL, PERCENTAGE, SHARE)
* `paidById` (UUID, FK -> User)
* `createdById` (UUID, FK -> User)
* `notes` (String, Optional)
* **Relations**: Cascades deletes to ExpenseSplit and ExpenseComment.

### `ExpenseSplit`
Records the exact share an individual participant owes for a specific expense.
* `id` (UUID, PK)
* `expenseId` (UUID, FK -> Expense)
* `userId` (UUID, FK -> User)
* `amount` (Decimal) - The participant's positive share of the cost.
* `percentage` (Decimal, Optional) - Stored if splitType was PERCENTAGE.
* `shares` (Int, Optional) - Stored if splitType was SHARE.

### `Settlement`
Records a payment made to clear debt.
* `id` (UUID, PK)
* `groupId` (UUID, FK -> Group)
* `paidById` (UUID, FK -> User) - The debtor.
* `paidToId` (UUID, FK -> User) - The creditor.
* `amount` (Decimal) - The payment amount.

### `ExpenseComment`
A text message attached to an expense.
* `id` (UUID, PK)
* `expenseId` (UUID, FK -> Expense)
* `userId` (UUID, FK -> User)
* `content` (String)

---

## Business Rules

1. **Authorization**: Only members of a group can view, add expenses, settle, or comment within that group.
2. **Member Management**: Only the creator of a group can remove other members or delete the group.
3. **Expense Deletion**: Only the creator of an expense can delete it. Editing is not allowed (must delete and recreate).
4. **Settlement Rules**:
   - Both participants must be in the group.
   - Users cannot settle with themselves.
   - The settlement amount must be strictly greater than 0.
5. **Split Validation**:
   - Unequal split amounts must sum exactly to the total expense amount.
   - Percentage split percentages must sum exactly to 100.
   - At least one participant must be included in any split.

---

## Implemented CSV Import Workflow

To satisfy data ingestion requirements, a minimal CSV import feature was implemented with robust anomaly detection. The workflow is:
1. **Upload**: User uploads a CSV file via the UI.
2. **Parse**: Backend parses the CSV using `csv-parser`.
3. **Validate & Detect Anomalies**: Each row is scanned for:
   - Missing payers or zero/negative amounts.
   - Precision issues requiring strict 2-decimal rounding.
   - Invalid external participants.
   - Misclassified settlements.
   - Ambiguous or malformed dates.
4. **Import**: Valid rows are inserted into the database as standard `EQUAL` split expenses (minimal MVP implementation).
5. **Report**: The frontend renders a comprehensive JSON report containing the number of processed, imported, warned, and rejected rows, alongside a detailed anomaly table.

---

## Assumptions
* A single user pays for the entirety of an expense (multi-payer expenses are out of scope).
* All transactions occur in a single, undefined fiat currency (represented abstractly by the UI as `₹` or `$`).
* All users are assumed to be operating in the same timezone (server stores UTC).

## Out Of Scope

The following features were intentionally excluded from the MVP to meet the 2-day rapid development timeline:

* Email verification and password reset flows.
* Real-time WebSocket chat (replaced by simple HTTP comment threads).
* Push notifications / Email alerts for new expenses.
* Multi-currency support and live exchange rates.
* Receipt or image attachments on expenses.
* **Debt Simplification**: The algorithm to minimize the total number of transactions across a group is not implemented; pairwise debts are tracked strictly directly.
* Editing expenses (users must delete and recreate them).
* Admin dashboard.
* Audit logs.
* Analytics and charting.
