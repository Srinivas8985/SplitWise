/**
 * SettleUp — form to record a payment between the current user and another member.
 *
 * Shows a dropdown of group members (excluding self), an amount input,
 * and pre-fills the amount with what the user owes that person (if available).
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { createSettlement } from '../../api/settlements';

export default function SettleUp({ groupId, members, debts, onSettled }) {
  const { user } = useAuth();
  const [paidToId, setPaidToId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter members: only show people the current user owes money to
  const otherMembers = members.filter(m => m.userId !== user.id);

  // When a recipient is selected, pre-fill the amount with what user owes them
  const handleRecipientChange = (id) => {
    setPaidToId(id);
    if (debts && id) {
      const debt = debts.find(d => d.from.id === user.id && d.to.id === id);
      if (debt) {
        setAmount(debt.amount.toFixed(2));
      } else {
        setAmount('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paidToId) return toast.error('Please select who you are paying');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return toast.error('Please enter a valid amount');

    setSubmitting(true);
    try {
      await createSettlement(groupId, {
        paidToId,
        amount: Number(amount)
      });
      toast.success('Settlement recorded!');
      setPaidToId('');
      setAmount('');
      if (onSettled) onSettled(); // trigger refresh in parent
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record settlement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Settle Up</h2>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group">
          <label htmlFor="settle-recipient">Pay</label>
          <select
            id="settle-recipient"
            value={paidToId}
            onChange={(e) => handleRecipientChange(e.target.value)}
            disabled={submitting}
          >
            <option value="">Select a person...</option>
            {otherMembers.map(m => (
              <option key={m.userId} value={m.userId}>{m.user.fullName}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="settle-amount">Amount (₹)</label>
          <input
            id="settle-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
          {submitting ? 'Recording...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}
