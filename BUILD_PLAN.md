# BUILD_PLAN.md — Spreetrail

> **Implementation roadmap derived from [AI_CONTEXT.md](./AI_CONTEXT.md).**
> Every phase, task, and decision is documented here before code is written.

---

## 1. Project Structure

```
Spreetrail/
├── client/                     # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios instance + API service functions
│   │   │   ├── axios.js        # Axios instance with interceptors
│   │   │   ├── auth.js         # Auth API calls
│   │   │   ├── groups.js       # Group API calls
│   │   │   ├── expenses.js     # Expense API calls
│   │   │   ├── settlements.js  # Settlement API calls
│   │   │   └── comments.js     # Expense chat API calls
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Button, Input, Modal, Loader, Toast, etc.
│   │   │   ├── layout/         # Navbar, Sidebar, PageLayout
│   │   │   ├── groups/         # GroupCard, GroupList, MemberList
│   │   │   ├── expenses/       # ExpenseForm, ExpenseCard, SplitInput
│   │   │   ├── balances/       # BalanceCard, BalanceSummary
│   │   │   ├── settlements/    # SettleUpForm, SettlementHistory
│   │   │   └── chat/           # CommentThread, CommentInput
│   │   ├── context/            # React Context providers
│   │   │   └── AuthContext.jsx # Auth state + JWT management
│   │   ├── hooks/              # Custom hooks
│   │   ├── pages/              # Route-level page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── GroupDetailPage.jsx
│   │   │   ├── CreateGroupPage.jsx
│   │   │   ├── AddExpensePage.jsx
│   │   │   └── ExpenseDetailPage.jsx
│   │   ├── utils/              # Helpers (split calculators, formatters)
│   │   ├── App.jsx             # Router setup
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles + design system
│   ├── .env                    # VITE_API_URL
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── routes/             # Express route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── group.routes.js
│   │   │   ├── expense.routes.js
│   │   │   ├── settlement.routes.js
│   │   │   └── comment.routes.js
│   │   ├── controllers/        # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── group.controller.js
│   │   │   ├── expense.controller.js
│   │   │   ├── settlement.controller.js
│   │   │   └── comment.controller.js
│   │   ├── services/           # Business logic
│   │   │   ├── auth.service.js
│   │   │   ├── group.service.js
│   │   │   ├── expense.service.js
│   │   │   ├── balance.service.js
│   │   │   ├── settlement.service.js
│   │   │   └── comment.service.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── validators/        # Zod schemas
│   │   │   ├── auth.validator.js
│   │   │   ├── group.validator.js
│   │   │   ├── expense.validator.js
│   │   │   ├── settlement.validator.js
│   │   │   └── comment.validator.js
│   │   ├── utils/             # Helpers
│   │   │   ├── splitCalculator.js
│   │   │   └── response.js
│   │   └── app.js             # Express app setup
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── .env                   # DATABASE_URL, JWT_SECRET, PORT
│   ├── index.js               # Server entry point
│   └── package.json
│
├── AI_CONTEXT.md               # Source of truth
├── BUILD_PLAN.md               # This file
├── README.md                   # Setup + deployment docs
└── .gitignore
```

---

## 2. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  groupsCreated   Group[]          @relation("GroupCreator")
  groupMemberships GroupMember[]
  expensesPaid    Expense[]        @relation("ExpensePayer")
  expensesCreated Expense[]        @relation("ExpenseCreator")
  expenseSplits   ExpenseSplit[]
  settlementsPaid Settlement[]     @relation("SettlementPayer")
  settlementsReceived Settlement[] @relation("SettlementReceiver")
  comments        ExpenseComment[]
}

model Group {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  createdBy   User          @relation("GroupCreator", fields: [createdById], references: [id])
  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]
}

model GroupMember {
  id        String   @id @default(uuid())
  groupId   String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
}

enum SplitType {
  EQUAL
  UNEQUAL
  PERCENTAGE
  SHARE
}

