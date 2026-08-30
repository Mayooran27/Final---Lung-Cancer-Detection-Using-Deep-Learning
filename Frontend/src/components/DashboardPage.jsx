/**
 * DashboardPage.jsx
 * -----------------------------------------------------------------------
 * Overview page: live stat cards, the "Check a CT scan" panel, and the 5
 * most recent scans. Stats and the recent-scans table are both derived
 * from useScans(), which reads real history from the backend — so a
 * successful check immediately bumps the right counter and adds a row
 * with the actual server timestamp, instead of the old hardcoded sample
 * data that never changed.
 * -----------------------------------------------------------------------
 */
import React from 'react';
import Layout, { LABEL_META } from './Layout';
import CheckScanPanel from './CheckScanPanel';
import { computeStats, formatScanTime, useScans } from '../lib/scans';

export default function DashboardPage({ user }) {
  const { scans, refresh, deleteScan } = useScans();
  const stats = computeStats(scans);
  const recent = scans.slice(0, 5);

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
      active="dashboard"
      title={user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
      subtitle="Upload a CT slice to get a prediction, or review recent scans below."
      user={user}
    >
      <div className="lcds-stats">
        {stats.map((s) => (
          <div className="lcds-stat" key={s.label}>
            <div className="lcds-stat__dot" style={{ background: s.color }} />
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <CheckScanPanel onChecked={refresh} />

      <section className="lcds-panel">
        <h2>Recent scans</h2>
        <p className="lcds-hint">Latest predictions across all uploaded CT images.</p>
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
            {recent.map((s) => (
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
        {recent.length === 0 && <div className="lcds-table__empty">No scans yet — check one above to get started.</div>}
      </section>
    </Layout>
  );
}
