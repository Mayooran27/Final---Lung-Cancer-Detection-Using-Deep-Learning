/**
 * SettingsPage.jsx
 * -----------------------------------------------------------------------
 * Reached from the sidebar's "Settings" item (previously an inert button).
 * Lets the clinician change the display name shown in the topbar/avatar
 * (persisted via App.js's updateUser, backed by localStorage('lcds_user')
 * same as before), shows API connectivity, and can clear scan history.
 * -----------------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import { API_BASE, useScans } from '../lib/scans';

export default function SettingsPage({ user, onLogout, onUpdateUser }) {
  const { scans, refresh, clearHistory } = useScans();
  const [name, setName] = useState(user?.name || 'Clinician');
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/health`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (!cancelled) setHealth(data); })
      .catch(() => { if (!cancelled) setHealth(null); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateUser({ name: name.trim() || 'Clinician' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all scan history? This cannot be undone.')) return;
    setClearing(true);
    setClearError('');
    try {
      await clearHistory();
    } catch (err) {
      setClearError(err.message || 'Could not clear scan history.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Layout
      active="settings"
      title="Settings"
      subtitle="Profile, connection status, and scan history controls."
      user={user}
      onLogout={onLogout}
    >
      <section className="lcds-panel">
        <h2>Profile</h2>
        <p className="lcds-hint">This name appears in the topbar and avatar.</p>
        <form onSubmit={handleSave}>
          <div className="lcds-field">
            <label htmlFor="clinician-name">Display name</label>
            <input
              id="clinician-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Clinician"
            />
          </div>
          <div className="lcds-actions" style={{ marginTop: 0, alignItems: 'center' }}>
            <button type="submit" className="lcds-btn primary">Save</button>
            {saved && <span className="lcds-saved-note">Saved</span>}
          </div>
        </form>
      </section>

      <section className="lcds-panel">
        <h2>Backend connection</h2>
        <p className="lcds-hint">Status of the prediction API this app talks to.</p>
        <div className="lcds-field">
          <label>API base URL</label>
          <div className="lcds-field__static">{API_BASE}</div>
        </div>
        <div className="lcds-field">
          <label>Status</label>
          <div className="lcds-field__static">
            <span
              className="lcds-status-dot"
              style={{ background: health ? (health.status === 'ok' ? '#33d6a6' : '#e9a63b') : '#ff5d6c' }}
            />
            {health
              ? `${health.status === 'ok' ? 'Connected' : 'Degraded'} — ${Object.values(health.models || {}).filter((m) => m.loaded).length}/${Object.keys(health.models || {}).length} models loaded`
              : 'Unreachable'}
          </div>
        </div>
      </section>

      <section className="lcds-panel">
        <h2>Scan history</h2>
        <p className="lcds-hint">{scans.length} scan{scans.length === 1 ? '' : 's'} currently stored on the server.</p>
        <div className="lcds-actions" style={{ marginTop: 0 }}>
          <button className="lcds-btn ghost" onClick={refresh}>Refresh count</button>
          <button className="lcds-btn danger" onClick={handleClear} disabled={clearing}>
            {clearing ? 'Clearing…' : 'Clear scan history'}
          </button>
        </div>
        {clearError && <div className="lcds-error" role="alert">{clearError}</div>}
      </section>
    </Layout>
  );
}
