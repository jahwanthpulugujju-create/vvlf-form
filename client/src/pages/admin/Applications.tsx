import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react";
import CandidateDetail from "./CandidateDetail";

type SortKey = "score" | "fullName" | "track" | "studyYear" | "status" | "createdAt";

const TIERS = ["exceptional", "strong", "potential", "review", "low"] as const;
const STATUSES = ["new", "screening", "shortlisted", "challenge_sent", "challenge_done", "interview", "selected", "waitlisted", "rejected", "withdrawn"] as const;

function exportCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter((k) => !["scoreBreakdown", "tools", "workAreas", "skills"].includes(k));
  const header = keys.join(",");
  const body = rows.map((r) =>
    keys.map((k) => {
      const v = r[k];
      const s = v === null || v === undefined ? "" : String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(",")
  ).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vvlf-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const ALL_TRACKS = [
  "Startups & Business",
  "Technology & Product",
  "Creative & Media",
  "Content & Community",
  "Explore & Build",
] as const;

const ALL_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
] as const;

const TRACK_BADGES: Record<string, { bg: string; color: string }> = {
  "Startups & Business": { bg: "#f5f3ff", color: "#7c3aed" },
  "Technology & Product": { bg: "#eff6ff", color: "#1d4ed8" },
  "Creative & Media": { bg: "#fff7ed", color: "#c2410c" },
  "Content & Community": { bg: "#f0fdf4", color: "#15803d" },
  "Explore & Build": { bg: "#fefce8", color: "#a16207" },
};

export default function Applications() {
  const appsQuery = trpc.admin.listApplications.useQuery(undefined, { refetchInterval: 30_000 });
  const updateCandidate = trpc.admin.updateCandidate.useMutation({ onSuccess: () => appsQuery.refetch() });

  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const apps = appsQuery.data ?? [];
  const tracks = ALL_TRACKS;
  const years = ALL_YEARS;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps
      .filter((a) => {
        if (q && !([a.fullName, a.email, a.college, a.track, a.department].some((v) => v?.toLowerCase().includes(q)))) return false;
        if (trackFilter !== "all" && a.track !== trackFilter) return false;
        if (yearFilter !== "all" && a.studyYear !== yearFilter) return false;
        if (tierFilter !== "all" && a.tier !== tierFilter) return false;
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let av: unknown = a[sortKey as keyof typeof a];
        let bv: unknown = b[sortKey as keyof typeof b];
        if (sortKey === "createdAt") {
          av = new Date(a.createdAt).getTime();
          bv = new Date(b.createdAt).getTime();
        }
        const result = typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
        return sortDir === "asc" ? result : -result;
      });
  }, [apps, search, trackFilter, yearFilter, tierFilter, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "createdAt" || key === "score" ? "desc" : "asc"); }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  return (
    <AdminLayout title="Applications">
      <div className="admin-table-wrapper">
        {/* Controls */}
        <div className="admin-table-controls">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div className="admin-search">
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Search name, email, college, track…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="admin-filter-select" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
              <option value="all">All Tracks</option>
              {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="admin-filter-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="all">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="admin-filter-select" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
              <option value="all">All Quality Tiers</option>
              {TIERS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{filtered.length} results</span>
            <button className="btn-secondary" onClick={() => exportCsv(filtered as Record<string, unknown>[])}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        {appsQuery.isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No applications match your filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th><button onClick={() => toggleSort("fullName")}>Name <SortIcon k="fullName" /></button></th>
                  <th><button onClick={() => toggleSort("track")}>Track <SortIcon k="track" /></button></th>
                  <th><button onClick={() => toggleSort("studyYear")}>Year <SortIcon k="studyYear" /></button></th>
                  <th>Branch</th>
                  <th><button onClick={() => toggleSort("score")}>Score <SortIcon k="score" /></button></th>
                  <th>Skills</th>
                  <th><button onClick={() => toggleSort("status")}>Status <SortIcon k="status" /></button></th>
                  <th>Source</th>
                  <th><button onClick={() => toggleSort("createdAt")}>Submitted <SortIcon k="createdAt" /></button></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => {
                  const badge = TRACK_BADGES[app.track] ?? { bg: "#eff6ff", color: "#1d4ed8" };
                  return (
                    <tr
                      key={app.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedId(app.id)}
                    >
                      <td style={{ color: "#94a3b8", fontSize: 11 }}>{app.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{app.fullName}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{app.email}</div>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: badge.bg,
                          color: badge.color,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}>
                          {app.track}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#475569" }}>{app.studyYear}</td>
                      <td style={{ fontSize: 12, color: "#475569", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.department}</td>
                      <td>
                        <span className={`score-badge ${app.tier}`}>
                          {app.score}
                        </span>
                      </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {app.skills.slice(0, 3).map((s: string) => (
                          <span key={s} style={{ fontSize: 10, background: "#f1f5f9", color: "#475569", padding: "1px 5px", borderRadius: 4 }}>
                            {s}
                          </span>
                        ))}
                        {app.skills.length > 3 && (
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>+{app.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${app.status}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                      <td style={{ fontSize: 11, color: "#94a3b8" }}>{app.source ?? "Direct"}</td>
                      <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate drawer */}
      {selectedApp && (
        <CandidateDetail
          app={selectedApp}
          onClose={() => setSelectedId(null)}
          onUpdate={(id, updates) => updateCandidate.mutate({ id, ...updates })}
        />
      )}
    </AdminLayout>
  );
}