model Expense {
  id          String    @id @default(uuid())
  groupId     String
  description String
  amount      Decimal   @db.Decimal(10, 2)
  date        DateTime
  splitType   SplitType
  paidById    String
  createdById String
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  group     Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidBy    User           @relation("ExpensePayer", fields: [paidById], references: [id])
  createdBy User           @relation("ExpenseCreator", fields: [createdById], references: [id])
  splits    ExpenseSplit[]
  comments  ExpenseComment[]
}

model ExpenseSplit {
  id         String   @id @default(uuid())
  expenseId  String
  userId     String
  amount     Decimal  @db.Decimal(10, 2)
  percentage Decimal? @db.Decimal(5, 2)
  shares     Int?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@unique([expenseId, userId])
}

model Settlement {
  id        String   @id @default(uuid())
  groupId   String
  paidById  String
  paidToId  String
  amount    Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  group  Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidBy User  @relation("SettlementPayer", fields: [paidById], references: [id])
  paidTo User  @relation("SettlementReceiver", fields: [paidToId], references: [id])
}

model ExpenseComment {
  id        String   @id @default(uuid())
  expenseId String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])
}
```

---

## 3. API Endpoints

### 3.1 Authentication
| Method | Endpoint                | Description          | Auth |
| ------ | ----------------------- | -------------------- | ---- |
| POST   | `/api/v1/auth/register` | Register new user    | No   |
| POST   | `/api/v1/auth/login`    | Login, return JWT    | No   |
| GET    | `/api/v1/auth/me`       | Get current user     | Yes  |

### 3.2 Groups
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| POST   | `/api/v1/groups`                      | Create group             | Yes  |
| GET    | `/api/v1/groups`                      | List user's groups       | Yes  |
| GET    | `/api/v1/groups/:groupId`             | Get group details        | Yes  |
| DELETE | `/api/v1/groups/:groupId`             | Delete group (creator)   | Yes  |
| POST   | `/api/v1/groups/:groupId/members`     | Add member by email      | Yes  |
| DELETE | `/api/v1/groups/:groupId/members/:userId` | Remove member (creator) | Yes |
| POST   | `/api/v1/groups/:groupId/leave`       | Leave group (self)       | Yes  |

### 3.3 Expenses
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| POST   | `/api/v1/groups/:groupId/expenses`    | Create expense           | Yes  |
| GET    | `/api/v1/groups/:groupId/expenses`    | List group expenses      | Yes  |
| GET    | `/api/v1/expenses/:expenseId`         | Get expense detail       | Yes  |
| DELETE | `/api/v1/expenses/:expenseId`         | Delete expense (creator) | Yes  |

### 3.4 Balances
| Method | Endpoint                              | Description                | Auth |
| ------ | ------------------------------------- | -------------------------- | ---- |
| GET    | `/api/v1/groups/:groupId/balances`    | Get group balances         | Yes  |
| GET    | `/api/v1/balances`                    | Get user's overall balances| Yes  |

### 3.5 Settlements
| Method | Endpoint                                  | Description              | Auth |
| ------ | ----------------------------------------- | ------------------------ | ---- |
| POST   | `/api/v1/groups/:groupId/settlements`     | Record settlement        | Yes  |
| GET    | `/api/v1/groups/:groupId/settlements`     | Get settlement history   | Yes  |

### 3.6 Expense Comments
| Method | Endpoint                                  | Description              | Auth |
| ------ | ----------------------------------------- | ------------------------ | ---- |
| POST   | `/api/v1/expenses/:expenseId/comments`    | Add comment              | Yes  |
| GET    | `/api/v1/expenses/:expenseId/comments`    | Get comments             | Yes  |

---

## 4. Balance Calculation Logic

Balances are **never stored** — always computed dynamically.

### Algorithm
```
For a given group:
  1. Initialize balanceMap = {} for each member (userId → netBalance)
  2. For each expense in the group:
     - paidBy gets +expense.amount
     - Each split participant gets -split.amount
  3. For each settlement in the group:
     - paidBy gets -settlement.amount (they paid, reducing what others owe them)
     - paidTo gets +settlement.amount (they received, reducing what they owe)
  4. Result: positive balance = others owe you, negative = you owe others
