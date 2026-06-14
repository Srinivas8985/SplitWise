import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { importCsv } from '../api/import';
import { getGroups } from '../api/groups';
import { useNavigate } from 'react-router-dom';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await getGroups();
      setGroups(res.data.data.groups);
      if (res.data.data.groups.length > 0) {
        setSelectedGroupId(res.data.data.groups[0].id);
      }
    } catch (error) {
      toast.error('Failed to load groups');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');

    setLoading(true);
    setReport(null);

    try {
      const res = await importCsv(file, selectedGroupId);
      setReport(res.data.data);
      toast.success('Import completed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Import Expenses</h1>
          <p className="user-greeting">Upload a CSV file to automatically import expenses.</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </header>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <form onSubmit={handleImport} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Target Group (Optional)</label>
            <select
              className="form-control"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="">-- Dry Run (No Group) --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label>CSV File</label>
            <input
              type="file"
              accept=".csv"
              className="form-control"
              onChange={handleFileChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !file}>
            {loading ? 'Importing...' : 'Run Import'}
          </button>
        </form>
      </div>

      {report && (
        <>
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 className="card-title">Import Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', textAlign: 'center' }}>
              <div style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{report.processed}</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>Processed</div>
              </div>
              <div style={{ padding: '20px', background: 'var(--color-success-light)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-success)' }}>{report.imported}</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>Imported</div>
              </div>
              <div style={{ padding: '20px', background: 'var(--color-warning-light)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-warning)' }}>{report.warnings}</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>Warnings</div>
              </div>
              <div style={{ padding: '20px', background: 'var(--color-danger-light)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-danger)' }}>{report.rejected}</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>Rejected</div>
              </div>
            </div>
          </div>

          {report.anomalies && report.anomalies.length > 0 && (
            <div className="card">
              <h2 className="card-title">Anomaly Report</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Row</th>
                    <th style={{ padding: '12px' }}>Severity</th>
                    <th style={{ padding: '12px' }}>Anomaly Detected</th>
                    <th style={{ padding: '12px' }}>Action Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {report.anomalies.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}>{a.row}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={a.severity === 'Critical' ? 'badge badge-danger' : 'badge badge-warning'}>
                          {a.severity}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{a.anomaly}</td>
                      <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>{a.actionTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
