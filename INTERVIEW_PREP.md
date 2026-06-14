# Interview Preparation Notes

## Architecture Questions
1. **Q:** Why did you choose a monolithic Express/React architecture instead of microservices?
   **A:** For an MVP, a monolith reduces infrastructure overhead, deployment complexity, and latency. Microservices are overkill for the current bounded context and team size.
2. **Q:** How do you handle routing on the frontend?
   **A:** React Router DOM is used to manage Single Page Application (SPA) navigation, using a wrapper component to protect routes that require authentication.
3. **Q:** What is the flow of a request in your backend?
   **A:** Route -> Auth Middleware -> Validation Middleware (Zod) -> Controller -> Service (Business Logic) -> Prisma (Database) -> Response utility.
4. **Q:** Why use Axios over the native Fetch API?
   **A:** Axios provides automatic JSON transformation, easier error handling (rejects on 4xx/5xx), and simple interceptor configuration for attaching JWT Bearer tokens to all requests.

## Database Questions
5. **Q:** Why PostgreSQL instead of MongoDB?
   **A:** Financial data is highly relational. PostgreSQL enforces strict schemas, referential integrity via foreign keys, and provides ACID compliance out-of-the-box, preventing orphaned expenses or splits.
6. **Q:** How does cascading delete work in your schema?
   **A:** The `GroupMember` and `Expense` tables have `onDelete: Cascade` relations to `Group`. Deleting a group automatically wipes all child records at the database level without requiring multiple application-level queries.
7. **Q:** Why separate `Expense` and `ExpenseSplit` into two tables?
   **A:** Separation normalizes the data. `Expense` holds the metadata (who paid, date, total), while `ExpenseSplit` acts as a line-item ledger mapping individuals to their exact share, allowing unlimited participants per expense.
8. **Q:** What is the purpose of the `@@unique([groupId, userId])` compound key?
   **A:** It ensures a user cannot be added to the same group more than once at the database level.

## Prisma Questions
9. **Q:** Why Prisma over Raw SQL?
   **A:** Prisma provides type safety, autocompletion in IDEs, and an intuitive schema definition language. It speeds up MVP development significantly compared to writing raw SQL.
10. **Q:** How did you handle nested insertions with Prisma?
    **A:** Prisma allows nested writes using the `create` operator inside relation fields. For example, creating an `Expense` and its associated `ExpenseSplit` rows happens in a single transactional query.
11. **Q:** Why did you downgrade Prisma to version 5.21.1?
    **A:** Prisma v6 introduced breaking changes to how the `PrismaClient` constructor parses dynamic database connection strings (like from a cloud deployment environment). v5 natively supported the `env("DATABASE_URL")` configuration required for this rapid deployment.

## React Questions
12. **Q:** How is global state managed in this app?
    **A:** Through the React Context API. Since the only truly global state required is the authenticated user session, Redux would add unnecessary boilerplate.
13. **Q:** What is the purpose of the `useEffect` hook in your components?
    **A:** To trigger side-effects like fetching data from the API (e.g., getting group details or balances) when the component mounts or when its dependency array (like `groupId`) changes.
14. **Q:** How does the `refreshKey` pattern work in your GroupDetailPage?
    **A:** It's an integer stored in state that is passed down to child components. When an action occurs (like adding a settlement), `setRefreshKey(prev => prev + 1)` is called, which triggers the `useEffect` dependencies in the child components to re-fetch their data without reloading the whole page.
15. **Q:** Why use `react-hot-toast`?
    **A:** It provides immediate, non-blocking visual feedback to the user for both successful actions and API errors, improving UX.

## JWT Questions
16. **Q:** What is a JWT and how is it used here?
    **A:** A JSON Web Token is a stateless, cryptographically signed token. We issue it on login, store it in `localStorage`, and send it in the `Authorization` header to authenticate API requests.
17. **Q:** Why store the JWT in localStorage instead of a cookie?
    **A:** `localStorage` is much easier to configure for cross-origin requests (e.g., Vercel frontend talking to Render backend) during an MVP phase, bypassing complex CORS credential requirements.
18. **Q:** What are the security risks of localStorage?
    **A:** It is vulnerable to Cross-Site Scripting (XSS). An attacker injecting malicious JS can steal the token. In a mature production app, `httpOnly` cookies are preferred.
19. **Q:** How does the backend verify the token?
    **A:** The `auth.middleware.js` extracts the Bearer token, verifies its signature using the secret key via the `jsonwebtoken` library, and attaches the decoded user ID to the `req` object.

## Balance Calculation Questions
20. **Q:** Why calculate balances dynamically instead of storing a "Balance" column?
    **A:** Storing static balances risks desynchronization if a transaction fails halfway. Computing them on-the-fly guarantees mathematical accuracy by using the immutable `Expense` and `Settlement` ledgers as the single source of truth.
21. **Q:** How does the debt netting algorithm work?
    **A:** It iterates through all expenses, accumulating debts (non-payers owing payers). It subtracts settlements. Finally, it compares opposing debts (A owes B 100, B owes A 40) and collapses them into a single directional net debt (A owes B 60).
22. **Q:** How do you determine who owes whom from an `ExpenseSplit`?
    **A:** The `ExpenseSplit` table stores the positive *share* the participant is responsible for. The algorithm looks at the `paidById` on the parent `Expense`; the participant owes that payer their specific share amount.
23. **Q:** Is the balance calculation performant?
    **A:** Yes, for typical group sizes (< 100 expenses), a modern Node server computes these arrays in milliseconds. If scaling, balances could be cached in Redis or aggregated nightly.

## Settlement Questions
24. **Q:** Why restrict settlements strictly within a single group?
    **A:** Allowing global settlements across multiple groups complicates the balance aggregation algorithm and requires a complex "friendship" model. Group-scoping isolates the data and keeps the UX intuitive.
25. **Q:** What happens if I over-settle (pay someone $100 when I only owe $50)?
    **A:** Mathematically, the balance engine handles it flawlessly: it subtracts $100 from your $50 debt, resulting in a net of -$50. The engine then flips the polarity, stating the other person now owes *you* $50.
26. **Q:** How is a settlement recorded in the database?
    **A:** As a single row containing the `groupId`, the debtor (`paidById`), the creditor (`paidToId`), and the amount. It acts exactly like a cash transfer.

## Split Logic Questions
27. **Q:** How do you prevent losing pennies in an equal split (e.g., $100 / 3)?
    **A:** Instead of assigning $33.33 to everyone (which sums to $99.99), the calculator rounds to 2 decimals, keeps a running tally of distributed funds, and assigns the exact remaining difference (`Total - Distributed`) to the very last participant in the array (who gets $33.34).
28. **Q:** How do percentage splits work?
    **A:** The algorithm verifies the percentages sum exactly to 100. Then it multiplies the total expense amount by each user's percentage and applies the same rounding/remainder logic as equal splits to ensure exact precision.
29. **Q:** How do share splits work?
    **A:** It calculates a `perShareAmount` by dividing the total cost by the total sum of all shares. Each user's cost is `perShareAmount * user.shares`, followed by the standard remainder distribution to the last user.
30. **Q:** Why isolate the split calculators into a utility file?
    **A:** It separates raw mathematical business logic from Prisma database logic and Express request handling, making the algorithms highly unit-testable and reusable.
