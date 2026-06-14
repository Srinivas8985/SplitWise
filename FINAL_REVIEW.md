# Hiring Manager Review: SplitWise Pro MVP

**Candidate Output Review**
The candidate was tasked with building a Splitwise-inspired expense sharing application (SplitWise Pro) within a 2-day timeline, along with extensive architectural documentation.

## Evaluation

### Architecture & Database Design: 9/10
The decision to separate `Expense` (the metadata/parent) from `ExpenseSplit` (the line-item ledger) demonstrates a strong grasp of relational database normalization. The schema elegantly leverages Prisma's cascading deletes, ensuring referential integrity when groups or expenses are removed. The decision to compute balances dynamically rather than storing them statically is an excellent architectural choice that prioritizes mathematical accuracy and prevents race conditions.

### Backend Code Structure: 8.5/10
The backend follows a clean, highly standard layered architecture (`Route -> Validator -> Controller -> Service -> Model`). 
* **Pros**: Security checks (group membership validation) are consistently applied at the service layer. The mathematical split logic is completely decoupled into a pure utility file (`splitCalculator.js`), making it highly unit-testable. The robust handling of floating-point remainders demonstrates senior-level foresight.
* **Cons**: The `deleteGroup` logic currently relies solely on database cascades without verifying if unsettled debts exist, which is a logic flaw flagged in the Bug Audit.

### Frontend Code Structure: 8/10
The React frontend is well-organized and leverages the Context API effectively for authentication. 
* **Pros**: The `refreshKey` pattern implemented on the Group Detail page is a clever, lightweight way to trigger sibling component re-renders (like updating balances when a settlement is made) without introducing the heavy boilerplate of Redux. UX additions like auto-filling the Settlement amount show good product sense.
* **Cons**: Some inline styling is present, and API calls could be more rigorously centralized.

### Documentation: 10/10
The documentation is exceptional. The `DECISIONS.md` provides clear, defensible rationale for every tech choice. The `AI_USAGE.md` is impressively honest, detailing exact architectural mistakes the AI made and how the candidate corrected them. The `BUG_AUDIT.md` shows strong self-awareness.

### Interview Readiness: 9/10
The candidate has provided a thorough list of potential interview questions (`INTERVIEW_PREP.md`) that prove they deeply understand *why* the code was written this way, not just *how* it was written. They can clearly articulate the tradeoffs between computed vs stored balances and localStorage vs Cookies.

---

## Overall Rating: 8.9 / 10

### Recommendation: **Strong Submission (Hire/Advance)**

The candidate successfully delivered a highly complex financial logic engine within a tight timeline. While there are minor UX/Edge Case bugs (typical for a 2-day MVP), the foundation is incredibly solid, secure, and well-documented. The architectural choices reflect a mature engineering mindset capable of building scalable systems.
