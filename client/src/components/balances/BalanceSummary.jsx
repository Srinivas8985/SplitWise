/**
 * BalanceSummary — shows the user's overall balance across all groups
 * on the Dashboard page. Color-coded: green = you're owed, red = you owe.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardBalances } from '../../api/balances';

export default function BalanceSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await getDashboardBalances();
        setData(res.data.data);
      } catch {
        // Silently fail — dashboard still usable without balances
      } finally {
        setLoading(false);
      }
    };
    fetchBalances();
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '20px auto' }}></div>;
  if (!data) return null;

  const { totalOwed, totalOwing, netBalance } = data;
  const hasBalances = totalOwed > 0 || totalOwing > 0;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <div className="card-header">
        <h2 className="card-title">Your Balances</h2>
      </div>

      {!hasBalances ? (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-4)' }}>
          You're all settled up! 🎉
        </p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                You are owed
              </div>
              <div className="amount-positive" style={{ fontSize: 'var(--font-size-xl)' }}>
                ₹{totalOwed.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                You owe
              </div>
              <div className="amount-negative" style={{ fontSize: 'var(--font-size-xl)' }}>
                ₹{totalOwing.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Net
              </div>
              <div className={netBalance > 0 ? 'amount-positive' : netBalance < 0 ? 'amount-negative' : 'amount-zero'}
                   style={{ fontSize: 'var(--font-size-xl)' }}>
                {netBalance >= 0 ? '+' : ''}₹{netBalance.toFixed(2)}
              </div>
            </div>
          </div>

          {data.byGroup.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              {data.byGroup.map(g => (
                <Link key={g.groupId} to={`/groups/${g.groupId}`}
                      style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                               borderBottom: '1px solid var(--color-border-light)', textDecoration: 'none' }}>
                  <span style={{ color: 'var(--color-text)' }}>{g.groupName}</span>
                  <span className={g.netBalance > 0 ? 'amount-positive' : g.netBalance < 0 ? 'amount-negative' : 'amount-zero'}>
                    {g.netBalance >= 0 ? '+' : ''}₹{g.netBalance.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
