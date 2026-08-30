/**
 * UploadScanPage.jsx
 * -----------------------------------------------------------------------
 * Dedicated full-page version of the "Check a CT scan" flow, reached from
 * the sidebar's "Upload scan" item (previously an inert button). Reuses
 * CheckScanPanel so behavior stays identical to the Dashboard's copy.
 * -----------------------------------------------------------------------
 */
import React from 'react';
import Layout from './Layout';
import CheckScanPanel from './CheckScanPanel';
import { useScans } from '../lib/scans';

export default function UploadScanPage({ user }) {
  const { refresh } = useScans();

  return (
    <Layout
      active="upload"
      title="Upload scan"
      subtitle="Run a chest CT image through all three trained models."
      user={user}
    >
      <CheckScanPanel onChecked={refresh} />
    </Layout>
  );
}
