
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const LABEL_META = {
  Malignant: { color: '#ff5d6c', soft: 'rgba(255,93,108,0.12)' },
  Benign: { color: '#33d6a6', soft: 'rgba(51,214,166,0.12)' },
  Normal: { color: '#5aa9ff', soft: 'rgba(90,169,255,0.12)' },
};

export function ConfidenceRing({ value = 0, label = '', color = '#2f5eff' }) {
  const pct = Math.round(value * 100);
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="lcds-ring">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#eef0fa" strokeWidth="10" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="lcds-ring__value">
        <strong>{pct}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'grid': return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case 'upload': return <svg {...common}><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>;
    case 'history': return <svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4l3 2"/></svg>;
    case 'lungs': return <svg {...common}><path d="M9 3c-2.5 0-4 2.2-4 5.5V16c0 3 1.6 5.5 3.6 5.5.9 0 1.4-.7 1.4-1.8V5C10 3.8 9.7 3 9 3ZM17 3c2.5 0 4 2.2 4 5.5V16c0 3-1.6 5.5-3.6 5.5-.9 0-1.4-.7-1.4-1.8V5c0-1.2.3-2 1-2Z"/></svg>;
    default: return null;
  }
}

const NAV_ITEMS = [
  { key: 'dashboard', to: '/home', icon: 'grid', label: 'Dashboard' },
  { key: 'upload', to: '/upload', icon: 'upload', label: 'Upload scan' },
  { key: 'history', to: '/history', icon: 'history', label: 'Scan history' },
];

