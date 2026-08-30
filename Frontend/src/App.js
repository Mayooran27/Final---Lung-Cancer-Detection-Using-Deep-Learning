import { useState } from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./components/DashboardPage";
import UploadScanPage from "./components/UploadScanPage";
import ScanHistoryPage from "./components/ScanHistoryPage";

// No login flow yet — falls back to an empty user when localStorage has
// none, so the app works standalone without a placeholder name.
function loadUser() {
  try {
    return JSON.parse(localStorage.getItem("lcds_user")) || {};
  } catch {
    return {};
  }
}

function App() {
  const [user] = useState(loadUser);

  const pageProps = { user };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace={true} />} />
      <Route path="/home" element={<DashboardPage {...pageProps} />} />
      <Route path="/upload" element={<UploadScanPage {...pageProps} />} />
      <Route path="/history" element={<ScanHistoryPage {...pageProps} />} />
      <Route path="*" element={<Navigate to="/home" replace={true} />} />
    </Routes>
  );
}

export default App;
