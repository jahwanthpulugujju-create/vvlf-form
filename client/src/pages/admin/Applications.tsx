import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";
import { Search, Download, ChevronUp, ChevronDown, X, RotateCcw, Filter } from "lucide-react";
import CandidateDetail from "./CandidateDetail";

type SortKey = "score" | "fullName" | "track" | "studyYear" | "status" | "createdAt";

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

const TIERS = [
  { id: "exceptional", label: "🔥 Exceptional (≥90)" },
  { id: "strong", label: "⭐ Strong (≥80)" },
  { id: "potential", label: "✅ Potential (70-79)" },
  { id: "review", label: "🟡 Review (60-69)" },
  { id: "low", label: "⚪ Low (<60)" },
] as const;

const STATUSES = [
  { id: "new", label: "New" },
  { id: "screening", label: "Screening" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "challenge_sent", label: "Challenge Sent" },
  { id: "challenge_done", label: "Challenge Done" },
  { id: "interview", label: "Interview" },
  { id: "selected", label: "Selected" },
  { id: "waitlisted", label: "Waitlisted" },
  { id: "rejected", label: "Rejected" },
] as const;

const TRACK_BADGES: Record<string, { bg: string; color: string; border: string }> = {
  "Startups & Business": { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  "Technology & Product": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Creative & Media": { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  "Content & Community": { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  "Explore & Build": { bg: "#fefce8", color: "#a16207", border: "#fef08a" },
};

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
  a.download = `vvlf-applications-filtered-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Applications() {
  const appsQuery = trpc.admin.listApplications.useQuery(undefined, { refetchInterval: 30_000 });
  const updateCandidate = trpc.admin.updateCandidate.useMutation({ onSuccess: () => appsQuery.refetch() });

  const [search, setSearch] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const apps = appsQuery.data ?? [];

  // Multi-select toggle helpers
  const toggleTrack = (t: string) => {
    setSelectedTracks((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const toggleYear = (y: string) => {
    setSelectedYears((prev) =>
      prev.includes(y) ? prev.filter((item) => item !== y) : [...prev, y]
    );
  };

  const toggleTier = (tierId: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tierId) ? prev.filter((item) => item !== tierId) : [...prev, tierId]
    );
  };

  const toggleStatus = (stId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(stId) ? prev.filter((item) => item !== stId) : [...prev, stId]
    );
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedTracks([]);
    setSelectedYears([]);
    setSelectedTiers([]);
    setSelectedStatuses([]);
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedTracks.length > 0 ||
    selectedYears.length > 0 ||
    selectedTiers.length > 0 ||
    selectedStatuses.length > 0;

  // Counts per filter item for live badges
  const trackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of ALL_TRACKS) counts[t] = 0;
    for (const a of apps) {
      if (counts[a.track] !== undefined) counts[a.track]++;
    }
    return counts;
  }, [apps]);

  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const y of ALL_YEARS) counts[y] = 0;
    for (const a of apps) {
      if (counts[a.studyYear] !== undefined) counts[a.studyYear]++;
    }
    return counts;
  }, [apps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps
      .filter((a) => {
        // Text search
        if (q && !([a.fullName, a.email, a.college, a.track, a.department, ...(a.skills || [])].some((v) => v?.toLowerCase().includes(q)))) {
          return false;
        }
        // Multi-select tracks filter
        if (selectedTracks.length > 0 && !selectedTracks.includes(a.track)) {
          return false;
        }
        // Multi-select years filter
        if (selectedYears.length > 0 && !selectedYears.includes(a.studyYear)) {
          return false;
        }
        // Multi-select tiers filter
        if (selectedTiers.length > 0 && !selectedTiers.includes(a.tier)) {
          return false;
        }
        // Multi-select statuses filter
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(a.status)) {
          return false;
        }
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
  }, [apps, search, selectedTracks, selectedYears, selectedTiers, selectedStatuses, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "score" ? "desc" : "asc");
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  return (
    <AdminLayout title="Applications">
      <div className="admin-table-wrapper" style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        
        {/* Multi-Select Filter Control Panel */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", background: "#fcfdfe" }}>
          
          {/* Search + Action Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260, maxWidth: 500 }}>
              <div className="admin-search" style={{ width: "100%" }}>
                <Search size={15} color="#94a3b8" />
                <input
                  placeholder="Search name, email, college, track, skills…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%" }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    borderRadius: 8,
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={13} /> Reset Filters
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => exportCsv(filtered as Record<string, unknown>[])}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Download size={14} /> Export Filtered ({filtered.length})
              </button>
            </div>
          </div>

          {/* Filter Rows: Tracks */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 70 }}>
                Tracks:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setSelectedTracks([])}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: selectedTracks.length === 0 ? 700 : 500,
                    background: selectedTracks.length === 0 ? "#0f172a" : "#f1f5f9",
                    color: selectedTracks.length === 0 ? "#ffffff" : "#475569",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  All ({apps.length})
                </button>
                {ALL_TRACKS.map((track) => {
                  const isSelected = selectedTracks.includes(track);
                  const count = trackCounts[track] || 0;
                  const styling = TRACK_BADGES[track];
                  return (
                    <button
                      key={track}
                      type="button"
                      onClick={() => toggleTrack(track)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 11px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? styling.color : styling.bg,
                        color: isSelected ? "#ffffff" : styling.color,
                        border: `1px solid ${isSelected ? styling.color : styling.border}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? `0 2px 8px ${styling.color}35` : "none",
                      }}
                    >
                      <span>{track}</span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 5px",
                          borderRadius: 10,
                          background: isSelected ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                          color: isSelected ? "#ffffff" : styling.color,
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Rows: Study Years */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 70 }}>
                Years:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setSelectedYears([])}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: selectedYears.length === 0 ? 700 : 500,
                    background: selectedYears.length === 0 ? "#0f172a" : "#f1f5f9",
                    color: selectedYears.length === 0 ? "#ffffff" : "#475569",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  All
                </button>
                {ALL_YEARS.map((yr) => {
                  const isSelected = selectedYears.includes(yr);
                  const count = yearCounts[yr] || 0;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => toggleYear(yr)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 11px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? "#2563eb" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#334155",
                        border: isSelected ? "1px solid #1d4ed8" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
                      }}
                    >
                      <span>{yr}</span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 5px",
                          borderRadius: 10,
                          background: isSelected ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                          color: isSelected ? "#ffffff" : "#64748b",
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Rows: Quality Tiers & Pipeline Statuses */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {/* Tiers */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 70 }}>
                Score:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {TIERS.map((tier) => {
                  const isSelected = selectedTiers.includes(tier.id);
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => toggleTier(tier.id)}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? "#0f172a" : "#f8fafc",
                        color: isSelected ? "#ffffff" : "#475569",
                        border: isSelected ? "1px solid #0f172a" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statuses */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Status:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {STATUSES.map((st) => {
                  const isSelected = selectedStatuses.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => toggleStatus(st.id)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? "#059669" : "#f8fafc",
                        color: isSelected ? "#ffffff" : "#475569",
                        border: isSelected ? "1px solid #047857" : "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Filters Summary Bar */}
          {hasActiveFilters && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px dashed #e2e8f0",
                fontSize: 12,
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>Active Filters:</span>

              {selectedTracks.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Track: {t}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => toggleTrack(t)} />
                </span>
              ))}

              {selectedYears.map((y) => (
                <span
                  key={y}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#f0fdf4",
                    color: "#16a34a",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Year: {y}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => toggleYear(y)} />
                </span>
              ))}

              {selectedTiers.map((tr) => (
                <span
                  key={tr}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#fef3c7",
                    color: "#b45309",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Score: {tr}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => toggleTier(tr)} />
                </span>
              ))}

              {selectedStatuses.map((st) => (
                <span
                  key={st}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#f3e8ff",
                    color: "#7e22ce",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                >
                  Status: {st}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => toggleStatus(st)} />
                </span>
              ))}

              <span style={{ marginLeft: "auto", color: "#64748b", fontWeight: 700 }}>
                Showing {filtered.length} of {apps.length}
              </span>
            </div>
          )}
        </div>

        {/* Table */}
        {appsQuery.isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading applications…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 50, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            <Filter size={24} color="#94a3b8" style={{ margin: "0 auto 8px", display: "block" }} />
            <p style={{ fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>No applications match the selected filters.</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Try clearing some filters or changing your search terms.</p>
            <button
              onClick={clearAllFilters}
              style={{
                marginTop: 12,
                padding: "6px 14px",
                borderRadius: 8,
                background: "#f1f5f9",
                color: "#0f172a",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset all filters
            </button>
          </div>
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
                  const badge = TRACK_BADGES[app.track] ?? { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
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
                      <td style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{app.studyYear}</td>
                      <td style={{ fontSize: 12, color: "#475569", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.department}</td>
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
