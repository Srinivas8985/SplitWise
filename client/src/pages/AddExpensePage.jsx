import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getGroup } from '../api/groups';
import { createExpense } from '../api/expenses';
import { useAuth } from '../context/AuthContext';

export default function AddExpensePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [paidById, setPaidById] = useState(user?.id || '');
  
  // Dynamic split data depending on splitType
  const [splitData, setSplitData] = useState({});

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await getGroup(groupId);
        setGroup(res.data.data.group);
        // Initialize splitData based on members
        const initialSplits = {};
        res.data.data.group.members.forEach(m => {
          initialSplits[m.userId] = { amount: '', percentage: '', shares: '1', included: true };
        });
        setSplitData(initialSplits);
      } catch (error) {
        toast.error('Failed to load group');
        navigate(`/groups/${groupId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId, navigate]);

  const handleSplitChange = (userId, field, value) => {
    setSplitData(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }));
  };

  const toggleInclude = (userId) => {
    setSplitData(prev => ({
      ...prev,
      [userId]: { ...prev[userId], included: !prev[userId].included }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || isNaN(amount) || Number(amount) <= 0) {
      return toast.error('Please enter a valid description and amount');
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      splitType,
      paidById,
      splits: []
    };

    if (splitType === 'EQUAL') {
      const includedUsers = Object.keys(splitData).filter(uid => splitData[uid].included);
      if (includedUsers.length === 0) return toast.error('At least one person must be included');
      payload.splits = includedUsers.map(userId => ({ userId }));
    } else {
      payload.splits = Object.keys(splitData)
        .filter(uid => splitData[uid].included)
        .map(userId => {
          const s = { userId };
          if (splitType === 'UNEQUAL') s.amount = Number(splitData[userId].amount) || 0;
          if (splitType === 'PERCENTAGE') s.percentage = Number(splitData[userId].percentage) || 0;
          if (splitType === 'SHARE') s.shares = Number(splitData[userId].shares) || 0;
          return s;
        });
    }

    setSubmitting(true);
    try {
      await createExpense(groupId, payload);
      toast.success('Expense added successfully');
      navigate(`/groups/${groupId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Add an Expense</h1>
        <button className="btn btn-outline" onClick={() => navigate(`/groups/${groupId}`)}>Cancel</button>
      </header>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Dinner, Taxi, etc." required disabled={submitting} />
          </div>
          
          <div className="form-group">
            <label>Total Amount ($)</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required disabled={submitting} />
          </div>

          <div className="form-group">
            <label>Paid By</label>
            <select value={paidById} onChange={e => setPaidById(e.target.value)} disabled={submitting}>
              {group.members.map(m => (
                <option key={m.userId} value={m.userId}>{m.user.fullName} {m.userId === user.id ? '(You)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Split Type</label>
            <select value={splitType} onChange={e => setSplitType(e.target.value)} disabled={submitting}>
              <option value="EQUAL">Equally</option>
              <option value="UNEQUAL">Unequally (exact amounts)</option>
              <option value="PERCENTAGE">By Percentages</option>
              <option value="SHARE">By Shares</option>
            </select>
          </div>

          <div className="split-details" style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Split Details</h3>
            {group.members.map(m => (
              <div key={m.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={splitData[m.userId]?.included} onChange={() => toggleInclude(m.userId)} disabled={submitting} />
                  {m.user.fullName}
                </label>
                
                {splitData[m.userId]?.included && splitType !== 'EQUAL' && (
                  <input
                    type="number"
                    step={splitType === 'SHARE' ? '1' : '0.01'}
                    min="0"
                    placeholder={splitType === 'UNEQUAL' ? '0.00' : splitType === 'PERCENTAGE' ? '%' : 'Shares'}
                    value={splitData[m.userId]?.[splitType.toLowerCase() === 'unequal' ? 'amount' : splitType.toLowerCase()] || ''}
                    onChange={e => handleSplitChange(m.userId, splitType === 'UNEQUAL' ? 'amount' : splitType.toLowerCase(), e.target.value)}
                    style={{ width: '100px', padding: '5px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    disabled={submitting}
                  />
                )}
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '20px' }} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
