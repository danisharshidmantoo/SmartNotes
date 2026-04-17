import React, { useState } from "react";
import { register as registerAPI, login as loginAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = mode === "register"
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const fn = mode === "register" ? registerAPI : loginAPI;
      const { data } = await fn(payload);
      loginUser(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.container} className="fade-in">
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✦</span>
          <span style={styles.logoText}>Noted</span>
        </div>
        <p style={styles.tagline}>
          {mode === "login" ? "Welcome back. Your thoughts await." : "Create your account. Start thinking."}
        </p>

        <div className="card" style={styles.card}>
          <div style={styles.tabs}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
                onClick={() => { setMode(m); setError(""); }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {mode === "register" && (
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input
                  className="input"
                  name="name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                className="input"
                type="password"
                name="password"
                placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing…</> : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p style={styles.switch}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button style={styles.switchLink} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up free" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" },
  glow: { position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(124,106,247,0.12) 0%, transparent 70%)", pointerEvents: "none" },
  container: { width: "100%", maxWidth: 420, position: "relative" },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, justifyContent: "center" },
  logoIcon: { fontSize: 28, color: "var(--accent)" },
  logoText: { fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--text)" },
  tagline: { textAlign: "center", color: "var(--text-muted)", marginBottom: 28, fontSize: 14 },
  card: { padding: 28 },
  tabs: { display: "flex", gap: 4, marginBottom: 24, background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: 4 },
  tab: { flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, transition: "all 0.2s" },
  tabActive: { background: "var(--accent)", color: "white", boxShadow: "0 0 15px var(--accent-glow)" },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, color: "var(--text-muted)", fontWeight: 500 },
  error: { background: "rgba(240,94,94,0.1)", border: "1px solid rgba(240,94,94,0.2)", color: "var(--red)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: 13 },
  switch: { textAlign: "center", marginTop: 20, color: "var(--text-dim)", fontSize: 14 },
  switchLink: { background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)" },
};
