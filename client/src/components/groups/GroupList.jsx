import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGroups } from '../../api/groups';
import toast from 'react-hot-toast';

export default function GroupList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await getGroups();
        setGroups(response.data.data.groups);
      } catch (error) {
        toast.error('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  if (loading) return <div className="spinner"></div>;

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <p>You are not part of any groups yet.</p>
        <Link to="/groups/new" className="btn btn-primary">Create a Group</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Your Groups</h2>
        <Link to="/groups/new" className="btn btn-primary btn-sm">New Group</Link>
      </div>
      <div className="list-group">
        {groups.map((group) => (
          <Link key={group.id} to={`/groups/${group.id}`} className="list-item" style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: '500', color: 'var(--color-text)' }}>{group.name}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {group._count.members} member{group._count.members !== 1 ? 's' : ''}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
