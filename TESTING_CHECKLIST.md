# Manual Testing Checklist

## Authentication
- [ ] **Register**: Create a new account. Verify successful redirect to the dashboard and correct JWT storage in `localStorage`.
- [ ] **Login**: Log out and log back in with the new credentials. Verify incorrect passwords trigger a validation error toast.
- [ ] **Logout**: Click logout. Verify `localStorage` is cleared and the user is redirected to `/login`.
- [ ] **Protected Routes**: Unauthenticated users trying to access `/dashboard` or `/groups/new` should be immediately redirected to `/login`.

## Groups
- [ ] **Create Group**: Create a new group called "Testing Group". Verify the creator is automatically added as a member.
- [ ] **Add Member**: Add another registered user by their email address. Verify they appear in the member list.
- [ ] **Remove Member**: As the creator, click "Remove" next to a member's name. Verify they disappear from the list.
- [ ] **Leave Group**: As a non-creator, click "Leave Group". Verify successful removal and redirect to dashboard.
- [ ] **Delete Group**: As the creator, click "Delete Group". Verify the group disappears from the dashboard and all associated expenses/members are cascaded-deleted.

## Expenses
- [ ] **Equal Split**: Add a $100 expense split equally between 3 people. Verify backend rounding logic assigns $33.34, $33.33, and $33.33.
- [ ] **Unequal Split**: Add an expense where specific amounts are typed manually. Try to submit amounts that *do not* equal the total; verify validation blocks it.
- [ ] **Percentage Split**: Add a $200 expense split 30% and 70%. Verify calculation is exactly $60 and $140.
- [ ] **Share Split**: Add a $150 expense where User A has 2 shares and User B has 1 share. Verify calculation is $100 and $50.

## Balances
- [ ] **Verify Calculations**: After adding the expenses above, look at the Group Sidebar. Verify the math checks out (e.g., if you paid $100 for an equal split with one other person, the sidebar should say they owe you $50).
- [ ] **Verify Netting**: If User A owes User B $50, and User B owes User A $20, the balance engine should output a single netted debt: User A owes User B $30.

## Settlements
- [ ] **Partial Settlement**: Use the "Settle Up" form. If you owe someone $50, pay them $20. Verify the remaining balance updates instantly to $30.
- [ ] **Full Settlement**: Pay the remaining $30. Verify the balance disappears from the active debts list, and the "All settled up! 🎉" message appears.

## Comments
- [ ] **Create Comment**: Click into an expense and type a comment. Verify it appears instantly with your name.
- [ ] **Multi-user Comments**: Log in as a different user in the same group. Verify you can see the first user's comment and reply to it. Ensure newest comments appear at the top.

## Deployment
- [ ] **Backend Health Endpoint**: Navigate to `https://your-backend-url.com/api/v1/health` in a browser. Verify it returns `{"success": true, "message": "SplitWise Pro API is running"}`.
- [ ] **Frontend API Connectivity**: Open the deployed Vercel URL. Open the browser console (F12). Attempt to log in and verify network requests hit the Render backend without CORS errors.
