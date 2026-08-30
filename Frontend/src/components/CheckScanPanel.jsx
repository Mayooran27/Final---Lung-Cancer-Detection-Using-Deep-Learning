/**
 * CheckScanPanel.jsx
 * -----------------------------------------------------------------------
 * The "upload + run through all three models" flow, extracted out of
 * dashboard.jsx so both the Dashboard overview and the dedicated
 * "Upload scan" page can use it. On a successful prediction it calls
 * onChecked() so the caller can refresh scan history/stats from the
 * backend — the new scan was just persisted server-side by /api/predict.
 * -----------------------------------------------------------------------
 */
import React, { useRef, useState } from 'react';
import { API_BASE } from '../lib/scans';
import { ConfidenceRing, Icon, LABEL_META } from './Layout';

export default function CheckScanPanel({ onChecked }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setPreview(URL.createObjectURL(f));
  };

  const handleCheck = async () => {
    if (!file) { setError('Upload a CT image first.'); return; }
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const token = localStorage.getItem('lcds_token');
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Prediction failed.');
      }
      setResult(data);
      if (onChecked) onChecked(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lcds-panel">
      <h2>Check a CT scan</h2>
      <p className="lcds-hint">Upload a chest CT image (jpg, png, jpeg) to run it through all three trained models (VGG16, InceptionV3, CNN).</p>

      <div className="lcds-upload">
        <div>
          <div className="lcds-dropzone" onClick={() => inputRef.current?.click()}>
            {preview ? (
              <img src={preview} alt="CT preview" />
            ) : (
              <>
                <Icon name="upload" />
                <span className="lcds-dropzone__label">Click to upload image</span>
                <span className="lcds-dropzone__sub">jpg · png · jpeg</span>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="lcds-actions">
            <button className="lcds-btn primary" onClick={handleCheck} disabled={loading}>
              {loading ? 'Checking…' : 'Check'}
            </button>
            {file && (
              <button className="lcds-btn ghost" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                Clear
              </button>
            )}
          </div>
          {error && <div className="lcds-error" role="alert">{error}</div>}
        </div>

        <div className="lcds-result lcds-result--models">
          {result ? (
            <>
              {result.best && (
                <div className="lcds-recommend">
                  <ConfidenceRing
                    value={(result.best.confidence ?? 0) / 100}
                    label={result.best.model}
                    color={LABEL_META[result.best.label]?.color || '#2f5eff'}
                  />
                  <span
                    className="lcds-badge"
                    style={{
                      color: LABEL_META[result.best.label]?.color || '#2f5eff',
                      background: LABEL_META[result.best.label]?.soft || '#eef1ff',
                    }}
                  >
                    {result.best.label}
                  </span>
                  <p className="lcds-recommend__note">
                    Recommended result — {result.best.model} has the highest
                    verified validation accuracy ({result.best.known_val_accuracy}%)
                    of the models available.
                  </p>
                </div>
              )}

              <ul className="lcds-model-list">
                {result.results.map((r) => (
                  <li className="lcds-model-row" key={r.model}>
                    <div className="lcds-model-row__head">
                      <span className="lcds-model-row__name">{r.model}</span>
                      {r.available ? (
                        <span
                          className="lcds-badge lcds-badge--sm"
                          style={{
                            color: LABEL_META[r.label]?.color || '#2f5eff',
                            background: LABEL_META[r.label]?.soft || '#eef1ff',
                          }}
                        >
                          {r.label} · {r.confidence}%
                        </span>
                      ) : (
                        <span className="lcds-model-row__unavailable">Not loaded on server</span>
                      )}
                    </div>
                    {r.available && (
                      <span className="lcds-model-row__accuracy">
                        {r.known_val_accuracy != null
                          ? `${r.accuracy_verified ? '' : '~'}${r.known_val_accuracy}% val accuracy${r.accuracy_verified ? '' : ' (unverified)'}`
                          : 'Validation accuracy not available'}
                      </span>
                    )}
                    {r.note && <span className="lcds-model-row__note">{r.note}</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <span className="lcds-result__empty">Prediction from all three models will appear here once you check a scan.</span>
          )}
        </div>
      </div>
    </section>
  );
}
