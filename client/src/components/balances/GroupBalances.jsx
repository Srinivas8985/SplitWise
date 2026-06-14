/**
 * GroupBalances — shows pairwise debts within a group.
 * Displayed on the GroupDetailPage sidebar.
 */

import { useState, useEffect } from 'react';
import { getGroupBalances } from '../../api/balances';
import { useAuth } from '../../context/AuthContext';

export default function GroupBalances({ groupId, refreshKey, onBalancesFetched }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await getGroupBalances(groupId);
        setData(res.data.data);
        if (onBalancesFetched) {
          onBalancesFetched(res.data.data.debts);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchBalances();
  }, [groupId, refreshKey]);

  if (loading) return <div className="spinner" style={{ margin: '10px auto' }}></div>;
  if (!data) return null;

  const { debts, userSummary } = data;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Balances</h2>
      </div>

      {/* User's personal summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0',
                    borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Your net</span>
        <span className={userSummary.netBalance > 0 ? 'amount-positive' : userSummary.netBalance < 0 ? 'amount-negative' : 'amount-zero'}
              style={{ fontSize: 'var(--font-size-lg)' }}>
          {userSummary.netBalance >= 0 ? '+' : ''}₹{userSummary.netBalance.toFixed(2)}
        </span>
      </div>

      {/* Pairwise debts */}
      {debts.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-3)' }}>
          All settled up! 🎉
        </p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {debts.map((debt, i) => {
            const isYouOwe = debt.from.id === user.id;
            const isOwedToYou = debt.to.id === user.id;

            return (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px', borderRadius: 'var(--radius-sm)',
                                    background: isYouOwe ? 'var(--color-danger-light)' : isOwedToYou ? 'var(--color-success-light)' : 'var(--color-bg)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>
                  <strong>{debt.from.id === user.id ? 'You' : debt.from.fullName}</strong>
                  {' → '}
                  <strong>{debt.to.id === user.id ? 'You' : debt.to.fullName}</strong>
                </span>
                <span className={isOwedToYou ? 'amount-positive' : isYouOwe ? 'amount-negative' : ''}
                      style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>
                  ₹{debt.amount.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
