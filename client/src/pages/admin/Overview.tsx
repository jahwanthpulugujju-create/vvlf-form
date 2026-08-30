import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { AlertTriangle, TrendingUp, Star, Target, Users, Clock } from "lucide-react";

const TRACK_COLORS: Record<string, string> = {
  "Technology & Product": "#2563eb",
  "Startups & Business": "#7c3aed",
  "Creative & Media": "#ea580c",
  "Content & Community": "#059669",
  "Explore & Build": "#d97706",
};

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "#2563eb",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  color?: string;
}) {
  return (
    <div className="admin-kpi-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div className="admin-kpi-label">{label}</div>
        {Icon && <Icon size={16} color={color} />}
      </div>
      <div className="admin-kpi-value" style={{ color }}>
        {value}
      </div>
      {sub && <div className="admin-kpi-sub">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const stats = trpc.admin.analyticsData.useQuery(undefined, { refetchInterval: 60_000 });

  if (stats.isLoading) {
    return (
      <AdminLayout title="Overview">
        <div style={{ color: "#64748b", fontSize: 13 }}>Loading analytics…</div>
      </AdminLayout>
    );
  }

  if (stats.error) {
    return (
      <AdminLayout title="Overview">
        <div style={{ color: "#dc2626", fontSize: 13 }}>{stats.error.message}</div>
      </AdminLayout>
    );
  }

  const d = stats.data!;
  const ov = d.overviewStats;

  const appTargetPct = Math.min(Math.round((ov.totalApplications / ov.targetApplication) * 100), 100);
  const selTargetPct = Math.min(Math.round((ov.selectedCount / ov.targetSelection) * 100), 100);

  return (
    <AdminLayout title="Overview">
      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <KpiCard
          label="Total Applications"
          value={ov.totalApplications}
          sub={`Target: ${ov.targetApplication}+ · ${appTargetPct}% reached`}
          icon={Users}
          color="#2563eb"
        />
        <KpiCard
          label="Strong Candidates"
          value={ov.strongCandidates}
          sub={`Score ≥ 80 · ${ov.totalApplications > 0 ? Math.round((ov.strongCandidates / ov.totalApplications) * 100) : 0}% of total`}
          icon={Star}
          color="#7c3aed"
        />
        <KpiCard
          label="Exceptional"
          value={ov.exceptionalCandidates}
          sub="Score ≥ 90"
          icon={TrendingUp}
          color="#dc2626"
        />
        <KpiCard
          label="Avg Quality Score"
          value={`${ov.avgScore}/100`}
          sub="Across all applications"
          color="#059669"
        />
        <KpiCard
          label="Selected"
          value={`${ov.selectedCount} / ${ov.targetSelection}`}
          sub={`${selTargetPct}% of target`}
          icon={Target}
          color="#d97706"
        />
        <KpiCard
          label="Needs Review"
          value={ov.unreviewedHighPotential}
          sub="High-potential · unreviewed"
          icon={AlertTriangle}
          color="#ea580c"
        />
      </div>

      {/* Target Progress */}
      <div className="admin-panel" style={{ marginBottom: 20 }}>
        <div className="admin-panel-header">
          <div>
            <div className="admin-panel-title">Campaign Targets</div>
            <div className="admin-panel-sub">Application and selection progress</div>
          </div>
        </div>
        <div className="admin-panel-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>Applications</span>
              <span style={{ color: "#64748b" }}>{ov.totalApplications} / {ov.targetApplication}</span>
            </div>
            <div className="admin-progress-bar">
              <div
                className={`admin-progress-fill ${appTargetPct >= 100 ? "green" : appTargetPct >= 60 ? "" : "amber"}`}
                style={{ width: `${appTargetPct}%` }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>Selections</span>
              <span style={{ color: "#64748b" }}>{ov.selectedCount} / {ov.targetSelection}</span>
            </div>
            <div className="admin-progress-bar">
              <div
                className={`admin-progress-fill ${selTargetPct >= 100 ? "green" : ""}`}
                style={{ width: `${selTargetPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="admin-chart-grid" style={{ marginBottom: 20 }}>
        {/* Application Trend */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Application Trend</div>
              <div className="admin-panel-sub">Last 14 days</div>
            </div>
          </div>
          <div className="admin-panel-body">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={d.trend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Applications"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#trendGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Track Distribution */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Track Distribution</div>
              <div className="admin-panel-sub">Applications by interest area</div>
            </div>
          </div>
          <div className="admin-panel-body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={d.trackDistribution}
                  dataKey="count"
                  nameKey="track"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {d.trackDistribution.map((entry) => (
                    <Cell key={entry.track} fill={TRACK_COLORS[entry.track] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [`${v} applications`, name]}
                  contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
              {d.trackDistribution.map((t) => (
                <div key={t.track} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: TRACK_COLORS[t.track] ?? "#94a3b8", display: "inline-block" }} />
                  {t.track.split(" & ")[0]} ({t.count})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Source + Quality row */}
      <div className="admin-chart-grid">
        {/* Source Breakdown */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Acquisition Sources</div>
              <div className="admin-panel-sub">Where applicants come from</div>
            </div>
          </div>
          <div className="admin-panel-body">
            {d.sourceBreakdown.slice(0, 7).map((s) => (
              <div key={s.source} className="skill-bar-row">
                <div className="skill-bar-label">{s.source}</div>
                <div className="skill-bar-wrap">
                  <div className="skill-bar-fill" style={{ width: `${s.pct}%` }} />
                </div>
                <div className="skill-bar-count">{s.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="admin-panel-title">Quality Distribution</div>
              <div className="admin-panel-sub">Candidate score buckets</div>
            </div>
          </div>
          <div className="admin-panel-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d.scoreDistribution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }} />
                <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                  {d.scoreDistribution.map((entry) => {
                    const color = entry.range === "90-100" ? "#dc2626"
                      : entry.range === "80-89" ? "#2563eb"
                      : entry.range === "70-79" ? "#059669"
                      : entry.range === "60-69" ? "#d97706"
                      : "#94a3b8";
                    return <Cell key={entry.range} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Action Center */}
      {ov.unreviewedHighPotential > 0 && (
        <div className="action-center" style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Action Center
          </div>
          <div className="action-center-item">
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>{ov.unreviewedHighPotential} high-potential candidates</strong> (score ≥ 80) are still in "New" or "Screening" — they deserve immediate attention.
            </span>
          </div>
          {ov.topTrack && (
            <div className="action-center-item">
              <Star size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>{ov.topTrack}</strong> is your most popular track with {ov.topTrackCount} applications.
              </span>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
