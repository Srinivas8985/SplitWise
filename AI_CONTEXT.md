# AI_CONTEXT.md — SplitWise Pro (Splitwise Clone MVP)

> **This file is the single source of truth for the entire project.**
> Every requirement, decision, and tradeoff is documented here.
> The final project must be fully reproducible from this document.

---

## 1. Project Overview

| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| **Project Name**   | SplitWise Pro                                 |
| **Type**           | Splitwise Clone — MVP                      |
| **Goal**           | Reverse-engineer Splitwise, scope a realistic MVP, and build a working deployed application |
| **Status**         | 🟢 Requirements Complete — Ready for BUILD_PLAN |
| **Last Updated**   | 2026-06-14                                 |

---

## 2. Tech Stack (Confirmed)

| Layer          | Technology       | Notes                        |
| -------------- | ---------------- | ---------------------------- |
| Frontend       | React + Vite     | React Router, Axios          |
| Backend        | Node.js + Express|                              |
| Database       | PostgreSQL       |                              |
| ORM            | Prisma           |                              |
| Authentication | JWT              |                              |
| Deploy (FE)    | Vercel           |                              |
| Deploy (BE)    | Render           |                              |
| Deploy (DB)    | Neon             | Serverless Postgres          |

---

## 3. MVP Feature Scope (Confirmed)

### 3.1 Authentication
- Register
- Login

### 3.2 Groups
- Create group
- Add members
- Remove members
- List groups

### 3.3 Expenses
- Create expense
- Equal split
- Unequal split
- Percentage split
- Share-based split

### 3.4 Balances
- Group balances
- Individual balances

### 3.5 Settlements
- Record payment
- Update balances

### 3.6 Expense Chat
- Users can post messages on an expense

### 3.7 Database
- Relational database using PostgreSQL

---

## 4. Requirements (To Be Filled — Interview In Progress)

### 4.1 Product Goals
- **Purpose**: Internship assignment + portfolio project
- **Focus**: Demonstrating product understanding, software engineering skills, and ability to build a working app
- **Success Criteria**:
  1. All required features implemented
  2. Working deployed application
  3. Clean, maintainable code
  4. Proper relational database design
  5. Clear architecture & decision documentation
  6. Ability to explain and defend implementation in an interview
- **Deadline**: 2 days — strict MVP focus, not production-ready
- **Scale**: Demo-scale, evaluation purposes only

### 4.2 User Personas
- **Primary Users**: College students, friends, roommates, travelers splitting shared expenses
- **Roles**: No admin role. All users have equal permissions within groups.
- **Concurrency**: Demo-scale (not designed for large-scale production traffic)

### 4.3 Splitwise Workflows
- **Scope**: All expenses belong to a group. 1-on-1 expenses without a group are **out of scope**.
- **Dashboard**: Yes — overall dashboard showing user's balances across all groups
- **Group View**: Yes — group-level balance details within each group
- **Core Flow**: Register → Create/Join Group → Add Expenses → View Balances → Settle Up

### 4.4 Authentication Details
- **Registration Fields**: Full Name, Email, Password
- **Password Validation**: Minimum 8 characters
- **Out of Scope**: Forgot password, email verification
- **Token Strategy**: JWT access token only (no refresh token)
- **Token Storage**: `localStorage` (MVP simplicity)
- **Flows**:
  - `POST /api/auth/register` — creates user, returns JWT
  - `POST /api/auth/login` — validates credentials, returns JWT

### 4.5 Groups — Detailed Requirements
- **Create Group Fields**: Group Name (required), Description (optional)
- **Adding Members**: By email of an existing registered user
- **Permissions**:
  - Creator can add/remove members
  - Any member can leave the group themselves
- **Deletion**: Only by creator. Cascade-deletes all related records (expenses, splits, settlements, comments).
- **Max Group Size**: No limit for MVP

### 4.6 Expenses — Detailed Requirements
- **Expense Fields**:
  - Description (required, free text)
  - Amount (required)
  - Date (required)
  - Split Type (required: equal | unequal | percentage | share)
  - Paid By (required, single payer)
  - Notes (optional)
- **Who Can Create**: Any group member
- **Edit**: Out of scope — creator can delete and recreate instead
- **Delete**: Only by the expense creator
- **Payer**: Single payer per expense
- **Categories**: Out of scope (free-text description only)

