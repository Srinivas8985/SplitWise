/**
 * SplitWise Pro — Express App Setup
 * Configures middleware, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');
const expenseRoutes = require('./routes/expense.routes');
const settlementRoutes = require('./routes/settlement.routes');
const commentRoutes = require('./routes/comment.routes');
const balanceRoutes = require('./routes/balance.routes');
const importRoutes = require('./routes/import.routes');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  process.env.CLIENT_URL,  // Deployed frontend (Vercel)
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'SplitWise Pro API is running' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/groups/:groupId/expenses', expenseRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/groups/:groupId/settlements', settlementRoutes);
app.use('/api/v1/expenses/:expenseId/comments', commentRoutes);
app.use('/api/v1/balances', balanceRoutes);
app.use('/api/v1/groups/:groupId/balances', balanceRoutes);
app.use('/api/v1/import', importRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
