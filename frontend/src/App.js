import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ToastContainer from "./components/Toast";

function AppInner() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loader}>
        <span style={styles.loaderIcon}>✦</span>
        <span className="spinner" style={{ width: 22, height: 22 }} />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <ToastContainer />
    </AuthProvider>
  );
}

const styles = {
  loader: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    background: "var(--bg)",
  },
  loaderIcon: {
    fontSize: 36,
    color: "var(--accent)",
    animation: "pulse 1.5s ease-in-out infinite",
  },
};
