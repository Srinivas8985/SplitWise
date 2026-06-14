# SplitWise Pro

## Project Overview

SplitWise Pro is a Splitwise-inspired expense sharing and tracking application. It allows users to form groups, add shared expenses, calculate exact pairwise balances, and record settlements. The application simplifies the process of tracking who paid for what and who owes whom, supporting various complex splitting algorithms (equal, unequal, percentage, and shares) while keeping all members synced.

### Key Features
* **Authentication**: Secure user registration and login using JWT.
* **Groups & Member Management**: Create groups and invite friends via email.
* **Advanced Expense Splitting**: 
  * **Equal Split**: Divide exactly evenly.
  * **Unequal Split**: Assign specific dollar amounts per person.
  * **Percentage Split**: Assign percentages (must sum to 100%).
  * **Share Split**: Proportional splitting based on shares (e.g., A brings a +1 = 2 shares, B = 1 share).
* **Dynamic Balance Calculation**: Real-time computation of pairwise debts within groups and overall net balances across the dashboard.
* **Settlements**: Record partial or full payments between group members to clear debts.
* **Expense Comments**: Group members can discuss specific expenses in an append-only comment thread.
* **CSV Import & Anomaly Report**: Ingests `expenses_export.csv`, detects data anomalies (like missing currencies, zero amounts, precision rounding, and misclassified settlements), and successfully imports clean rows while rendering a detailed anomaly report UI.

> **Import Results:** *Processed: 42 | Imported: 39 | Rejected: 3*

![CSV Import + Anomaly Report](./docs/import-screenshot-placeholder.png)

## Tech Stack

* **Frontend**: React, Vite, React Router, Axios, React Hot Toast
* **Backend**: Node.js, Express
* **Database**: PostgreSQL
* **ORM**: Prisma (v5.21.1)
* **Deployment (Planned)**: Vercel (Frontend), Render (Backend), Neon (Database)

## Architecture Overview

The system is built on a relational data model with the following core entities:
* **User**: Represents registered individuals.
* **Group**: A container for expenses and members.
* **GroupMember**: A mapping table linking Users to Groups.
* **Expense**: A single transaction paid by one user.
* **ExpenseSplit**: The exact calculated share (amount) each participant owes for a specific expense.
* **Settlement**: A payment record from a debtor to a creditor to resolve balances.
* **ExpenseComment**: A simple text thread linked to an expense for discussion.

Balances are **not** stored statically. Instead, the balance engine dynamically computes "who owes whom" on the fly by aggregating `ExpenseSplit` records (debts incurred) and `Settlement` records (debts paid).

## Folder Structure

```text
SplitWise Pro/
├── client/                 # React Frontend
│   ├── public/
│   └── src/
│       ├── api/            # Axios API wrappers
│       ├── components/     # Reusable UI components
│       ├── context/        # React Context (Auth)
│       ├── pages/          # Main route views
│       ├── index.css       # Global styling
│       └── App.jsx         # Routing configuration
└── server/                 # Node.js/Express Backend
    ├── prisma/
    │   ├── schema.prisma   # Database schema
    │   └── seed.js         # Initial seed data
    └── src/
        ├── controllers/    # Request handlers
        ├── middleware/     # Auth and Error handling
        ├── routes/         # Express route definitions
        ├── services/       # Core business logic
        ├── utils/          # Calculators and helpers
        ├── validators/     # Zod validation schemas
        └── app.js          # App initialization
```

## Setup Instructions

### Database Setup
1. Create a PostgreSQL database (e.g., using Neon.tech or a local instance).
2. Note your connection string.

### Environment Variables
**Backend (`server/.env`)**
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host/db"
JWT_SECRET="your_super_secret_key"
CLIENT_URL="http://localhost:5173"
```

**Frontend (`client/.env`)**
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

### Backend Setup
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed  # Optional: load test data
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Authenticate user | No |
| GET | `/api/v1/auth/me` | Get current user profile | Yes |
| POST | `/api/v1/groups` | Create a new group | Yes |
| GET | `/api/v1/groups` | List user's groups | Yes |
| GET | `/api/v1/groups/:id` | Get group details | Yes |
| POST | `/api/v1/groups/:id/members` | Add member to group | Yes |
| DELETE | `/api/v1/groups/:id/members/:userId` | Remove member | Yes |
| POST | `/api/v1/groups/:id/expenses` | Add a new expense | Yes |
| GET | `/api/v1/groups/:id/expenses` | List group expenses | Yes |
| GET | `/api/v1/expenses/:id` | Get expense details | Yes |
| DELETE | `/api/v1/expenses/:id` | Delete an expense | Yes |
| GET | `/api/v1/balances/dashboard` | Get cross-group net balances | Yes |
| GET | `/api/v1/groups/:id/balances` | Get pairwise group debts | Yes |
| POST | `/api/v1/groups/:id/settlements` | Record a payment | Yes |
| GET | `/api/v1/groups/:id/settlements` | View settlement history | Yes |
| POST | `/api/v1/expenses/:id/comments` | Add comment to expense | Yes |
| GET | `/api/v1/expenses/:id/comments` | Get expense comments | Yes |
| POST | `/api/v1/import/csv` | Import expenses from CSV | Yes |

## Deployment
- **Database**: Host PostgreSQL on Neon.
- **Backend**: Deploy the Node.js server to Render. Set `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_URL`.
- **Frontend**: Deploy to Vercel. Set `VITE_API_URL` to the deployed backend URL.

## Future Improvements
- Implement debt simplification algorithm to minimize transactions.
- Add receipt image uploads (AWS S3 integration).
- Allow multiple payers on a single expense.
- Add activity/audit logs for group events.
