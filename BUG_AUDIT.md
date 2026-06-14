# Bug Audit & Code Review

The following is a review of potential bugs, edge cases, and logic flaws in the completed MVP.

### 1. Unrestricted Group Deletion
* **Severity**: Medium
* **Description**: The `deleteGroup` endpoint currently relies on Prisma's `onDelete: Cascade` to wipe all `GroupMember`, `Expense`, and `Settlement` records. However, allowing a group creator to instantly delete a group that has outstanding, unsettled debts destroys the financial record, leaving users with no proof of who owes them money.
* **Recommended Fix**: Add a check in `group.service.js` before calling `prisma.group.delete()` to ensure the aggregated outstanding net balance for all members in the group is exactly 0. If not, throw an HTTP 400 error: "Cannot delete group until all debts are settled."

### 2. Over-settlement (Paying more than you owe)
* **Severity**: Low
* **Description**: The `createSettlement` service does not verify if the settlement `amount` exceeds the actual calculated debt between the two users. While this mathematically works out (the balance engine will just flip the debt so the creditor now owes the debtor), it is confusing UX for an MVP.
* **Recommended Fix**: Before creating the settlement, fetch the current net pairwise balance using the `balance.service.js` logic and reject the settlement if `amount > currentDebt`.

### 3. Adding Existing Members
* **Severity**: Low
* **Description**: If the group creator tries to invite a user by email who is *already* in the group, the system currently throws an unhandled Prisma `P2002` Unique Constraint violation error (because of `@@unique([groupId, userId])` on `GroupMember`), resulting in a generic 500 error on the frontend.
* **Recommended Fix**: Add an explicit check in `group.service.js`'s `addMember` function: `if (existingMember) throw createError('User is already in the group', 400);` to provide a friendly UX error.

### 4. Split Type Validation Edge Case (Share Split)
* **Severity**: Low
* **Description**: In `splitCalculator.js`, the `shareSplit` function divides the total amount by the sum of all shares. If a user maliciously sends a payload where every participant's `shares` value is `0`, the system will attempt to divide by zero, resulting in `Infinity` or `NaN` being saved to the database.
* **Recommended Fix**: Add a Zod validation rule in `expense.validator.js` for the `SHARE` split type that enforces `shares >= 1` for all participants, and ensure the total share sum is `> 0` in the calculator utility.

### 5. Floating Point Rounding on Extreme Amounts
* **Severity**: Low
* **Description**: The application uses JavaScript's `Math.round(val * 100) / 100` to handle decimals. For extremely large numbers (e.g., billions), JavaScript's Number type (which is a double-precision float) loses precision.
* **Recommended Fix**: Since Prisma uses `Decimal` for the database, the Node.js backend should ideally use a library like `decimal.js` or `bignumber.js` to perform the split math instead of native JS floats.
