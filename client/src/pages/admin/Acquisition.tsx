import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function Acquisition() {
  const stats = trpc.admin.analyticsData.useQuery();

  if (stats.isLoading) {
    return <AdminLayout title="Acquisition"><div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div></AdminLayout>;
  }
  if (stats.error) {
    return <AdminLayout title="Acquisition"><div style={{ color: "#dc2626", fontSize: 13 }}>{stats.error.message}</div></AdminLayout>;
  }

  const d = stats.data!;
  const sources = d.sourceBreakdown;
  const maxSource = sources[0]?.count || 1;

  const barColors = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#ea580c", "#94a3b8", "#0891b2"];

  return (
    <AdminLayout title="Acquisition">
      {/* Volume chart */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Source Volume</div>
            <div className="admin-panel-sub">Applications by acquisition channel · tag links with <code style={{ fontSize: 11 }}>?source=instagram</code></div>
          </div>
        </div>
        <div className="admin-panel-body">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sources} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis type="category" dataKey="source" width={90} tick={{ fontSize: 12, fill: "#475569" }} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }} />
              <Bar dataKey="count" name="Applications" radius={[0, 4, 4, 0]}>
                {sources.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source quality matrix */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Source Quality Matrix</div>
            <div className="admin-panel-sub">Volume vs strong candidate rate — which channels produce the best talent</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Applications</th>
                <th>% of Total</th>
                <th>Strong (≥80)</th>
                <th>Strong Rate</th>
                <th>Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {sources.sort((a, b) => b.strongRate - a.strongRate).map((s, i) => (
                <tr key={s.source}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>
                    <span style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: barColors[i % barColors.length],
                      marginRight: 6,
                      verticalAlign: "middle",
                    }} />
                    {s.source}
                  </td>
                  <td>{s.count}</td>
                  <td>{s.pct}%</td>
                  <td>{s.strongCount}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 70, height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          width: `${s.strongRate}%`,
                          height: "100%",
                          background: s.strongRate >= 25 ? "#059669" : s.strongRate >= 15 ? "#2563eb" : "#94a3b8",
                          borderRadius: 99,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: s.strongRate >= 25 ? "#059669" : s.strongRate >= 15 ? "#2563eb" : "#64748b",
                      }}>
                        {s.strongRate}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: s.avgScore >= 80 ? "#1d4ed8" : "#475569" }}>
                    {s.avgScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Insights</div>
            <div className="admin-panel-sub">Automatically generated from your acquisition data</div>
          </div>
        </div>
        <div className="admin-panel-body">
          {sources.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              No source data yet. Start tagging your links with <code>?source=instagram</code>, <code>?source=whatsapp</code>, etc.
            </div>
          ) : (
            <>
              {(() => {
                const topQuality = [...sources].sort((a, b) => b.strongRate - a.strongRate)[0];
                const topVolume = [...sources].sort((a, b) => b.count - a.count)[0];
                const insights = [];
                if (topQuality && topVolume && topQuality.source !== topVolume.source) {
                  insights.push({
                    title: `${topQuality.source} produces the highest quality`,
                    body: `${topQuality.strongRate}% of ${topQuality.source} applicants score ≥ 80 — significantly better than ${topVolume.source} at ${topVolume.strongRate}%.`,
                  });
                }
                if (topVolume) {
                  insights.push({
                    title: `${topVolume.source} is your largest volume channel`,
                    body: `${topVolume.count} applications (${topVolume.pct}% of total). Avg score: ${topVolume.avgScore}.`,
                  });
                }
                const directSource = sources.find((s) => s.source === "Direct");
                if (directSource && directSource.pct > 40) {
                  insights.push({
                    title: "High direct traffic — consider tagging your links",
                    body: `${directSource.pct}% of applications have no source tag. Add ?source= params to WhatsApp, Instagram, and QR links to understand your channels.`,
                  });
                }
                return insights.map((ins, i) => (
                  <div key={i} className="insight-card">
                    <strong>{`${i + 1}. ${ins.title}`}</strong>
                    <p>{ins.body}</p>
                  </div>
                ));
              })()}
            </>
          )}
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
            <strong style={{ color: "#0f172a", display: "block", marginBottom: 4 }}>How to tag your links:</strong>
            <div style={{ fontFamily: "monospace", marginBottom: 4 }}>https://vvlf-form.vercel.app/?source=instagram</div>
            <div style={{ fontFamily: "monospace", marginBottom: 4 }}>https://vvlf-form.vercel.app/?source=whatsapp</div>
            <div style={{ fontFamily: "monospace", marginBottom: 4 }}>https://vvlf-form.vercel.app/?source=qr_poster</div>
            <div style={{ fontFamily: "monospace" }}>https://vvlf-form.vercel.app/?source=ecell_club</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
