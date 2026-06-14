# AI Usage Documentation

This document outlines how Artificial Intelligence tools were utilized during the development of Spreetrail.

## AI Tools Used
* **Anthropic Claude Opus 4.6 / Google Gemini** (via integrated agent IDE framework)

## How AI Was Used

1. **Architecture Planning**: AI was used to brainstorm the sequence of phases for rapid MVP delivery (Auth -> Groups -> Expenses -> Balances -> Settlements -> Polish).
2. **Database Design Review**: AI assisted in designing the relational schema, specifically recommending the separation of `Expense` and `ExpenseSplit` and ensuring proper cascading delete rules on `GroupMember`.
3. **Complex Logic Generation**: AI wrote the core mathematical algorithms in `splitCalculator.js` to handle Equal, Unequal, Percentage, and Share splits, including the precise logic for distributing rounding remainders to prevent floating-point loss.
4. **Boilerplate Generation**: AI rapidly generated standard Express controllers, Zod validation schemas, and React components based on predefined design patterns.
5. **Debugging & Refactoring**: AI helped diagnose route mounting issues and fix Prisma schema discrepancies.
6. **Data Analysis & Import Implementation**: AI was used to analyze the provided `expenses_export.csv` to identify structural anomalies, map out edge cases, and subsequently implement a minimal ingestion API using `multer` and `csv-parser` to fulfill the import report requirement.

## Key Prompts Used

* *"Before implementing Expenses, show me request payload examples for Equal, Unequal, Percentage, and Share splits, and the exact ExpenseSplit table data that will be stored for each."*
* *"Before Phase 5, show me the final Prisma ExpenseSplit model and explain exactly what the amount field represents. Is it Participant share of the expense OR Net balance impact for that participant?"*
* *"Implement Phase 5: Balances. Requirements: Group balances endpoint, Overall dashboard balances endpoint, Pairwise debt calculation, Netting logic, Settlement integration support."*

## AI Mistakes Encountered

### 1. Prisma Versioning Issue
* **Issue**: The AI initially generated a Prisma schema and client initialization script that utilized a custom `output` generator path and attempted to pass the `datasourceUrl` directly to the `PrismaClient` constructor in a way that was incompatible with the specific installed version of Prisma (v5).
* **Impact**: The Node server crashed on startup (`Cannot find module '../generated/prisma'`) and subsequently threw type errors when attempting to initialize the client.
* **Correction**: The AI was instructed to revert to the standard `prisma-client-js` provider, downgrade Prisma to version `5.21.1`, and rely on the native `.env` variable loading for the database connection string.

### 2. Incorrect Balance Modelling Approach
* **Issue**: During Phase 4 (Expenses), the AI attempted to calculate and store the *net amount owed* (i.e., total share minus amount paid) directly in the `ExpenseSplit.amount` column, while simultaneously naming the variable `amountOwed` which didn't exist in the schema.
* **Impact**: This approach would have tightly coupled the payment history into the split definition, breaking the database schema and making it mathematically difficult to compute pairwise debts dynamically later.
* **Correction**: A user review caught the bug. The AI was instructed to rewrite the logic to store strictly the *participant's positive share* in the `amount` column, and derive the pairwise debts dynamically in Phase 5 using the `paidById` field on the parent `Expense`.

### 3. Route Mounting Hierarchy
* **Issue**: The AI attempted to mount the group-specific settlement deletion route or expense deletion route globally without passing the `groupId`. For instance, in Phase 6, the AI initially wrote `app.use('/api/v1/settlements', settlementRoutes);` instead of nesting it.
* **Impact**: This broke RESTful routing conventions and made it difficult to validate group membership via `req.params.groupId` in the middleware/controllers.
* **Correction**: The AI was instructed to update `app.js` to mount the routes properly as `app.use('/api/v1/groups/:groupId/settlements', settlementRoutes);` ensuring the `groupId` parameter was correctly merged into the router context.

## Lessons Learned
* **Verify Database Schemas Early**: AI tends to hallucinate column names or drift from agreed-upon designs (like `amountOwed` vs `amount`). Explicitly reviewing the Prisma schema with the AI before letting it generate the service layer prevented major data corruption.
* **Ask for Worked Examples**: Asking the AI to manually trace a mathematical example (e.g., "Show a worked example for a ₹1200 expense paid by User A") forces the model to evaluate its own logic, surfacing bugs before code is even written.
* **Incremental Steps**: Limiting the AI to generating one phase or one file at a time, rather than the entire app, was crucial for maintaining control over the architecture and avoiding cascading errors.
