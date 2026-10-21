"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ImagePlus,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { newId, type Playbook, type PlaybookRun } from "@/lib/runmark/model";
import { BlobImage } from "./blob-image";

type Props = {
  playbook: Playbook;
  run: PlaybookRun;
  onSaveRun: (run: PlaybookRun) => Promise<void>;
  onExit: () => void;
  onEdit: () => void;
  onRestart: () => Promise<void>;
};

export function RunnerView({ playbook, run, onSaveRun, onExit, onEdit, onRestart }: Props) {
  const activeSteps = useMemo(() => playbook.steps.filter((step) => !step.condition || run.values[step.condition.variableKey] === step.condition.equals), [playbook.steps, run.values]);
  const currentIndex = Math.max(0, activeSteps.findIndex((step) => step.id === run.currentStepId));
  const step = activeSteps[currentIndex] ?? activeSteps[0];
  const allVariables = playbook.steps.flatMap((item) => item.variables.map((variable) => ({ ...variable, stepId: item.id, stepTitle: item.title })));

  useEffect(() => {
    if (step && run.currentStepId !== step.id) {
      void persist({ ...run, currentStepId: step.id });
    }
    // This only repairs a current step that disappeared because a branch answer changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  if (!step) {
    return <section className="grid min-h-[calc(100vh-65px)] place-items-center p-6"><div className="text-center"><h1 className="text-xl font-bold">This playbook has no runnable steps</h1><Button onClick={onEdit} className="mt-4">Edit playbook</Button></div></section>;
  }

  const checkedForStep = run.checked[step.id] ?? [];
  const requiredVariables = step.variables.filter((variable) => variable.required);
  const missingVariables = requiredVariables.filter((variable) => !run.values[variable.key]?.trim());
  const checksComplete = step.checks.every((check) => checkedForStep.includes(check.id));
  const canContinue = missingVariables.length === 0 && checksComplete;
  const completedSteps = activeSteps.filter((item) => item.checks.every((check) => (run.checked[item.id] ?? []).includes(check.id)) && item.variables.filter((variable) => variable.required).every((variable) => run.values[variable.key]?.trim())).length;
  const progress = run.status === "completed" ? 100 : Math.round((completedSteps / Math.max(activeSteps.length, 1)) * 100);

  async function persist(next: PlaybookRun) {
    await onSaveRun({ ...next, updatedAt: new Date().toISOString() });
  }

  function setValue(key: string, value: string) {
    void persist({ ...run, values: { ...run.values, [key]: value } });
  }

  function toggleCheck(id: string, value: boolean) {
    const current = run.checked[step.id] ?? [];
    void persist({
      ...run,
      checked: {
        ...run.checked,
        [step.id]: value ? [...new Set([...current, id])] : current.filter((item) => item !== id),
      },
    });
  }

  function goTo(index: number) {
    const next = activeSteps[index];
    if (!next) return;
    void persist({ ...run, currentStepId: next.id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueRun() {
    if (!canContinue) return;
    if (currentIndex === activeSteps.length - 1) {
      void persist({ ...run, status: "completed", completedAt: new Date().toISOString() });
    } else {
      goTo(currentIndex + 1);
    }
  }

  function addEvidence(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    void persist({
      ...run,
      evidence: {
        ...run.evidence,
        [step.id]: [
          ...(run.evidence[step.id] ?? []),
          ...files.map((file) => ({ id: newId("evidence"), name: file.name, type: file.type, blob: file })),
        ],
      },
    });
    event.target.value = "";
  }

  return (
    <section className="min-h-[calc(100vh-65px)]">
      <div className="border-b border-[#d6dee6] bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" onClick={onExit} aria-label="Back to library"><ArrowLeft /></Button><div className="min-w-0"><div className="flex items-center gap-2"><Badge className={run.status === "completed" ? "bg-[#dff7f1] text-[#107367]" : "bg-[#e8f3f5] text-[#176b73]"}>{run.status}</Badge><span className="text-xs text-[#75889a]">Run started {new Date(run.startedAt).toLocaleDateString()}</span></div><h1 className="mt-1 truncate text-lg font-bold">{playbook.title}</h1></div></div>
          <div className="flex items-center gap-3 lg:w-[420px]"><Progress value={progress} className="bg-[#dce4eb] [&_[data-slot=progress-indicator]]:bg-[#168a7c]" /><span className="w-10 text-right text-xs font-bold tabular-nums text-[#52697e]">{progress}%</span><Button variant="outline" size="sm" onClick={onEdit}><Pencil /> Edit</Button></div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_320px]">
        <aside className="border-b border-[#d6dee6] bg-[#f7f9fb] lg:min-h-[calc(100vh-138px)] lg:border-b-0 lg:border-r">
          <nav aria-label="Run steps" className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
            {activeSteps.map((item, index) => {
              const complete = item.checks.every((check) => (run.checked[item.id] ?? []).includes(check.id)) && item.variables.filter((variable) => variable.required).every((variable) => run.values[variable.key]?.trim());
              const active = item.id === step.id;
              return <button type="button" key={item.id} onClick={() => goTo(index)} aria-current={active ? "step" : undefined} className={`flex min-w-56 items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:w-full lg:min-w-0 ${active ? "bg-[#102033] text-white" : "text-[#40566c] hover:bg-[#e8edf2]"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${complete ? "border-[#168a7c] bg-[#dff7f1] text-[#107367]" : active ? "border-white/25 bg-white/10" : "border-[#cbd6df] bg-white"}`}>{complete ? <Check className="size-3.5 stroke-[3]" /> : index + 1}</span><span className="min-w-0"><span className={`block text-[10px] font-bold uppercase tracking-[0.1em] ${active ? "text-[#8de4d3]" : "text-[#7b8d9d]"}`}>{item.type}</span><span className="block truncate text-sm font-semibold">{item.title}</span></span></button>;
            })}
          </nav>
        </aside>

        <div className="min-w-0 px-4 py-7 sm:px-7 lg:px-10">
          <div className="mx-auto max-w-3xl">
            {run.status === "completed" && (
              <div className="mb-6 rounded-2xl border border-[#8fd4c7] bg-[#effbf8] p-5 text-center"><CheckCircle2 className="mx-auto size-8 text-[#168a7c]" /><h2 className="mt-2 text-xl font-bold text-[#145e55]">Run complete</h2><p className="mt-1 text-sm text-[#48766f]">Every active step passed its required gates.</p></div>
            )}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#168a7c]">Step {currentIndex + 1} of {activeSteps.length}</span>{step.context && <><span className="text-[#9cacba]">·</span><span className="text-sm font-medium text-[#60758a]">{step.context}</span></>}</div>
              <h2 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">{step.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-[#52697e]">{step.instructions}</p>
            </div>

            {step.warning && <div className="mb-5 flex gap-3 rounded-xl border border-[#efc977] bg-[#fff8e8] p-4 text-[#6c4b0c]"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-bold">Important warning</p><p className="mt-1 text-sm leading-6">{step.warning}</p></div></div>}

            {step.attachments.length > 0 && <section className="mb-5"><h3 className="mb-3 text-sm font-bold text-[#40566c]">Reference screenshots</h3><div className="grid gap-3 sm:grid-cols-2">{step.attachments.map((image) => <figure key={image.id} className="overflow-hidden rounded-xl border border-[#d6dee6] bg-white"><BlobImage blob={image.blob} alt={image.name} className="aspect-video w-full object-cover" /><figcaption className="truncate px-3 py-2 text-xs text-[#60758a]">{image.name}</figcaption></figure>)}</div></section>}

            <section className="overflow-hidden rounded-2xl border border-[#d6dee6] bg-white shadow-[0_8px_32px_rgb(16_32_51/6%)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#e0e6eb] px-5 py-4 sm:px-6"><h3 className="font-bold">Required checks</h3><Badge variant="outline">{checkedForStep.length}/{step.checks.length} complete</Badge></div>
              {step.checks.length === 0 ? <p className="px-6 py-7 text-center text-sm text-[#75889a]">No checklist items for this step.</p> : <div className="divide-y divide-[#e7ecf0]">{step.checks.map((item) => { const value = checkedForStep.includes(item.id); return <label key={item.id} className={`flex cursor-pointer gap-4 px-5 py-4 sm:px-6 ${value ? "bg-[#f4fbf9]" : "hover:bg-[#f8fafb]"}`}><Checkbox checked={value} onCheckedChange={(checked) => toggleCheck(item.id, checked === true)} className="mt-0.5 size-5 data-[state=checked]:border-[#168a7c] data-[state=checked]:bg-[#168a7c]" /><span><span className={`block text-[15px] font-semibold ${value ? "text-[#17685e] line-through decoration-[#83b8ae]" : "text-[#253b50]"}`}>{item.label}</span>{item.detail && <span className="mt-1 block text-sm leading-5 text-[#6c7f91]">{item.detail}</span>}</span></label>; })}</div>}
            </section>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#d6dee6] bg-white p-5"><label htmlFor="run-notes" className="text-sm font-bold">Run notes</label><p className="mb-3 mt-1 text-xs leading-5 text-[#75889a]">Saved automatically in this browser.</p><Textarea id="run-notes" value={run.notes[step.id] ?? ""} onChange={(event) => void persist({ ...run, notes: { ...run.notes, [step.id]: event.target.value } })} placeholder="Record observations or rollback details…" className="min-h-28 resize-none" /></div>
              <div className="rounded-2xl border border-[#d6dee6] bg-white p-5"><p className="text-sm font-bold">Run evidence</p><p className="mb-3 mt-1 text-xs leading-5 text-[#75889a]">Persisted with this local run.</p><label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#aebdca] bg-[#f8fafb] px-4 text-center hover:border-[#168a7c] hover:bg-[#f1faf8]"><ImagePlus className="mb-2 size-5 text-[#168a7c]" /><span className="text-sm font-semibold text-[#375067]">Add evidence</span><input className="sr-only" type="file" accept="image/*" multiple onChange={addEvidence} /></label></div>
            </div>

            {(run.evidence[step.id] ?? []).length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{(run.evidence[step.id] ?? []).map((image) => <figure key={image.id} className="group relative overflow-hidden rounded-xl border border-[#d6dee6] bg-white"><BlobImage blob={image.blob} alt={image.name} className="aspect-video w-full object-cover" /><figcaption className="truncate px-3 py-2 text-xs text-[#60758a]">{image.name}</figcaption><button type="button" onClick={() => void persist({ ...run, evidence: { ...run.evidence, [step.id]: (run.evidence[step.id] ?? []).filter((item) => item.id !== image.id) } })} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#102033]/85 text-white" aria-label={`Remove ${image.name}`}><X className="size-4" /></button></figure>)}</div>}

            <div className="mt-6 lg:hidden"><VariablePanel variables={allVariables} currentStepId={step.id} values={run.values} onChange={setValue} /></div>

            <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#d6dee6] pt-6 sm:flex-row sm:items-center">
              <Button variant="ghost" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}><ArrowLeft /> Previous</Button>
              <div className="text-center sm:text-right">{!canContinue && run.status !== "completed" && <p className="mb-2 text-xs font-medium text-[#8b5f13]">{missingVariables.length ? `${missingVariables.length} required variable${missingVariables.length > 1 ? "s" : ""} missing` : "Complete every required check"}</p>}<Button onClick={continueRun} disabled={!canContinue || run.status === "completed"} className="h-11 w-full bg-[#168a7c] px-5 text-white hover:bg-[#107367] sm:w-auto">{currentIndex === activeSteps.length - 1 ? "Complete run" : "Continue"}{currentIndex < activeSteps.length - 1 && <ChevronRight />}</Button></div>
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-[#d6dee6] bg-[#f7f9fb] p-5 lg:block"><VariablePanel variables={allVariables} currentStepId={step.id} values={run.values} onChange={setValue} /><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" className="mt-4 w-full text-[#60758a]"><RotateCcw /> Start fresh run</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Start this run again?</AlertDialogTitle><AlertDialogDescription>All checked items, variable values, notes, and evidence from the current local run will be deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current run</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onRestart}>Start fresh</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></aside>
      </div>
    </section>
  );
}

function VariablePanel({ variables, currentStepId, values, onChange }: { variables: Array<{ id: string; key: string; label: string; type: "text" | "choice"; placeholder: string; options: string[]; required: boolean; stepId: string; stepTitle: string }>; currentStepId: string; values: Record<string, string>; onChange: (key: string, value: string) => void }) {
  return <section className="rounded-2xl border border-[#d6dee6] bg-white shadow-[0_8px_32px_rgb(16_32_51/5%)] lg:sticky lg:top-20"><div className="flex gap-3 border-b border-[#e0e6eb] px-5 py-4"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff1cf] text-[#8b5f13]"><ClipboardCheck className="size-4" /></span><div><h3 className="text-sm font-bold">Critical variables</h3><p className="mt-1 text-xs leading-5 text-[#75889a]">Values are reused throughout this run.</p></div></div><div className="max-h-[calc(100vh-240px)] space-y-3 overflow-y-auto p-4">{variables.length === 0 && <p className="py-6 text-center text-xs text-[#75889a]">This playbook has no variables.</p>}{variables.map((variable) => { const active = variable.stepId === currentStepId; const complete = Boolean(values[variable.key]?.trim()); return <div key={variable.id} className={`rounded-xl border p-3 ${active ? "border-[#79c9ba] bg-[#f1faf8]" : "border-transparent bg-[#f5f7f9]"}`}><label htmlFor={`run-${variable.id}`} className="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-[#40566c]"><span>{variable.label}{variable.required && <span className="text-[#b63442]"> *</span>}</span>{complete ? <CheckCircle2 className="size-4 shrink-0 text-[#168a7c]" /> : <Circle className="size-4 shrink-0 text-[#a8b5c0]" />}</label>{variable.type === "choice" ? <NativeSelect id={`run-${variable.id}`} value={values[variable.key] ?? ""} onChange={(event) => onChange(variable.key, event.target.value)} className="w-full bg-white"><NativeSelectOption value="">{variable.placeholder || "Choose"}</NativeSelectOption>{variable.options.map((option) => <NativeSelectOption key={option} value={option}>{option}</NativeSelectOption>)}</NativeSelect> : <Input id={`run-${variable.id}`} value={values[variable.key] ?? ""} onChange={(event) => onChange(variable.key, event.target.value)} placeholder={variable.placeholder} className="bg-white font-mono text-xs" autoComplete="off" />}<p className="mt-2 truncate text-[11px] text-[#7b8d9d]">{active ? "Required in this step" : variable.stepTitle}</p></div>; })}</div></section>;
}
