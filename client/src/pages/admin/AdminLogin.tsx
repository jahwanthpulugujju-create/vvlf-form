import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import "./admin.css";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const login = trpc.admin.login.useMutation({
    onSuccess: () => {
      setLocation("/admin/overview");
    },
    onError: (err) => {
      setError(err.message || "Login failed. Please check your credentials.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    login.mutate({ username: username.trim(), password });
  }

  return (
    <div className="admin-root">
      <div className="admin-login-page">
        <div className="admin-login-card">
          {/* Logo */}
          <div className="admin-login-logo">
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1d4ed8, #1e3a8a)",
              boxShadow: "0 4px 14px rgba(29, 78, 216, 0.3)",
            }}>
              <ShieldCheck size={26} color="white" />
            </div>
          </div>

          <h1 className="admin-login-heading">VVLF Admin Portal</h1>
          <p className="admin-login-sub">Authorized administrators only</p>

          <form onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="admin-username">Username</label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={login.isPending}
              />
            </div>

            <div className="admin-field" style={{ position: "relative" }}>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={login.isPending}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 32,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={login.isPending}
            >
              {login.isPending ? "Signing in…" : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Lock size={14} />
                  Sign In
                </span>
              )}
            </button>

            {error && <div className="admin-login-error">{error}</div>}
          </form>

          <p className="admin-login-footer">
            Unauthorized access is prohibited and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