```

### Pairwise Balances
```
For detailed "who owes whom":
  - Build a ledger of directional debts from expense splits
  - Offset with settlements
  - Net each pair (A→B vs B→A) into a single directional balance
```

---

## 5. Split Calculator Logic

### Equal Split
```js
function equalSplit(totalAmount, participantIds) {
  const perPerson = Math.floor((totalAmount * 100) / participantIds.length) / 100;
  const remainder = totalAmount - perPerson * participantIds.length;
  // Last participant absorbs remainder
}
```

### Unequal Split
```js
function unequalSplit(totalAmount, splits) {
  // Validate: sum of splits === totalAmount
  // Return as-is after validation
}
```

### Percentage Split
```js
function percentageSplit(totalAmount, percentages) {
  // Validate: sum of percentages === 100
  // Calculate: amount = (percentage / 100) * totalAmount
  // Round to 2 decimals, remainder to last participant
}
```

### Share-Based Split
```js
function shareSplit(totalAmount, shares) {
  // totalShares = sum of all shares
  // amount = (participantShares / totalShares) * totalAmount
  // Round to 2 decimals, remainder to last participant
}
```

---

## 6. Frontend Pages & Routes

| Route                     | Page Component       | Auth Required | Description                  |
| ------------------------- | -------------------- | ------------- | ---------------------------- |
| `/login`                  | LoginPage            | No            | Login form                   |
| `/register`               | RegisterPage         | No            | Registration form            |
| `/dashboard`              | DashboardPage        | Yes           | Overall balances + group list|
| `/groups/new`             | CreateGroupPage      | Yes           | Create group form            |
| `/groups/:groupId`        | GroupDetailPage       | Yes           | Expenses, balances, members  |
| `/groups/:groupId/expenses/new` | AddExpensePage | Yes           | Create expense form          |
| `/expenses/:expenseId`    | ExpenseDetailPage    | Yes           | Expense details + chat       |

### Auth Flow
- Unauthenticated users → redirect to `/login`
- Authenticated users visiting `/login` or `/register` → redirect to `/dashboard`
- JWT stored in `localStorage`, attached via Axios interceptor

---

## 7. Implementation Phases

### Phase 1: Project Setup (30 min)
- [ ] Initialize Vite + React project in `client/`
- [ ] Initialize Node.js + Express project in `server/`
- [ ] Configure Prisma with PostgreSQL (Neon)
- [ ] Set up `.env` files
- [ ] Set up `.gitignore`
- [ ] Install all dependencies
- [ ] Create initial Prisma schema and run migration
- [ ] Create Prisma seed script
- [ ] Set up Express app skeleton (middleware, error handler, CORS)
- [ ] Set up Axios instance with interceptor
- [ ] Set up React Router with protected routes
- [ ] Set up AuthContext

### Phase 2: Authentication (1 hr)
- [ ] **Backend**: Auth routes, controller, service, validator
  - Register (hash password with bcrypt, return JWT)
  - Login (validate credentials, return JWT)
  - Get current user (verify JWT)
- [ ] **Frontend**: Login page, Register page
  - Form validation
  - AuthContext integration
  - Token persistence in localStorage
  - Redirect logic

### Phase 3: Groups (1.5 hr)
- [ ] **Backend**: Group CRUD routes, controller, service, validator
  - Create group (auto-add creator as member)
  - List user's groups
  - Get group detail (with members)
  - Add member by email
  - Remove member (creator only)
  - Leave group (self)
  - Delete group (creator, only if no balances/expenses)
- [ ] **Frontend**: Group list on dashboard, create group page, group detail page
  - Member management UI
  - Group cards with member count

### Phase 4: Expenses + Splits (2.5 hr)
- [ ] **Backend**: Expense CRUD with split calculation
  - Create expense with split validation
  - Split calculator utility (equal, unequal, percentage, share)
  - Store ExpenseSplit rows (with optional percentage/shares fields)
  - Delete expense (creator only)
  - List group expenses
  - Get expense detail with splits
- [ ] **Frontend**: Add expense page with split type selector
  - Dynamic form for each split type
  - Participant selection (subset of group)
  - Validation (amounts sum, percentages sum to 100%)
  - Expense list in group detail

### Phase 5: Balances (1.5 hr)
- [ ] **Backend**: Balance calculation service
  - Group balances endpoint
  - Overall user balances endpoint
  - Pairwise balance computation
- [ ] **Frontend**: Balance display
  - Dashboard: overall balances across groups
  - Group detail: who owes whom within group
  - Color-coded (green = owed to you, red = you owe)

### Phase 6: Settlements (1 hr)
- [ ] **Backend**: Settlement routes, controller, service
  - Record settlement (paidBy, paidTo, amount, groupId)
  - List settlement history for group
- [ ] **Frontend**: Settle up flow
  - Select user to settle with
  - Enter amount (pre-fill with owed amount)
  - Settlement history view

### Phase 7: Expense Chat (45 min)
- [ ] **Backend**: Comment routes, controller, service
  - Add comment to expense
  - List comments for expense
- [ ] **Frontend**: Comment thread on expense detail page
  - Message input
  - Message list with sender name + timestamp

### Phase 8: Polish & Deploy (1.5 hr)
- [ ] UI polish: responsive layout, loading states, error states, toasts
- [ ] Test all flows end-to-end manually
- [ ] Write Vitest tests for split calculator
- [ ] Deploy backend to Render
- [ ] Deploy database to Neon
- [ ] Deploy frontend to Vercel
- [ ] Configure env vars in production
- [ ] Test deployed application
- [ ] Write README.md with setup instructions
- [ ] Create Postman collection

---

## 8. Dependencies

### Frontend (`client/package.json`)
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "^1",
    "react-hot-toast": "^2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4",
    "vite": "^5"
  }
}
```

