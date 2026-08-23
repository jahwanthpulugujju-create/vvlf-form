import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ClipboardList,
  Copy,
  Eye,
  ExternalLink,
  LayoutTemplate,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type QuestionKind = "short_text" | "long_text" | "email" | "phone" | "single_choice" | "multiple_choice" | "consent";
type DraftQuestion = { kind: QuestionKind; label: string; helpText: string; options: string[]; required: boolean };
type Draft = { title: string; description: string; successMessage: string; redirectUrl: string; questions: DraftQuestion[] };

const studioMenu = [
  { icon: LayoutTemplate, label: "My forms", path: "/studio" },
  { icon: Plus, label: "Create form", path: "/studio/new" },
];

const kindLabels: Record<QuestionKind, string> = {
  short_text: "Short text",
  long_text: "Long text",
  email: "Email address",
  phone: "Phone number",
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  consent: "Consent checkbox",
};

const starterDraft: Draft = {
  title: "Untitled form",
  description: "Tell people what this form is for and why their answers matter.",
  successMessage: "Thanks — your response has been received.",
  redirectUrl: "",
  questions: [
    { kind: "short_text", label: "What should we call you?", helpText: "", options: [], required: true },
    { kind: "email", label: "What is your email address?", helpText: "We will use this only to follow up if needed.", options: [], required: true },
    { kind: "long_text", label: "What would you like to share?", helpText: "", options: [], required: true },
    { kind: "consent", label: "I agree that my information may be used to respond to this form.", helpText: "", options: [], required: true },
  ],
};

const cloneStarter = (): Draft => JSON.parse(JSON.stringify(starterDraft)) as Draft;

function toDraft(data: { form: { title: string; description: string | null; successMessage: string; redirectUrl: string | null }; questions: DraftQuestion[] }): Draft {
  return {
    title: data.form.title,
    description: data.form.description || "",
    successMessage: data.form.successMessage,
    redirectUrl: data.form.redirectUrl || "",
    questions: data.questions.map((question) => ({ ...question })),
  };
}

function StudioOverview() {
  const [, navigate] = useLocation();
  const forms = trpc.studio.list.useQuery();

  return (
    <DashboardLayout brand="Form Studio" menuItems={studioMenu}>
      <div className="mx-auto w-full max-w-6xl py-6 sm:py-10">
        <header className="studio-hero">
          <div className="max-w-xl">
            <p className="studio-kicker text-blue-100">Your private form workspace</p>
            <h1>Make a form people want to complete.</h1>
            <p>Create, publish, and understand forms without sharing your workspace or submissions with other owners.</p>
          </div>
          <button className="studio-hero-button" type="button" onClick={() => navigate("/studio/new")}><Plus size={18} /> New form</button>
        </header>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="studio-kicker">Your library</p><h2 className="studio-title">Forms you own</h2></div>
            <span className="studio-count">{forms.data?.length ?? 0} total</span>
          </div>
          {forms.isLoading && <div className="studio-empty">Loading your forms…</div>}
          {!forms.isLoading && !forms.data?.length && <div className="studio-empty"><Sparkles size={22} /><h3>Start with your first reusable form.</h3><p>Use the starter structure, then make it yours with questions, consent, redirects, and a polished public link.</p><button className="studio-primary-button" type="button" onClick={() => navigate("/studio/new")}><Plus size={16} /> Create your first form</button></div>}
          {!forms.isLoading && forms.data?.length && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {forms.data.map((form) => {
              const publicUrl = window.location.origin + "/forms/" + form.slug;
              return <article className="studio-form-card" key={form.id}>
                <div className="flex items-start justify-between gap-4"><span className={"studio-status " + form.status}>{form.status}</span><button className="studio-icon-button" type="button" title="Copy public link" onClick={() => navigator.clipboard?.writeText(publicUrl)}><Copy size={15} /></button></div>
                <h3>{form.title}</h3><p>{form.description || "No description yet."}</p>
                <div className="mt-6 flex items-center justify-between gap-3"><button className="studio-link-button" type="button" onClick={() => navigate("/studio/forms/" + form.id)}>Edit form <ChevronLeft className="rotate-180" size={16} /></button><button className="studio-icon-button" type="button" title="View responses" onClick={() => navigate("/studio/forms/" + form.id + "/responses")}><BarChart3 size={16} /></button></div>
              </article>;
            })}
          </div>}
        </section>
      </div>
    </DashboardLayout>
  );
}

