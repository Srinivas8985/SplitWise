# Deployment Checklist

## Backend (Node.js/Express)

### 1. Environment Variables
Ensure the following variables are configured in your production environment (e.g., Render):
- [ ] `PORT`: e.g., 5000 (often auto-injected by platforms like Render)
- [ ] `DATABASE_URL`: Connection string for your production PostgreSQL instance (e.g., Neon).
- [ ] `JWT_SECRET`: A strong, randomly generated string for signing tokens.
- [ ] `CLIENT_URL`: The exact domain of your deployed frontend (e.g., `https://splitwise-pro.vercel.app`) to properly configure CORS.

### 2. Prisma Configuration
- [ ] Ensure `schema.prisma` uses `env("DATABASE_URL")` in the datasource block.
- [ ] Run `npx prisma generate` during the build step.
- [ ] Verify you are using `npx prisma migrate deploy` or `npx prisma db push` (for MVP) as part of the build/start script to ensure the production database schema is up-to-date.

### 3. Build & Start Commands
- [ ] **Build Command**: `npm install && npx prisma generate`
- [ ] **Start Command**: `node src/app.js` (or `node index.js` if that's the entrypoint). Ensure you do *not* use `nodemon` in production.

---

## Frontend (React/Vite)

### 1. Vercel Settings
- [ ] **Framework Preset**: Vite
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `dist`

### 2. Environment Variables
- [ ] `VITE_API_URL`: Set this to your deployed backend URL (e.g., `https://splitwise-pro-api.onrender.com/api/v1`).
- [ ] Ensure the variable starts with `VITE_` so Vite injects it into the production bundle.

### 3. API URL Configuration
- [ ] Verify `client/src/api/axios.js` correctly falls back to `import.meta.env.VITE_API_URL`.

---

## Database (PostgreSQL/Neon)

### 1. Neon Configuration
- [ ] Create a new project/branch specifically for production.
- [ ] Copy the pooled connection string (usually ending in `?pgbouncer=true` or similar, depending on Prisma requirements). *Note: Prisma v5 often requires a direct connection string for migrations and a pooled string for the application.*

### 2. Production Database Verification
- [ ] Connect to the production database using a tool like DBeaver or Prisma Studio.
- [ ] Verify that all 7 tables (`User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Settlement`, `ExpenseComment`) exist after the initial deployment.

---

## Security

### 1. JWT Secret Validation
- [ ] Ensure the production `JWT_SECRET` is completely different from the local development secret.
- [ ] Ensure it is cryptographically long (e.g., 64 random hex characters).

### 2. CORS Verification
- [ ] Verify `server/src/app.js` strictly allows `process.env.CLIENT_URL`.
- [ ] Test the backend by attempting a curl request from a random origin; it should be rejected.

### 3. `.env` Protection
- [ ] Verify that `.env` files are in `.gitignore` for both `client/` and `server/`.
- [ ] Verify that no `.env` files have been accidentally committed to the GitHub repository.

### 4. GitHub Secret Scanning
- [ ] Push code to GitHub and check the Security tab to ensure no hardcoded secrets (like Neon URLs or JWT keys) were flagged in the source code.
