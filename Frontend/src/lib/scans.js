/**
 * lib/scans.js
 * -----------------------------------------------------------------------
 * Scan history now lives on the backend (Backend/app.py persists every
 * prediction to scans_history.json and serves it back via GET /api/scans),
 * instead of the hardcoded SAMPLE_SCANS array the dashboard used to render
 * forever. useScans() fetches that list once on mount and exposes refresh()
 * so any page can pull the latest counts/rows right after a new prediction
 * — that's what makes the stat cards and "Recent scans" table update
 * instead of being stuck at the same 5 sample rows.
 *
 * If the backend is unreachable, we fall back to the old sample rows so the
 * UI still has something to show instead of an empty/broken screen.
 * -----------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';

export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export const SAMPLE_SCANS = [
  { id: 'CT-10482', date: '2026-08-21', timestamp: '2026-08-21T14:32:00Z', label: 'Malignant', confidence: 0.94 },
  { id: 'CT-10481', date: '2026-08-21', timestamp: '2026-08-21T09:05:00Z', label: 'Benign', confidence: 0.88 },
  { id: 'CT-10479', date: '2026-08-20', timestamp: '2026-08-20T16:47:00Z', label: 'Normal', confidence: 0.97 },
  { id: 'CT-10475', date: '2026-08-19', timestamp: '2026-08-19T11:20:00Z', label: 'Benign', confidence: 0.81 },
  { id: 'CT-10468', date: '2026-08-18', timestamp: '2026-08-18T08:58:00Z', label: 'Malignant', confidence: 0.90 },
];

// Scan records store a UTC ISO timestamp; render it in the viewer's local
// time so "Time" actually matches the clock on the wall, not the server's.
export function formatScanTime(scan) {
  const raw = scan.timestamp || scan.date;
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Backend confidence comes back as 0-100; normalize to the 0-1 scale the UI
// (ConfidenceRing, table percentages) has always used.
function normalizeScan(s) {
  return {
    ...s,
    confidence: s.confidence > 1 ? s.confidence / 100 : s.confidence,
  };
}

export function computeStats(scans) {
  const total = scans.length;
  const count = (lbl) => scans.filter((s) => s.label === lbl).length;
  return [
    { label: 'Total scans', value: total, color: '#2f5eff' },
    { label: 'Malignant', value: count('Malignant'), color: '#ff5d6c' },
    { label: 'Benign', value: count('Benign'), color: '#33d6a6' },
    { label: 'Normal', value: count('Normal'), color: '#5aa9ff' },
  ];
}

export function useScans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/scans`);
      if (!res.ok) throw new Error('failed to load scans');
      const data = await res.json();
      setScans((data.scans || []).map(normalizeScan));
      setOffline(false);
    } catch {
      setScans(SAMPLE_SCANS.map(normalizeScan));
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearHistory = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/scans`, { method: 'DELETE' });
    if (!res.ok) throw new Error('failed to clear scan history');
    await refresh();
  }, [refresh]);

  const deleteScan = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/api/scans/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete scan.');
    }
    await refresh();
  }, [refresh]);

  return { scans, loading, offline, refresh, clearHistory, deleteScan };
}