### 4.7 Split Calculation Logic

#### Equal Split
- Total divided equally among selected participants
- Participants can be a **subset** of the group

#### Unequal Split
- User manually enters exact amounts per participant
- Amounts **must sum exactly** to the total expense

#### Percentage Split
- User enters percentage per participant
- Percentages **must sum to 100%**
- Amount = (percentage / 100) × total

#### Share-Based Split
- User assigns integer shares per participant
- Amount = (participant_shares / total_shares) × total

#### Rounding Rules
- All amounts rounded to **2 decimal places**
- Rounding remainder assigned to the **last participant**

#### Payer Participation
- Payer does **not** have to be a split participant
- Payer can pay on behalf of others without being included

### 4.8 Settlements — Detailed Requirements
- **Flow**: User views balances → selects another user → enters settlement amount
- **Debt Simplification**: Out of scope for MVP
- **Partial Settlements**: Supported (can pay less than full owed amount)
- **Scope**: Settlements are always within a specific group
- **History**: Complete settlement history is maintained
- **Balance Principle**: Balances are NEVER stored — always computed from expenses + settlements

### 4.9 Expense Chat — Detailed Requirements
- **Type**: Simple comment thread on each expense (not real-time WebSocket)
- **Edit/Delete Messages**: Not supported in MVP
- **Who Can Post**: Any member of the group (not just expense participants)
- **Display**: Each message shows sender name + timestamp
- **Implementation**: Standard REST API polling (no WebSocket)

### 4.10 Database Schema
- **Balance Strategy**: Computed on-the-fly from `ExpenseSplit` + `Settlement` tables
- **Expense Splits**: Separate `ExpenseSplit` table (1 row per participant per expense)
- **Deletes**: Hard deletes (no soft delete)
- **Timestamps**: `createdAt` + `updatedAt` on all tables
- **Seed Data**: Prisma seed script for testing
- **Core Tables**:
  1. `User` — id, fullName, email, passwordHash, createdAt, updatedAt
  2. `Group` — id, name, description, createdById, createdAt, updatedAt
  3. `GroupMember` — id, groupId, userId, createdAt, updatedAt
  4. `Expense` — id, groupId, description, amount, date, splitType, paidById, createdById, notes, createdAt, updatedAt
  5. `ExpenseSplit` — id, expenseId, userId, amount, percentage (optional), shares (optional), createdAt, updatedAt
  6. `Settlement` — id, groupId, paidById, paidToId, amount, createdAt, updatedAt
  7. `ExpenseComment` — id, expenseId, userId, content, createdAt, updatedAt

### 4.11 API Design
- **Prefix**: `/api/v1/`
- **Style**: RESTful
- **Error Format**:
  ```json
  { "success": false, "message": "Resource not found" }
  ```
- **Success Format**:
  ```json
  { "success": true, "data": { ... } }
  ```
- **Pagination**: Not required for MVP (load all records)
- **Auth Header**: `Authorization: Bearer <token>`

### 4.12 Frontend Architecture
- **State Management**: React Context for auth/global user state; local state elsewhere
- **Responsiveness**: Desktop + mobile responsive
- **Design**: Clean, modern, light theme with green accent colors (Splitwise-inspired)
- **Notifications**: Toast notifications for success/error feedback
- **Key Libraries**: React Router (routing), Axios (HTTP), react-hot-toast or similar (toasts)

### 4.13 Backend Architecture
- **Structure**: Layered architecture
  ```
  server/
  ├── routes/         # Route definitions
  ├── controllers/    # Request handling
  ├── services/       # Business logic
  ├── middleware/     # Auth, error handling, validation
  ├── prisma/         # Schema & migrations
  └── utils/          # Helpers
  ```
- **Error Handling**: Centralized error handling middleware
- **Validation**: Zod for request validation
- **Logging**: Basic console logging (MVP)

### 4.14 Deployment Strategy
- **Accounts**: User will create Vercel, Render, Neon accounts
- **CI/CD**: Out of scope — manual deploys only
- **CORS**: Allow deployed frontend origin + `localhost` during dev
- **Environment Variables**:
  - **Backend** (Render):
    - `DATABASE_URL` — Neon connection string
    - `JWT_SECRET` — signing secret
    - `PORT` — server port
  - **Frontend** (Vercel):
    - `VITE_API_URL` — deployed backend URL
