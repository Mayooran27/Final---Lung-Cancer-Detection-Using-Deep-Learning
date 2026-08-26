import { useCallback, useState } from "react";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./components/DashboardPage";
import UploadScanPage from "./components/UploadScanPage";
import ScanHistoryPage from "./components/ScanHistoryPage";
import SettingsPage from "./components/SettingsPage";

// No login flow yet — falls back to a generic "Clinician" user when
// localStorage has none, so the app works standalone.
function loadUser() {
  try {
    return JSON.parse(localStorage.getItem("lcds_user")) || { name: "Clinician" };
  } catch {
    return { name: "Clinician" };
  }
}

function App() {
  const [user, setUser] = useState(loadUser);

  // Shared by every page so Settings can rename the clinician and have the
  // topbar/avatar on every other page reflect it immediately.
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("lcds_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("lcds_token");
    localStorage.removeItem("lcds_user");
    setUser({ name: "Clinician" });
  };

  const pageProps = { user, onLogout: handleLogout };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace={true} />} />
      <Route path="/home" element={<DashboardPage {...pageProps} />} />
      <Route path="/upload" element={<UploadScanPage {...pageProps} />} />
      <Route path="/history" element={<ScanHistoryPage {...pageProps} />} />
      <Route
        path="/settings"
        element={<SettingsPage {...pageProps} onUpdateUser={updateUser} />}
      />
      <Route path="*" element={<Navigate to="/home" replace={true} />} />
    </Routes>
  );
}

export default App;
