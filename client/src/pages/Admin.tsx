import { useMemo, useState } from "react";
import { Download, FileSearch, LockKeyhole, Search, SlidersHorizontal } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { applicationsCsv } from "@/lib/applicationExport";

type SortKey = "createdAt" | "fullName" | "track" | "college";

function exportApplications(rows: Array<Record<string, unknown>>) {
  const file = new Blob([applicationsCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vvlf-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const applications = trpc.application.list.useQuery(undefined, { enabled: user?.role === "admin" });

  const rows = useMemo(() => {
    const raw = applications.data ?? [];
    const normalized = raw.map((item) => ({ ...item, tools: JSON.parse(item.tools || "[]") as string[] }));
    const query = search.trim().toLowerCase();
    return normalized
      .filter((item) => !query || [item.fullName, item.email, item.college, item.track, item.department].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = sortKey === "createdAt" ? new Date(a.createdAt).getTime() : String(a[sortKey]).toLowerCase();
        const right = sortKey === "createdAt" ? new Date(b.createdAt).getTime() : String(b[sortKey]).toLowerCase();
        const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
        return direction === "asc" ? result : -result;
      });
  }, [applications.data, direction, search, sortKey]);

  const changeSort = (nextKey: SortKey) => {
    if (nextKey === sortKey) setDirection((value) => value === "asc" ? "desc" : "asc");
    else { setSortKey(nextKey); setDirection(nextKey === "createdAt" ? "desc" : "asc"); }
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-500">Loading secure administration…</div>;
  if (!user) return <DashboardLayout><div /></DashboardLayout>;
  if (user.role !== "admin") return <div className="min-h-screen grid place-items-center bg-slate-50 px-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-9 text-center shadow-xl shadow-slate-200/50"><LockKeyhole className="mx-auto mb-4 text-blue-700" size={34} /><h1 className="font-serif text-3xl text-slate-950">Administrator access only</h1><p className="mt-3 text-sm leading-6 text-slate-500">Sign in with the VVLF owner account to view submitted applications.</p></div></div>;

  return <DashboardLayout><div className="mx-auto max-w-7xl space-y-7 p-2 sm:p-5">
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-7 text-white shadow-xl shadow-blue-950/15 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">VVLF / Applicant review</p><div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Applications, made usable.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Search, sort, and export applicant submissions from one protected workspace.</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur"><p className="text-2xl font-bold">{applications.data?.length ?? 0}</p><p className="text-xs font-semibold uppercase tracking-[.12em] text-blue-100">Total submissions</p></div></div></header>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, college, track…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div><button type="button" onClick={() => exportApplications(rows)} disabled={!rows.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} /> Export CSV</button></div>
      {applications.isLoading ? <div className="grid min-h-64 place-items-center text-sm text-slate-500">Loading applications…</div> : applications.error ? <div className="grid min-h-64 place-items-center p-8 text-center text-sm text-rose-700">{applications.error.message}</div> : rows.length === 0 ? <div className="grid min-h-64 place-items-center p-8 text-center"><FileSearch className="mb-3 text-slate-300" size={38} /><p className="font-semibold text-slate-700">No matching applications yet.</p><p className="mt-1 text-sm text-slate-500">New submissions will appear here after applicants submit the public form.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-[.1em] text-slate-500"><tr>{([['createdAt','Submitted'],['fullName','Applicant'],['college','College'],['track','Track']] as [SortKey,string][]).map(([key,label]) => <th className="px-5 py-4" key={key}><button className="inline-flex items-center gap-1 font-bold hover:text-blue-700" onClick={() => changeSort(key)}>{label}<SlidersHorizontal size={12} />{sortKey === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</button></th>)}<th className="px-5 py-4">Contact</th><th className="px-5 py-4">Signals</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((item) => <tr className="align-top transition hover:bg-blue-50/40" key={item.id}><td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString()}<br /><span className="text-xs">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td><td className="px-5 py-4"><p className="font-bold text-slate-900">{item.fullName}</p><p className="mt-1 text-xs text-slate-500">{item.department} · {item.studyYear}</p></td><td className="px-5 py-4 text-sm text-slate-700">{item.college}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">{item.track}</span></td><td className="px-5 py-4 text-sm"><a className="block font-medium text-blue-700 hover:underline" href={`mailto:${item.email}`}>{item.email}</a><a className="mt-1 block text-slate-500 hover:text-slate-800" href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{item.whatsapp}</a></td><td className="px-5 py-4 text-xs leading-5 text-slate-600"><p><strong>Tools:</strong> {item.tools.join(', ')}</p><p className="mt-1"><strong>Goal:</strong> {item.goal}</p>{item.portfolioLink && <a className="mt-1 block font-semibold text-blue-700 hover:underline" href={item.portfolioLink} target="_blank" rel="noreferrer">Open portfolio</a>}</td></tr>)}</tbody></table></div>}</section>
  </div></DashboardLayout>;
}
