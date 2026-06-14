/**
 * SettlementHistory — displays a chronological list of settlements in a group.
 */

import { useState, useEffect } from 'react';
import { getGroupSettlements } from '../../api/settlements';
import { useAuth } from '../../context/AuthContext';

export default function SettlementHistory({ groupId, refreshKey }) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getGroupSettlements(groupId);
        setSettlements(res.data.data.settlements);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [groupId, refreshKey]);

  if (loading) return <div className="spinner" style={{ margin: '10px auto' }}></div>;

  if (settlements.length === 0) {
    return (
      <div className="card">
        <div className="card-header"><h2 className="card-title">Settlement History</h2></div>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-3)' }}>
          No settlements recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header"><h2 className="card-title">Settlement History</h2></div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {settlements.map(s => (
          <li key={s.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)'
          }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                {s.paidBy.id === user.id ? 'You' : s.paidBy.fullName}
                {' paid '}
                {s.paidTo.id === user.id ? 'You' : s.paidTo.fullName}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {new Date(s.createdAt).toLocaleDateString()} at {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="amount-positive" style={{ fontSize: 'var(--font-size-base)' }}>
              ₹{Number(s.amount).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
