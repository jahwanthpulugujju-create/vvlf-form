import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

export default function AuditLog() {
  const log = trpc.admin.auditLog.useQuery({ limit: 200 });

  const ACTION_LABELS: Record<string, string> = {
    login_success: "✓ Login",
    login_failed_wrong_password: "✗ Failed login (wrong password)",
    login_failed_user_not_found: "✗ Failed login (user not found)",
    login_rate_limited: "⚠ Rate limited",
    logout: "→ Logout",
    update_candidate: "✎ Updated candidate",
    view_candidate: "◎ Viewed candidate",
  };

  return (
    <AdminLayout title="Audit Log">
      <div className="admin-table-wrapper">
        <div className="admin-panel-header" style={{ padding: "14px 18px" }}>
          <div>
            <div className="admin-panel-title">Activity Log</div>
            <div className="admin-panel-sub">All admin actions are recorded. Last 200 entries.</div>
          </div>
        </div>

        {log.isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
        ) : (log.data?.length ?? 0) === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No audit entries yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {log.data?.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {new Date(entry.timestamp).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{entry.adminUsername}</td>
                  <td style={{
                    fontSize: 12,
                    color: entry.action.includes("failed") || entry.action.includes("rate") ? "#dc2626"
                      : entry.action.includes("login_success") ? "#059669"
                      : "#334155",
                  }}>
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{entry.target ?? "—"}</td>
                  <td style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{entry.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
