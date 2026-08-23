import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, CircleAlert, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";

type Answers = Record<string, unknown>;

function isRedirectUrl(value: string | null) {
  if (!value) return false;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

export default function PublicStudioForm() {
  const [, params] = useRoute("/forms/:slug");
  const slug = params?.slug || "";
  const formQuery = trpc.studio.publicGet.useQuery({ slug }, { enabled: Boolean(slug) });
  const submit = trpc.studio.submit.useMutation();
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const redirectUrl = useMemo(() => formQuery.data?.form.redirectUrl || null, [formQuery.data?.form.redirectUrl]);

  useEffect(() => {
    if (!submitted || !isRedirectUrl(redirectUrl)) return;
    const timer = window.setTimeout(() => window.location.assign(redirectUrl!), 1300);
    return () => window.clearTimeout(timer);
  }, [redirectUrl, submitted]);

  const setAnswer = (id: number, value: unknown) => setAnswers((previous) => ({ ...previous, [String(id)]: value }));
  const toggleOption = (id: number, option: string) => setAnswers((previous) => {
    const current = Array.isArray(previous[String(id)]) ? previous[String(id)] as string[] : [];
    return { ...previous, [String(id)]: current.includes(option) ? current.filter((item) => item !== option) : [...current, option] };
  });
  const handleSubmit = async () => {
    setError("");
    try { await submit.mutateAsync({ slug, answers }); setSubmitted(true); } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "We could not send your response. Please try again."); }
  };

  if (formQuery.isLoading) return <main className="studio-public-page"><div className="studio-public-shell studio-public-loading">Loading this form…</div></main>;
  if (formQuery.error || !formQuery.data) return <main className="studio-public-page"><div className="studio-public-shell studio-public-empty"><CircleAlert size={26} /><h1>This form is unavailable.</h1><p>It may be private, unpublished, or no longer accepting responses.</p></div></main>;
  const { form, questions } = formQuery.data;
  if (submitted) return <main className="studio-public-page"><div className="studio-public-shell studio-public-success"><div className="studio-success-icon"><CheckCircle2 size={32} /></div><p className="studio-kicker">Response received</p><h1>{form.successMessage}</h1>{isRedirectUrl(redirectUrl) ? <p>Taking you to the next step now.</p> : <p>You can close this page safely.</p>}</div></main>;

  return <main className="studio-public-page"><div className="studio-public-shell"><header className="studio-public-header"><div className="studio-public-mark"><Sparkles size={17} /></div><div><p className="studio-kicker">Secure form</p><h1>{form.title}</h1>{form.description && <p>{form.description}</p>}</div><LockKeyhole size={18} aria-label="Private response" /></header><section className="studio-public-questions">{questions.map((question) => {
    const value = answers[String(question.id)];
    const choice = question.kind === "single_choice" || question.kind === "multiple_choice";
    if (question.kind === "consent") return <label className="studio-public-consent" key={question.id}><input type="checkbox" checked={value === true} onChange={(event) => setAnswer(question.id, event.target.checked)} /><span><strong>{question.label}{question.required ? " *" : ""}</strong>{question.helpText && <small>{question.helpText}</small>}</span></label>;
    return <fieldset className="studio-public-question" key={question.id}><legend>{question.label}{question.required ? " *" : ""}</legend>{question.helpText && <p>{question.helpText}</p>}{choice ? <div className="studio-public-choices">{question.options.map((option) => { const selected = question.kind === "multiple_choice" ? Array.isArray(value) && value.includes(option) : value === option; return <button className={selected ? "selected" : ""} type="button" key={option} onClick={() => question.kind === "multiple_choice" ? toggleOption(question.id, option) : setAnswer(question.id, option)}><span>{selected ? <CheckCircle2 size={15} /> : ""}</span>{option}</button>; })}</div> : question.kind === "long_text" ? <textarea value={typeof value === "string" ? value : ""} onChange={(event) => setAnswer(question.id, event.target.value)} rows={5} /> : <input type={question.kind === "email" ? "email" : question.kind === "phone" ? "tel" : "text"} value={typeof value === "string" ? value : ""} onChange={(event) => setAnswer(question.id, event.target.value)} />}</fieldset>;
  })}</section>{error && <p className="studio-public-error" role="alert">{error}</p>}<footer className="studio-public-footer"><p><LockKeyhole size={14} /> Your response is sent only to this form’s owner.</p><button type="button" onClick={handleSubmit} disabled={submit.isPending}>{submit.isPending ? "Sending response…" : <>Submit response <ChevronRight size={17} /></>}</button></footer></div></main>;
}