- **Documentation**: All env vars documented in `README.md`

### 4.15 Testing Strategy
- **Primary**: Manual testing
- **Automated**: Vitest for split calculation utility functions
- **API Testing**: Postman collection documenting all endpoints
- **Scope**: Validation testing + core business logic (split calculations)
- **Out of Scope**: E2E tests, component tests, integration tests

### 4.16 Tradeoffs & Decisions

#### Feature Priority (highest → lowest)
| Priority | Feature | Cut Risk |
| -------- | ------- | -------- |
| P0 | Authentication (Register/Login) | Never cut |
| P1 | Groups (Create + Manage Members) | Never cut |
| P2 | Expenses (4 split types) | Never cut |
| P3 | Balances (Dashboard + Group) | Never cut |
| P4 | Settlements | Simplify if needed |
| P5 | Expense Chat | First to cut/simplify |

#### Scope Decisions
- No landing page — app goes directly to Login/Register
- Protected routes for authenticated users
- Form validation on both frontend and backend
- Responsive UI (desktop + mobile)
- Loading and error states on all async operations
- Meaningful Git commit history
- Clean documentation: `README.md`, `BUILD_PLAN.md`, `AI_CONTEXT.md`

#### Explicit Out-of-Scope Items
- Forgot password / email verification
- Refresh tokens
- 1-on-1 expenses (no group)
- Expense categories
- Debt simplification
- Real-time WebSocket chat
- Message edit/delete
- CI/CD pipeline
- Soft deletes
- Pagination
- Admin roles
- Receipt/image uploads
- Multiple payers per expense
- Expense editing (delete + recreate instead)
- E2E / integration / component tests

#### JWT localStorage Tradeoff
- **Choice**: Store JWT in `localStorage`
- **Pro**: Simple to implement, persists across tabs/refreshes, works with Axios interceptors
- **Con**: Vulnerable to XSS attacks (malicious scripts can read the token)
- **Mitigation**: Sanitize all user inputs, use Content Security Policy headers
- **Why acceptable for MVP**: Demo-scale app, no sensitive financial data, 2-day deadline
- **Production alternative**: `httpOnly` cookies with CSRF protection

---

## 5. Interview Log

### Round 1 — Product Goals & User Personas ✅
- Product is internship assignment + portfolio piece
- 2-day deadline, MVP focus
- Demo-scale, no admin roles
- All expenses scoped to groups (no 1-on-1)
- Dashboard + group-level balances both required

### Round 2 — Authentication, Groups, Expenses & Splits ✅
- Auth: name + email + password, JWT in localStorage, no forgot/verify
- Groups: name + optional desc, add by email, creator manages, delete only if settled
- Expenses: desc + amount + date + split type + payer + notes, single payer, creator edits/deletes
- Splits: equal (subset ok), unequal (must sum), percentage (must = 100%), share-based (proportional)
- Rounding: 2 decimals, remainder to last participant
- Payer can pay without being in split

### Round 3 — Settlements, Chat, DB Schema, API & Architecture ✅
- Settlements: user-to-user within group, partial ok, no debt simplification, history kept
- Balances: NEVER stored, always computed from expenses + settlements
- Chat: simple comment thread, no edit/delete, any group member can post
- DB: 7 tables (User, Group, GroupMember, Expense, ExpenseSplit, Settlement, ExpenseComment)
- API: REST, `/api/v1/`, consistent error format, no pagination
- Frontend: React Context for auth, responsive, light theme + green accents, toasts
- Backend: layered (routes/controllers/services/middleware/prisma), Zod validation, centralized errors

### Round 4 — Deployment, Testing & Tradeoffs ✅
- Manual deploy to Vercel/Render/Neon, no CI/CD
- CORS: frontend origin + localhost
- Env vars: DATABASE_URL, JWT_SECRET, PORT, VITE_API_URL
- Testing: manual + Vitest for split logic + Postman collection
- Priority: Auth > Groups > Expenses > Balances > Settlements > Chat
- No landing page, protected routes, form validation, loading/error states
- Meaningful git history, clean docs

---

## 6. Interview Status: ✅ COMPLETE

All requirements gathered. Ready to create `BUILD_PLAN.md` and begin implementation.
