import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getGroup, addMember, removeMember, leaveGroup, deleteGroup } from '../api/groups';
import GroupBalances from '../components/balances/GroupBalances';
import SettleUp from '../components/settlements/SettleUp';
import SettlementHistory from '../components/settlements/SettlementHistory';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [debts, setDebts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSettled = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const res = await getGroup(groupId);
      setGroup(res.data.data.group);
    } catch (error) {
      toast.error('Failed to load group');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setAddingMember(true);
    try {
      await addMember(groupId, newMemberEmail.trim());
      toast.success('Member added');
      setNewMemberEmail('');
      fetchGroup(); // refresh
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember(groupId, memberId);
      toast.success('Member removed');
      fetchGroup();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await leaveGroup(groupId);
      toast.success('Left group');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to completely delete this group? This cannot be undone.')) return;
    try {
      await deleteGroup(groupId);
      toast.success('Group deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!group) return null;

  const isCreator = group.createdById === user.id;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{group.name}</h1>
          {group.description && <p className="user-greeting">{group.description}</p>}
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Back</button>
          {!isCreator && <button className="btn btn-danger" onClick={handleLeaveGroup}>Leave Group</button>}
          {isCreator && <button className="btn btn-danger" onClick={handleDeleteGroup}>Delete Group</button>}
        </div>
      </header>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        <div className="main-panel">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Expenses</h2>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/groups/${groupId}/expenses/new`)}>Add Expense</button>
            </div>
            {group.expenses && group.expenses.length > 0 ? (
              <div className="list-group">
                {group.expenses.map(exp => (
                  <div key={exp.id} 
                       onClick={() => navigate(`/expenses/${exp.id}`)}
                       style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{exp.description}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        Paid by {exp.paidBy?.fullName} on {new Date(exp.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: 'var(--font-size-lg)' }}>
                      ${Number(exp.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No expenses yet. Add one to get started!</p>
              </div>
            )}
          </div>
          
          {/* Settlement History */}
          <SettlementHistory groupId={groupId} refreshKey={refreshKey} />
        </div>

        <div className="side-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <GroupBalances 
            groupId={groupId} 
            refreshKey={refreshKey} 
            onBalancesFetched={(d) => setDebts(d)} 
          />

          <SettleUp 
            groupId={groupId} 
            members={group.members} 
            debts={debts} 
            onSettled={handleSettled} 
          />

          <div className="card">
            <div className="card-header"><h2 className="card-title">Members ({group.members.length})</h2></div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.members.map(m => (
                <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{m.user.fullName} {m.userId === user.id ? '(You)' : ''}</span>
                  {isCreator && m.userId !== user.id && (
                    <button onClick={() => handleRemoveMember(m.userId)} className="btn btn-sm btn-outline" style={{ color: 'var(--color-danger)' }}>Remove</button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isCreator && (
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: '10px' }}>Add Member</h3>
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  placeholder="User email"
                  style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  disabled={addingMember}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={addingMember}>Add</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
