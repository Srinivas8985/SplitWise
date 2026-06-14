import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // direct api access for simplicity, or we could add to expenses.js
import ExpenseComments from '../components/expenses/ExpenseComments';

export default function ExpenseDetailPage() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await api.get(`/expenses/${expenseId}`);
        setExpense(res.data.data.expense);
      } catch (error) {
        toast.error('Failed to load expense details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [expenseId, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense? This will affect balances.')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted');
      navigate(`/groups/${expense.groupId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!expense) return null;

  const isCreator = expense.createdById === user.id;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{expense.description}</h1>
          <p className="user-greeting">
            Paid by {expense.paidBy.fullName} on {new Date(expense.date).toLocaleDateString()}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => navigate(`/groups/${expense.groupId}`)}>Back to Group</button>
          {isCreator && <button className="btn btn-danger" onClick={handleDelete}>Delete</button>}
        </div>
      </header>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        <div className="main-panel">
          <div className="card">
            <div className="card-header"><h2 className="card-title">Expense Details</h2></div>
            <div style={{ padding: 'var(--space-4) 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Amount</span>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>₹{Number(expense.amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Split Type</span>
                <span>{expense.splitType}</span>
              </div>
              {expense.notes && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '5px' }}>Notes</h3>
                  <p>{expense.notes}</p>
                </div>
              )}
            </div>
            
            <h3 style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>Splits</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {expense.splits.map(split => (
                <li key={split.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                  <span>{split.user.fullName} {split.userId === user.id ? '(You)' : ''}</span>
                  <span style={{ fontWeight: '500' }}>₹{Number(split.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <ExpenseComments expenseId={expenseId} />
        </div>

        <div className="side-panel">
          {/* We could add more details here later if needed */}
        </div>
      </div>
    </div>
  );
}