export default function Layout({ active, title, subtitle, user, children }) {
  const location = useLocation();
  const activeKey = active || NAV_ITEMS.find((n) => n.to === location.pathname)?.key;

  return (
    <div className="lcds-dash">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

        .lcds-dash {
          --bg: #060b1f;
          --sidebar: #0b1440;
          --card: #ffffff;
          --accent: #2f5eff;
          --accent-dark: #1b3acc;
          --accent-soft: rgba(47,94,255,0.14);
          --text-hi: #f5f7ff;
          --text-mu: #8c97c4;
          --ink: #0b1030;
          --ink-mu: #5b6280;
          --border: rgba(255,255,255,0.08);
          --danger: #ff5d6c;

          min-height: 100vh;
          display: flex;
          background: var(--bg);
          font-family: 'Inter', sans-serif;
          color: var(--ink);
        }

        /* Sidebar */
        .lcds-side {
          width: 236px;
          flex-shrink: 0;
          background: var(--sidebar);
          padding: 26px 18px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .lcds-side__mark {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px;
          color: var(--text-hi);
        }
        .lcds-side__mark svg { color: #7fa2ff; }
        .lcds-side__mark span {
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          font-size: 13.5px;
          line-height: 1.25;
        }
        .lcds-side__nav { display: flex; flex-direction: column; gap: 4px; }
        .lcds-side__item {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 12px;
          border-radius: 9px;
          color: var(--text-mu);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: none;
          text-align: left;
          width: 100%;
          text-decoration: none;
        }
        .lcds-side__item:hover { color: var(--text-hi); background: rgba(255,255,255,0.05); }
        .lcds-side__item.active { color: #fff; background: var(--accent); }
        .lcds-side__spacer { flex: 1; }

        /* Main */
        .lcds-main { flex: 1; min-width: 0; padding: 28px 36px 48px; }

        .lcds-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 26px;
        }
        .lcds-topbar h1 {
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          font-size: 20px;
          color: var(--text-hi);
          margin: 0 0 3px;
        }
        .lcds-topbar p { margin: 0; font-size: 13px; color: var(--text-mu); }
        .lcds-avatar {
          display: flex; align-items: center; gap: 10px;
          background: var(--sidebar);
          border: 1px solid var(--border);
          padding: 7px 14px 7px 7px;
          border-radius: 999px;
        }
        .lcds-avatar__circle {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Sora', sans-serif; font-weight: 600; font-size: 12.5px;
          color: #fff;
        }
        .lcds-avatar span { font-size: 13px; color: var(--text-hi); font-weight: 500; }

        /* Stat cards */
        .lcds-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }
        .lcds-stat {
          background: var(--card);
          border-radius: 14px;
          padding: 18px 20px;
        }
        .lcds-stat__dot { width: 8px; height: 8px; border-radius: 50%; margin-bottom: 12px; }
        .lcds-stat strong {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 26px;
          color: var(--ink);
        }
        .lcds-stat span { font-size: 12.5px; color: var(--ink-mu); }

        /* Panels */
        .lcds-panel {
          background: var(--card);
          border-radius: 16px;
          padding: 26px 28px;
          margin-bottom: 20px;
        }
        .lcds-panel h2 {
          margin: 0 0 4px;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: var(--ink);
        }
        .lcds-panel > p.lcds-hint { margin: 0 0 18px; font-size: 13px; color: var(--ink-mu); }
        .lcds-panel__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .lcds-upload {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 26px;
          align-items: start;
        }

        .lcds-dropzone {
          border: 1.5px dashed #d7dbec;
          border-radius: 12px;
          background: #fafbff;
          min-height: 210px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          text-align: center;
          padding: 20px;
          overflow: hidden;
        }
        .lcds-dropzone:hover { border-color: var(--accent); background: var(--accent-soft); }
        .lcds-dropzone img { max-height: 168px; border-radius: 8px; }
        .lcds-dropzone__label { font-size: 13.5px; font-weight: 500; color: var(--ink); }
        .lcds-dropzone__sub { font-size: 11.5px; color: var(--ink-mu); }

        .lcds-actions { display: flex; gap: 10px; margin-top: 14px; }
        .lcds-btn {
          padding: 10px 20px;
          border-radius: 9px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
        }
        .lcds-btn.primary { background: var(--accent); color: #fff; }
        .lcds-btn.primary:hover:not(:disabled) { background: var(--accent-dark); }
        .lcds-btn.primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .lcds-btn.ghost { background: #f1f3fb; color: var(--ink); }
        .lcds-btn.ghost:hover { background: #e6e9f7; }
        .lcds-btn.danger { background: rgba(255,93,108,0.12); color: var(--danger); }
        .lcds-btn.danger:hover:not(:disabled) { background: rgba(255,93,108,0.2); }
        .lcds-btn--sm { padding: 5px 12px; font-size: 12px; }

        .lcds-error {
          margin-top: 12px;
          font-size: 13px;
          color: var(--danger);
          background: rgba(255,93,108,0.08);
          border: 1px solid rgba(255,93,108,0.25);
          padding: 9px 12px;
          border-radius: 8px;
        }

        .lcds-result {
          border-left: 1px solid #edeff8;
          padding-left: 26px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          min-height: 210px;
          justify-content: center;
        }
        .lcds-result__empty { color: var(--ink-mu); font-size: 13px; text-align: center; }

        .lcds-result--models { justify-content: flex-start; padding-top: 4px; }

        .lcds-recommend {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding-bottom: 16px;
          margin-bottom: 14px;
          border-bottom: 1px solid #edeff8;
          width: 100%;
        }
        .lcds-recommend__note {
          margin: 2px 0 0;
          font-size: 11.5px;
          color: var(--ink-mu);
          text-align: center;
          max-width: 230px;
        }

        .lcds-model-list {
          list-style: none;
          margin: 0;
          padding: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lcds-model-row {
          background: #fafbff;
          border: 1px solid #edeff8;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .lcds-model-row__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .lcds-model-row__name { font-size: 13px; font-weight: 600; color: var(--ink); }
        .lcds-model-row__unavailable { font-size: 11.5px; color: var(--ink-mu); font-style: italic; }
        .lcds-model-row__accuracy {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: var(--ink-mu);
          font-family: 'IBM Plex Mono', monospace;
        }
        .lcds-model-row__note {
          display: block;
          margin-top: 3px;
          font-size: 11px;
          color: #b8860b;
        }

        .lcds-badge--sm { padding: 3px 10px; font-size: 11.5px; }

        .lcds-ring { position: relative; width: 112px; height: 112px; }
        .lcds-ring__value {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .lcds-ring__value strong { font-family: 'IBM Plex Mono', monospace; font-size: 19px; color: var(--ink); }
        .lcds-ring__value span { font-size: 10.5px; color: var(--ink-mu); }

        .lcds-badge {
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
        }

        .lcds-gradcam-note { font-size: 11.5px; color: var(--ink-mu); text-align: center; max-width: 220px; }

        /* Table */
        table.lcds-table { width: 100%; border-collapse: collapse; }
        .lcds-table th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #a2a8c2;
          font-weight: 600;
          padding: 0 12px 10px;
          border-bottom: 1px solid #eef0fa;
        }
        .lcds-table td {
          padding: 12px;
          font-size: 13.5px;
          color: var(--ink);
          border-bottom: 1px solid #f4f5fb;
        }
        .lcds-table tr:last-child td { border-bottom: none; }
        .lcds-table td.mono { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--ink-mu); }
        .lcds-table th.actions, .lcds-table td.actions { text-align: right; }
        .lcds-table__empty { padding: 24px 12px; text-align: center; color: var(--ink-mu); font-size: 13px; }

        @media (max-width: 980px) {
          .lcds-stats { grid-template-columns: repeat(2, 1fr); }
          .lcds-upload { grid-template-columns: 1fr; }
          .lcds-result { border-left: none; border-top: 1px solid #edeff8; padding-left: 0; padding-top: 20px; }
        }
        @media (max-width: 720px) {
          .lcds-side { display: none; }
          .lcds-main { padding: 22px; }
        }
      `}</style>

      <aside className="lcds-side">
        <div className="lcds-side__mark">
          <Icon name="lungs" />
          <span>Lung Cancer<br/>Detection System</span>
        </div>
        <nav className="lcds-side__nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={`lcds-side__item${activeKey === item.key ? ' active' : ''}`}
            >
              <Icon name={item.icon} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="lcds-side__spacer" />
      </aside>

      <main className="lcds-main">
        <div className="lcds-topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {user?.name && (
            <div className="lcds-avatar">
              <div className="lcds-avatar__circle">{user.name.slice(0, 1).toUpperCase()}</div>
              <span>{user.name}</span>
            </div>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}
