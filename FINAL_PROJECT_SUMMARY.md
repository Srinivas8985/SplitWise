# SplitWise Pro: Final Project Summary

## Architecture
SplitWise Pro is a modern, full-stack web application built using the PERN-like stack (PostgreSQL, Express, React, Node.js), augmented with Prisma as the ORM. The frontend is a Single Page Application (SPA) bundled with Vite, relying on React Router for client-side navigation and the Context API for lightweight global state management (Authentication). The backend is a stateless REST API built with Express, structured into a clean layered architecture: Routes -> Controllers -> Services -> Database. 

## Database Design
The relational database schema is normalized and highly structured to enforce financial integrity. The core entities are `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Settlement`, and `ExpenseComment`. 
* Referential integrity is strictly maintained via Prisma relations (e.g., cascading deletes from `Group` to `GroupMember` and `Expense`).
* A critical design decision was separating `Expense` (the parent transaction) from `ExpenseSplit` (the individual shares), allowing infinite flexibility in how an expense is divided among participants without altering the parent schema.

## Authentication Flow
The application utilizes JWT (JSON Web Tokens) for secure, stateless authentication. 
* Passwords are hashed via `bcrypt` before storage.
* Upon successful login or registration, the backend issues a signed JWT.
* The frontend stores this token in `localStorage` and attaches it as a Bearer token to all subsequent API requests via an Axios interceptor. 
* Protected React routes ensure unauthenticated users are seamlessly redirected to the login view.

## Expense Split Logic
A standalone `splitCalculator.js` utility isolates the complex mathematical logic required for four distinct splitting algorithms:
1. **Equal**: Total amount divided evenly by the number of participants.
2. **Unequal**: Specific dollar amounts assigned to participants (validated to perfectly sum to the total).
3. **Percentage**: Specific percentages assigned (validated to perfectly sum to 100).
4. **Share**: Proportional splitting based on abstract weights (e.g., 2 shares vs 1 share).

**The Rounding Solution**: To prevent floating-point discrepancies (e.g., $100 / 3 = 33.333...), the calculator iterates through the participants, applying standard 2-decimal rounding. It maintains a running tally of the `distributed` amount, and the *final* participant in the array is forcefully assigned the remainder (`Total - Distributed`). This guarantees the sum of the splits will always exactly equal the original total down to the cent.

## Balance Calculation Logic
Instead of statically storing balances (which risks desynchronization), SplitWise Pro computes balances dynamically on the fly:
1. **Build Debt Map**: The engine iterates over every `Expense`. For every participant in the `ExpenseSplit` array who is *not* the payer, their specific split amount is added as a debt owed to the payer.
2. **Apply Settlements**: The engine iterates over every `Settlement` in the group, subtracting the settled amount from the debt owed by the payer to the receiver.
3. **Netting**: The system computes the net difference between any two users (e.g., if A owes B $400, and B owes A $200, it simplifies to B owing A $200). 

## Settlement Workflow
Users can record partial or full settlements. The `SettleUp` UI component intelligently fetches the current user's computed debts and auto-fills the exact outstanding amount when a recipient is selected from the dropdown. This ensures a frictionless user experience when clearing debts.

## Comment System
A lightweight, real-time-feeling comment thread was implemented on the Expense Detail view. It utilizes standard HTTP requests rather than WebSockets to reduce infrastructure overhead while still providing users a space to discuss specific expenses. Comments are strictly append-only.

## Major Technical Challenges & Solutions
**Challenge**: Prisma schema versioning conflicts with the deployment environment variables.
* **Solution**: Downgraded `prisma` and `@prisma/client` from v6 back to v5.21.1, ensuring full compatibility with the native `env("DATABASE_URL")` syntax without requiring custom generator output paths.

**Challenge**: Deciding how to store the result of an expense split. Initially, the system attempted to store the "Net Amount Owed" in the database, which tightly coupled the payment action to the split definition.
* **Solution**: Refactored the architecture to strictly store the *Participant's Share* (a positive number) in the `ExpenseSplit` table. The balance engine was then rewritten to derive debts by comparing the `Expense.paidById` against the positive shares. This drastically simplified the mental model and the code.

## Key Learnings
* **Stateless over Stateful Balances**: Calculating financial balances dynamically via a ledger of immutable transactions is vastly superior to updating static balance columns. It eliminates the risk of race conditions and makes auditing/recalculation trivial.
* **Separation of Concerns**: Keeping the mathematical rounding logic completely decoupled from the Prisma database queries allowed for robust unit testing of the split algorithms without needing a database connection.
* **UI/UX Value**: Auto-filling data (like the exact debt amount in the Settlement form) provides disproportionately high user satisfaction compared to the minimal effort required to implement it.