function QuestionEditor({ question, index, update, remove }: { question: DraftQuestion; index: number; update: (next: DraftQuestion) => void; remove: () => void }) {
  const requiresOptions = question.kind === "single_choice" || question.kind === "multiple_choice";
  return (
    <article className="studio-question-card">
      <div className="flex items-start justify-between gap-4"><div className="studio-question-number">{String(index + 1).padStart(2, "0")}</div><button className="studio-delete-button" type="button" onClick={remove} aria-label="Remove question"><Trash2 size={15} /></button></div>
      <div className="mt-4 grid gap-4">
        <label className="studio-field"><span>Question type</span><select value={question.kind} onChange={(event) => update({ ...question, kind: event.target.value as QuestionKind, options: [] })}>{(Object.keys(kindLabels) as QuestionKind[]).map((kind) => <option key={kind} value={kind}>{kindLabels[kind]}</option>)}</select></label>
        <label className="studio-field"><span>Question</span><input value={question.label} onChange={(event) => update({ ...question, label: event.target.value })} /></label>
        <label className="studio-field"><span>Helper text <em>optional</em></span><input value={question.helpText} onChange={(event) => update({ ...question, helpText: event.target.value })} placeholder="Add helpful context" /></label>
        {requiresOptions && <label className="studio-field"><span>Options <em>one per line</em></span><textarea value={question.options.join("\n")} onChange={(event) => update({ ...question, options: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} placeholder={"Option one\nOption two"} rows={4} /></label>}
        <label className="studio-check"><input type="checkbox" checked={question.required} onChange={(event) => update({ ...question, required: event.target.checked })} /><span>Required answer</span></label>
      </div>
    </article>
  );
}

function StudioBuilder({ formId }: { formId?: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const existing = trpc.studio.get.useQuery({ formId: formId || 1 }, { enabled: Boolean(formId) });
  const create = trpc.studio.create.useMutation({ onSuccess: ({ formId: createdId }) => { utils.studio.list.invalidate(); navigate("/studio/forms/" + createdId); } });
  const update = trpc.studio.update.useMutation({ onSuccess: () => { if (formId) utils.studio.get.invalidate({ formId }); utils.studio.list.invalidate(); } });
  const setStatus = trpc.studio.setStatus.useMutation({ onSuccess: () => { if (formId) utils.studio.get.invalidate({ formId }); utils.studio.list.invalidate(); } });
  const [draft, setDraft] = useState<Draft>(cloneStarter);
  const [notice, setNotice] = useState("");

  useEffect(() => { if (existing.data) setDraft(toDraft(existing.data)); }, [existing.data]);

  const updateQuestion = (index: number, next: DraftQuestion) => setDraft((previous) => ({ ...previous, questions: previous.questions.map((question, questionIndex) => questionIndex === index ? next : question) }));
  const removeQuestion = (index: number) => setDraft((previous) => ({ ...previous, questions: previous.questions.filter((_, questionIndex) => questionIndex !== index) }));
  const addQuestion = (kind: QuestionKind) => setDraft((previous) => ({ ...previous, questions: [...previous.questions, { kind, label: kind === "consent" ? "I agree to the privacy notice." : "New question", helpText: "", options: [], required: kind === "consent" }] }));
  const save = async () => {
    setNotice("");
    const data = { ...draft, questions: draft.questions.map((question, position) => ({ ...question, position })) };
    try {
      if (formId) await update.mutateAsync({ formId, data });
      else await create.mutateAsync(data);
      setNotice("Saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "We could not save this form."); }
  };

  if (existing.isLoading) return <DashboardLayout brand="Form Studio" menuItems={studioMenu}><div className="studio-empty">Loading form editor…</div></DashboardLayout>;
  if (existing.error) return <DashboardLayout brand="Form Studio" menuItems={studioMenu}><div className="studio-empty">This form is not available in your workspace.</div></DashboardLayout>;
  const status = existing.data?.form.status || "draft";
  const publicPath = existing.data ? "/forms/" + existing.data.form.slug : "";
  const publicUrl = publicPath ? window.location.origin + publicPath : "Save this form to create a public link.";

  return (
    <DashboardLayout brand="Form Studio" menuItems={studioMenu}>
      <div className="mx-auto w-full max-w-7xl py-6 sm:py-10">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><button className="studio-back-link" type="button" onClick={() => navigate("/studio")}><ChevronLeft size={15} /> My forms</button><p className="studio-kicker mt-4">Form builder</p><h1 className="studio-title">{formId ? "Shape your form" : "Start a new form"}</h1></div><div className="flex flex-wrap gap-2"><button className="studio-secondary-button" type="button" onClick={() => window.open(publicPath, "_blank")} disabled={!formId}><Eye size={16} /> Preview</button><button className="studio-primary-button" type="button" onClick={save} disabled={create.isPending || update.isPending}><Save size={16} /> {create.isPending || update.isPending ? "Saving…" : "Save"}</button></div></header>
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="grid gap-6"><article className="studio-panel"><p className="studio-kicker">The basics</p><div className="mt-5 grid gap-5"><label className="studio-field"><span>Form title</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label className="studio-field"><span>Introductory description</span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} /></label><label className="studio-field"><span>After-submit message</span><textarea value={draft.successMessage} onChange={(event) => setDraft({ ...draft, successMessage: event.target.value })} rows={3} /></label><label className="studio-field"><span>Optional redirect URL <em>after a successful response</em></span><input value={draft.redirectUrl} onChange={(event) => setDraft({ ...draft, redirectUrl: event.target.value })} placeholder="https://example.com/thank-you" /></label></div></article>
          <section><div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="studio-kicker">Questions</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Build the conversation</h2></div><select className="studio-add-select" defaultValue="" onChange={(event) => { if (event.target.value) { addQuestion(event.target.value as QuestionKind); event.target.value = ""; } }}><option value="">+ Add a question</option>{(Object.keys(kindLabels) as QuestionKind[]).map((kind) => <option key={kind} value={kind}>{kindLabels[kind]}</option>)}</select></div><div className="grid gap-4">{draft.questions.map((question, index) => <QuestionEditor key={question.kind + "-" + index} question={question} index={index} update={(next) => updateQuestion(index, next)} remove={() => removeQuestion(index)} />)}</div></section></section>
          <aside className="grid content-start gap-5"><article className="studio-panel studio-publish-card"><span className={"studio-status " + status}>{status}</span><h2>Share when it is ready.</h2><p>Only published forms have a public link. Your work stays private until you choose otherwise.</p>{formId && <><div className="studio-url"><span>{publicUrl}</span><button type="button" onClick={() => navigator.clipboard?.writeText(publicUrl)} aria-label="Copy public form link"><Copy size={15} /></button></div><button className={status === "published" ? "studio-secondary-button w-full" : "studio-primary-button w-full"} type="button" onClick={() => setStatus.mutate({ formId, status: status === "published" ? "draft" : "published" })} disabled={setStatus.isPending}>{status === "published" ? <><Check size={16} /> Unpublish form</> : <><Send size={16} /> Publish form</>}</button><button className="studio-secondary-button w-full" type="button" onClick={() => navigate("/studio/forms/" + formId + "/responses")}><BarChart3 size={16} /> View responses</button></>}</article>{notice && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{notice}</p>}</aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function csvCell(value: string) { return '"' + value.replaceAll('"', '""') + '"'; }

function StudioResponses({ formId }: { formId: number }) {
  const [, navigate] = useLocation();
  const form = trpc.studio.get.useQuery({ formId });
  const responses = trpc.studio.responses.useQuery({ formId });
  const exportResponses = () => {
    if (!responses.data) return;
    const rows = responses.data.map((response) => [new Date(response.createdAt).toLocaleString(), response.answers].map(csvCell).join(","));
    const blob = new Blob([[["Submitted at", "Answers"].map(csvCell).join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = (form.data?.form.slug || "form") + "-responses.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <DashboardLayout brand="Form Studio" menuItems={studioMenu}><div className="mx-auto w-full max-w-6xl py-6 sm:py-10"><button className="studio-back-link" type="button" onClick={() => navigate("/studio/forms/" + formId)}><ChevronLeft size={15} /> Back to editor</button><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="studio-kicker">Private responses</p><h1 className="studio-title">{form.data?.form.title || "Form responses"}</h1><p className="mt-2 text-sm text-slate-500">Only you can view and export responses to this form.</p></div><button className="studio-secondary-button" type="button" onClick={exportResponses}><ExternalLink size={16} /> Export CSV</button></div><section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{responses.isLoading ? <div className="studio-empty">Loading responses…</div> : responses.data?.length ? <div className="divide-y divide-slate-100">{responses.data.map((response) => <article className="p-5" key={response.id}><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">{new Date(response.createdAt).toLocaleString()}</p><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(JSON.parse(response.answers), null, 2)}</pre></article>)}</div> : <div className="studio-empty"><ClipboardList size={22} /><h3>No responses yet.</h3><p>Publish the form, then share its link when you are ready to collect responses.</p></div>}</section></div></DashboardLayout>;
}

export default function Studio() {
  const [location] = useLocation();
  const match = useMemo(() => location.match(/^\/studio\/forms\/(\d+)(?:\/(responses))?$/), [location]);
  if (match?.[2] === "responses") return <StudioResponses formId={Number(match[1])} />;
  if (match?.[1]) return <StudioBuilder formId={Number(match[1])} />;
  if (location === "/studio/new") return <StudioBuilder />;
  return <StudioOverview />;
}
