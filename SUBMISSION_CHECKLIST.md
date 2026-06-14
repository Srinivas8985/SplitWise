# Final Submission Verification Checklist

Before submitting the assignment, ensure all deliverables are present, accurate, and fully functional.

### 1. Public Deployed URL
* **Purpose**: Allows evaluators to test the live application without setting up a local environment.
* **Contents**: Fully working Vite/React frontend connected to a live Node/PostgreSQL backend.
* **Verification Steps**:
  - [ ] Navigate to the deployed Vercel URL.
  - [ ] Register a new account.
  - [ ] Create a group, add an expense, and verify the backend processes it.

### 2. GitHub Repository
* **Purpose**: Source code review.
* **Contents**: The complete `client` and `server` directories, properly structured and clean.
* **Verification Steps**:
  - [ ] Check `.gitignore` to ensure `node_modules`, `dist`, and `.env` files are NOT committed.
  - [ ] Verify commit history is clean and descriptive.
  - [ ] Ensure `package.json` contains all necessary start/build scripts.

### 3. README.md
* **Purpose**: Primary entry point for developers reviewing the project.
* **Contents**: Setup instructions, architecture overview, tech stack, and API endpoint tables.
* **Verification Steps**:
  - [ ] Verify the file exists in the root directory.
  - [ ] Read through to ensure setup steps actually work.

### 4. SCOPE.md
* **Purpose**: Defines the boundaries of the MVP.
* **Contents**: Problem statement, database schema, business rules, and explicitly out-of-scope features.
* **Verification Steps**:
  - [ ] Verify all 7 database tables are documented.
  - [ ] Ensure Out of Scope clearly mentions excluded features like Debt Simplification and Auth-Emails.

### 5. DECISIONS.md
* **Purpose**: Demonstrates engineering maturity by explaining *why* choices were made.
* **Contents**: A 10-point log covering database choice, JWT, Balance calculation strategy, etc.
* **Verification Steps**:
  - [ ] Verify it covers "Computed vs Stored Balances" clearly.

### 6. AI_USAGE.md
* **Purpose**: Evaluates transparency and ability to debug AI-generated code.
* **Contents**: List of tools, use cases, and 3 specific mistakes/hallucinations encountered.
* **Verification Steps**:
  - [ ] Check if the Prisma versioning issue and Balance modelling mistake are documented accurately.

### 7. IMPORT_REPORT.md
* **Purpose**: Fulfills the specific assignment constraint regarding CSV imports.
* **Contents**: Explanation of why CSV import was excluded from MVP and the planned strategy.
* **Verification Steps**:
  - [ ] Verify it explicitly states "The current MVP does not implement CSV import functionality."

---
*If all checkboxes above are checked, the assignment is ready for submission.*