### Backend (`server/package.json`)
```json
{
  "dependencies": {
    "express": "^4",
    "cors": "^2",
    "@prisma/client": "^5",
    "bcryptjs": "^2",
    "jsonwebtoken": "^9",
    "zod": "^3",
    "dotenv": "^16"
  },
  "devDependencies": {
    "prisma": "^5",
    "nodemon": "^3",
    "vitest": "^1"
  }
}
```

---

## 9. Key Implementation Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| UUIDs vs auto-increment IDs | UUIDs | More secure for URLs, no sequential guessing |
| Password hashing | bcryptjs | Industry standard, pure JS (no native deps) |
| Decimal handling | Prisma `Decimal(10,2)` | Avoids floating-point issues for money |
| Balance storage | Computed, never stored | Avoids sync issues, single source of truth |
| Split validation | Backend + Frontend | Backend is authoritative, frontend for UX |
| Auth guard | Middleware + React Router | Protected at both layers |
| Error format | `{ success, message, data? }` | Consistent contract for frontend |
| File structure | Layered (not feature-based) | Clearer separation of concerns for MVP size |
| JWT storage | localStorage | Simple for MVP; tradeoff: XSS vulnerable (documented in AI_CONTEXT) |
| Group deletion | Cascade delete | Simpler than checking for outstanding balances |
| Expense editing | Not supported (delete + recreate) | Reduces complexity, avoids split recalculation edge cases |
| ExpenseSplit fields | amount + optional percentage/shares | Preserves original split intent for display purposes |

---

## 10. Estimated Timeline

| Phase | Task | Time Estimate |
| ----- | ---- | ------------- |
| 1 | Project Setup | 30 min |
| 2 | Authentication | 1 hr |
| 3 | Groups | 1.5 hr |
| 4 | Expenses + Splits | 2.5 hr |
| 5 | Balances | 1.5 hr |
| 6 | Settlements | 1 hr |
| 7 | Expense Chat | 45 min |
| 8 | Polish + Deploy | 1.5 hr |
| **Total** | | **~10.25 hr** |

> Fits within a 2-day window with buffer for debugging and unforeseen issues.