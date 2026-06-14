# Spreetrail Decision Log

This document records the major architectural and technical decisions made during the development of Spreetrail.

### 1. PostgreSQL vs MongoDB
* **Options Considered**: PostgreSQL (Relational), MongoDB (NoSQL)
* **Chosen Solution**: PostgreSQL
* **Reason**: Spreetrail handles financial data characterized by strict relationships (Users -> Groups -> Expenses -> Splits). Ensuring ACID compliance and enforcing referential integrity (e.g., cascading deletes so deleting a group cleans up all related expenses) is natively supported and safer in a relational database.

### 2. Prisma vs Raw SQL
* **Options Considered**: Prisma ORM, Sequelize, Raw SQL (pg)
* **Chosen Solution**: Prisma ORM
* **Reason**: Prisma provides excellent type safety, an intuitive schema definition language, and automated migrations. It significantly accelerated MVP development by removing the need to write boilerplate SQL, especially for complex nested creation queries (e.g., creating an Expense and its ExpenseSplits in a single transaction).

### 3. JWT Authentication
* **Options Considered**: JWT (JSON Web Tokens), Session/Cookies (Express-session)
* **Chosen Solution**: JWT
* **Reason**: JWTs are stateless, meaning the backend does not need to store session data in the database or Redis. This makes the backend easier to scale and deploy on serverless/ephemeral environments like Render.

### 4. React Context vs Redux
* **Options Considered**: React Context API, Redux Toolkit, Zustand
* **Chosen Solution**: React Context API
* **Reason**: For the MVP, global state is primarily limited to the authenticated user's session data. Redux introduces unnecessary boilerplate for this scale. React Context is built-in, lightweight, and perfectly suited for managing the `user` and `token` state.

### 5. Computed Balances vs Stored Balances
* **Options Considered**: 
  1. Storing net balances in a `Balance` table and updating them on every expense.
  2. Computing balances on the fly by aggregating `ExpenseSplit` and `Settlement` tables.
* **Chosen Solution**: Computed Balances
* **Reason**: Storing balances introduces a high risk of synchronization errors (e.g., if an expense update fails halfway). By computing balances on the fly, the source of truth remains strictly the immutable expense and settlement records. This guarantees 100% accuracy at the cost of slightly higher query processing time, which is negligible for MVP group sizes.

### 6. REST APIs
* **Options Considered**: REST, GraphQL, tRPC
* **Chosen Solution**: REST
* **Reason**: The data access patterns are straightforward and predictable (CRUD operations on distinct resources). REST is standard, easily testable via tools like Postman, and requires minimal setup compared to GraphQL.

### 7. LocalStorage vs Cookies
* **Options Considered**: Storing JWT in `localStorage`, Storing JWT in `httpOnly` Cookies
* **Chosen Solution**: `localStorage`
* **Reason**: While `httpOnly` cookies are more secure against XSS attacks, `localStorage` is vastly easier to configure for cross-origin requests (e.g., Frontend on Vercel, Backend on Render) without dealing with complex CORS credential settings and strict origin requirements during the rapid 2-day MVP phase.

### 8. Group-scoped Settlements
* **Options Considered**: Global settlements between friends, Group-scoped settlements
* **Chosen Solution**: Group-scoped settlements
* **Reason**: Tracking debts globally requires a complex "friendship" graph. Scoping settlements strictly to a single group simplifies the mental model for users and keeps the database queries isolated and performant.

### 9. Expense Comments instead of Realtime Chat
* **Options Considered**: WebSockets (Socket.io) for real-time chat, Simple REST comments
* **Chosen Solution**: Simple REST comments
* **Reason**: Implementing real-time WebSockets requires additional infrastructure (keeping connections alive, handling reconnects, scaling). Simple HTTP polling or refresh-based comments achieve the primary goal (discussing an expense) within the MVP timeline constraints.

### 10. Single Payer per Expense
* **Options Considered**: Allowing multiple people to pay portions of a single expense, Enforcing a single payer.
* **Chosen Solution**: Single payer per expense
* **Reason**: Multi-payer expenses exponentially increase the complexity of the UI and the underlying split logic. In the real world, users can simply record two separate expenses if two people split the bill at the register. Restricting it to a single payer streamlined development.

### 11. Handling Imported CSV Anomalies
* **Decision**: How to ingest and handle anomalies from the CSV export.
* **Chosen Solution**: Build a minimal API using `multer` and `csv-parser` to process the file, reject invalid rows, and generate a comprehensive JSON anomaly report.
* **Reason**: Fulfills the strict requirement of producing an import report upon ingestion without requiring a complete redesign of the core architecture to support queues or background jobs. It preserves strict mathematical data integrity within the database while explicitly documenting edge cases for the user.
