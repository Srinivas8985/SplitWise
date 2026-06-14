import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getExpenseComments, addComment } from '../../api/comments';
import { useAuth } from '../../context/AuthContext';

export default function ExpenseComments({ expenseId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [expenseId]);

  const fetchComments = async () => {
    try {
      const res = await getExpenseComments(expenseId);
      setComments(res.data.data.comments);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSubmitting(true);
    try {
      const res = await addComment(expenseId, newMessage.trim());
      setComments([res.data.data.comment, ...comments]);
      setNewMessage('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '10px auto' }}></div>;

  return (
    <div className="card" style={{ marginTop: 'var(--space-6)' }}>
      <div className="card-header"><h2 className="card-title">Comments</h2></div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-4)' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Add a comment..."
          style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting || !newMessage.trim()}>
          Post
        </button>
      </form>

      {comments.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-3)' }}>
          No comments yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {comments.map(c => (
            <li key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>
                  {c.user.id === user.id ? 'You' : c.user.fullName}
                </strong>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ 
                background: c.user.id === user.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
                padding: '10px', 
                borderRadius: 'var(--radius-md)',
                color: c.user.id === user.id ? 'var(--color-primary-dark)' : 'var(--color-text)',
                border: c.user.id === user.id ? 'none' : '1px solid var(--color-border)'
              }}>
                {c.content}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
