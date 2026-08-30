
import React from 'react';
import Layout, { LABEL_META } from './Layout';
import { formatScanTime, useScans } from '../lib/scans';

export default function ScanHistoryPage({ user }) {
  const { scans, loading, offline, refresh, deleteScan } = useScans();

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete scan ${id}? This cannot be undone.`)) return;
    try {
      await deleteScan(id);
    } catch (err) {
      window.alert(err.message || 'Failed to delete scan.');
    }
  };

  return (
    <Layout
      active="history"
      title="Scan history"
      subtitle="Every CT scan checked through the system, newest first."
      user={user}
    >
      <section className="lcds-panel">
        <div className="lcds-panel__head">
          <div>
            <h2>All scans</h2>
            <p className="lcds-hint">
              {offline
                ? 'Showing sample data — the backend is unreachable right now.'
                : `${scans.length} scan${scans.length === 1 ? '' : 's'} recorded.`}
            </p>
          </div>
          <button className="lcds-btn ghost" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <table className="lcds-table">
          <thead>
            <tr>
              <th>Scan ID</th>
              <th>Time</th>
              <th>Date</th>
              <th>Result</th>
              <th>Confidence</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.id}</td>
                <td className="mono">{formatScanTime(s)}</td>
                <td>{s.date}</td>
                <td>
                  <span
                    className="lcds-badge"
                    style={{ color: LABEL_META[s.label]?.color, background: LABEL_META[s.label]?.soft }}
                  >
                    {s.label}
                  </span>
                </td>
                <td className="mono">{Math.round(s.confidence * 100)}%</td>
                <td className="actions">
                  <button className="lcds-btn danger lcds-btn--sm" onClick={() => handleDelete(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {scans.length === 0 && !loading && (
          <div className="lcds-table__empty">No scans yet — upload one from the Dashboard or Upload scan page.</div>
        )}
      </section>
    </Layout>
  );
}
