/**
 * DashboardPage — placeholder for Phase 2 testing
 *
 * Shows current user info, logout button, and placeholder content.
 * Will be expanded in Phase 3 (groups) and Phase 5 (balances).
 */

import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import GroupList from '../components/groups/GroupList';
import BalanceSummary from '../components/balances/BalanceSummary';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/import')}>Import CSV</button>
          <button className="btn btn-primary" onClick={() => navigate('/groups/new')}>Create New Group</button>
          <span className="user-greeting">Hi, {user?.fullName}</span>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      <main className="page-content">
        <BalanceSummary />
        <GroupList />
      </main>
    </div>
  );
}
