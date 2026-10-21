"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckSquare,
  ChevronRight,
  ImagePlus,
  ListPlus,
  Plus,
  Save,
  Settings2,
  Trash2,
  Variable,
  X,
} from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { createCheck, createStep, createVariable, newId, type Playbook, type PlaybookStep } from "@/lib/runmark/model";
import { parseOutline } from "@/lib/runmark/outline";
import { BlobImage } from "./blob-image";

type Props = {
  playbook: Playbook;
  onSave: (playbook: Playbook) => Promise<void>;
  onClose: () => void;
  onRun: (playbook: Playbook) => Promise<void>;
};

export function BuilderView({ playbook, onSave, onClose, onRun }: Props) {
  const [draft, setDraft] = useState<Playbook>(() => structuredClone(playbook));
  const [selectedStepId, setSelectedStepId] = useState(playbook.steps[0]?.id ?? "");
  const [outline, setOutline] = useState("");
  const [showOutline, setShowOutline] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedIndex = Math.max(0, draft.steps.findIndex((step) => step.id === selectedStepId));
  const selected = draft.steps[selectedIndex];
  const allVariables = useMemo(() => draft.steps.flatMap((step) => step.variables), [draft.steps]);

  function updatePlaybook(patch: Partial<Playbook>) {
    setDraft((previous) => ({ ...previous, ...patch }));
  }

  function updateStep(patch: Partial<PlaybookStep>) {
    setDraft((previous) => ({
      ...previous,
      steps: previous.steps.map((step) => step.id === selectedStepId ? { ...step, ...patch } : step),
    }));
  }

  function addStep() {
    const next = createStep(draft.steps.length + 1);
    setDraft((previous) => ({ ...previous, steps: [...previous.steps, next] }));
    setSelectedStepId(next.id);
  }

  function addOutlineSteps() {
    const parsed = parseOutline(outline);
    if (!parsed.length) return;
    setDraft((previous) => ({ ...previous, steps: [...previous.steps, ...parsed] }));
    setSelectedStepId(parsed[0].id);
    setOutline("");
    setShowOutline(false);
  }

  function moveStep(direction: -1 | 1) {
    const target = selectedIndex + direction;
    if (target < 0 || target >= draft.steps.length) return;
    const steps = [...draft.steps];
    [steps[selectedIndex], steps[target]] = [steps[target], steps[selectedIndex]];
    updatePlaybook({ steps });
  }

  function deleteStep() {
    if (draft.steps.length === 1) return;
    const next = draft.steps.filter((step) => step.id !== selectedStepId);
    setDraft((previous) => ({ ...previous, steps: next }));
    setSelectedStepId(next[Math.min(selectedIndex, next.length - 1)].id);
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    updateStep({
      attachments: [
        ...selected.attachments,
        ...files.map((file) => ({ id: newId("image"), name: file.name, type: file.type, blob: file })),
      ],
    });
    event.target.value = "";
  }

  if (!selected) return null;

  return (
    <section className="min-h-[calc(100vh-65px)] bg-[#eef2f6]">
      <div className="border-b border-[#d6dee6] bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back to library"><ArrowLeft /></Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><Badge variant="secondary">Builder</Badge><span className="text-xs text-[#75889a]">Saved locally when you press Save</span></div>
              <h1 className="mt-1 truncate text-xl font-bold tracking-[-0.025em]">{draft.title || "Untitled playbook"}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={save} disabled={saving} className="border-[#cbd6df]"><Save /> {saving ? "Saving…" : "Save"}</Button>
            <Button onClick={() => onRun(draft)} className="bg-[#102033] text-white hover:bg-[#24394e]">Save and run <ChevronRight /></Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b border-[#d6dee6] bg-[#f7f9fb] xl:min-h-[calc(100vh-154px)] xl:border-b-0 xl:border-r">
          <div className="border-b border-[#d6dee6] p-4">
            <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#60758a]">Steps</p><Badge variant="outline">{draft.steps.length}</Badge></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" onClick={addStep} className="bg-[#168a7c] text-white hover:bg-[#107367]"><Plus /> Add step</Button>
              <Button size="sm" variant="outline" onClick={() => setShowOutline((value) => !value)} className="border-[#cbd6df] bg-white"><ListPlus /> Paste list</Button>
            </div>
            {showOutline && (
              <div className="mt-3 rounded-xl border border-[#cbd6df] bg-white p-3">
                <label htmlFor="outline" className="text-xs font-bold text-[#40566c]">One step per line</label>
                <Textarea id="outline" value={outline} onChange={(event) => setOutline(event.target.value)} placeholder={"1. Open the console\n2. Check the status\n3. Apply the change"} className="mt-2 min-h-28" />
                <Button size="sm" onClick={addOutlineSteps} disabled={!outline.trim()} className="mt-2 w-full bg-[#102033] text-white">Add to playbook</Button>
              </div>
            )}
          </div>
          <nav aria-label="Playbook steps" className="flex gap-2 overflow-x-auto p-3 xl:block xl:space-y-1 xl:overflow-visible">
            {draft.steps.map((step, index) => (
              <button type="button" key={step.id} onClick={() => setSelectedStepId(step.id)} className={`flex min-w-56 items-center gap-3 rounded-xl px-3 py-3 text-left transition xl:w-full xl:min-w-0 ${selectedStepId === step.id ? "bg-[#102033] text-white" : "text-[#40566c] hover:bg-[#e8edf2]"}`}>
                <span className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${selectedStepId === step.id ? "border-white/25 bg-white/10" : "border-[#cbd6df] bg-white"}`}>{index + 1}</span>
                <span className="min-w-0"><span className={`block text-[10px] font-bold uppercase tracking-[0.1em] ${selectedStepId === step.id ? "text-[#8de4d3]" : "text-[#7b8d9d]"}`}>{step.type}</span><span className="block truncate text-sm font-semibold">{step.title || "Untitled step"}</span></span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-2xl border border-[#d6dee6] bg-white p-5 shadow-[0_8px_30px_rgb(16_32_51/4%)] sm:p-6">
              <div className="mb-5 flex items-center gap-3"><Settings2 className="size-5 text-[#168a7c]" /><div><h2 className="font-bold">Playbook details</h2><p className="text-xs text-[#75889a]">Shown in your library and at the start of a run.</p></div></div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Title"><Input value={draft.title} onChange={(event) => updatePlaybook({ title: event.target.value })} placeholder="e.g. Database failover" /></Field>
                <Field label="Status"><NativeSelect value={draft.status} onChange={(event) => updatePlaybook({ status: event.target.value as Playbook["status"] })} className="w-full bg-white"><NativeSelectOption value="draft">Draft</NativeSelectOption><NativeSelectOption value="ready">Ready to run</NativeSelectOption></NativeSelect></Field>
                <Field label="Description" className="lg:col-span-2"><Textarea value={draft.description} onChange={(event) => updatePlaybook({ description: event.target.value })} placeholder="What does this workflow accomplish?" className="min-h-20" /></Field>
              </div>
            </section>

            <section className="rounded-2xl border border-[#d6dee6] bg-white p-5 shadow-[0_8px_30px_rgb(16_32_51/4%)] sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#168a7c]">Step {selectedIndex + 1}</p><h2 className="mt-1 text-xl font-bold">Step content</h2></div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => moveStep(-1)} disabled={selectedIndex === 0} aria-label="Move step up"><ArrowUp /></Button>
                  <Button variant="outline" size="icon" onClick={() => moveStep(1)} disabled={selectedIndex === draft.steps.length - 1} aria-label="Move step down"><ArrowDown /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline" size="icon" disabled={draft.steps.length === 1} aria-label="Delete step" className="text-[#b63442]"><Trash2 /></Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this step?</AlertDialogTitle><AlertDialogDescription>The checks, variables, conditions, and screenshots attached to it will also be removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteStep}>Delete step</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Step type"><NativeSelect value={selected.type} onChange={(event) => updateStep({ type: event.target.value as PlaybookStep["type"] })} className="w-full bg-white"><NativeSelectOption value="action">Action</NativeSelectOption><NativeSelectOption value="check">Verification</NativeSelectOption><NativeSelectOption value="decision">Decision</NativeSelectOption><NativeSelectOption value="warning">High-risk action</NativeSelectOption></NativeSelect></Field>
                <Field label="Account or context"><Input value={selected.context} onChange={(event) => updateStep({ context: event.target.value })} placeholder="e.g. Production account" /></Field>
                <Field label="Step title" className="lg:col-span-2"><Input value={selected.title} onChange={(event) => updateStep({ title: event.target.value })} placeholder="What should happen?" /></Field>
                <Field label="Instructions" className="lg:col-span-2"><Textarea value={selected.instructions} onChange={(event) => updateStep({ instructions: event.target.value })} placeholder="Give the operator enough detail to complete this step." className="min-h-28" /></Field>
                <Field label="Warning" hint="Leave empty when there is no special risk." className="lg:col-span-2"><Textarea value={selected.warning} onChange={(event) => updateStep({ warning: event.target.value })} placeholder="Explain the risk or required ordering." className="min-h-20" /></Field>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <EditorCard icon={<CheckSquare />} title="Required checks" description="Every item must be checked before the runner can continue." action={<Button size="sm" variant="outline" onClick={() => updateStep({ checks: [...selected.checks, createCheck(selected.checks.length + 1)] })}><Plus /> Add check</Button>}>
                <div className="space-y-3">
                  {selected.checks.length === 0 && <EmptyLine text="No checks yet. This step can advance after its required variables are filled." />}
                  {selected.checks.map((check, index) => (
                    <div key={check.id} className="rounded-xl border border-[#dce3e9] bg-[#f8fafb] p-3">
                      <div className="flex gap-2"><Input value={check.label} onChange={(event) => updateStep({ checks: selected.checks.map((item) => item.id === check.id ? { ...item, label: event.target.value } : item) })} aria-label={`Check ${index + 1} label`} /><Button variant="ghost" size="icon" onClick={() => updateStep({ checks: selected.checks.filter((item) => item.id !== check.id) })} aria-label={`Delete check ${index + 1}`}><X /></Button></div>
                      <Input value={check.detail} onChange={(event) => updateStep({ checks: selected.checks.map((item) => item.id === check.id ? { ...item, detail: event.target.value } : item) })} placeholder="Optional supporting detail" className="mt-2" aria-label={`Check ${index + 1} detail`} />
                    </div>
                  ))}
                </div>
              </EditorCard>

              <EditorCard icon={<Variable />} title="Critical variables" description="Values the operator must capture during this step." action={<Button size="sm" variant="outline" onClick={() => updateStep({ variables: [...selected.variables, createVariable(allVariables.length + 1)] })}><Plus /> Add variable</Button>}>
                <div className="space-y-3">
                  {selected.variables.length === 0 && <EmptyLine text="No variables are collected at this step." />}
                  {selected.variables.map((variable, index) => (
                    <div key={variable.id} className="rounded-xl border border-[#dce3e9] bg-[#f8fafb] p-3">
                      <div className="flex gap-2"><Input value={variable.label} onChange={(event) => updateStep({ variables: selected.variables.map((item) => item.id === variable.id ? { ...item, label: event.target.value } : item) })} aria-label={`Variable ${index + 1} label`} /><Button variant="ghost" size="icon" onClick={() => updateStep({ variables: selected.variables.filter((item) => item.id !== variable.id) })} aria-label={`Delete variable ${index + 1}`}><X /></Button></div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2"><Input value={variable.key} onChange={(event) => updateStep({ variables: selected.variables.map((item) => item.id === variable.id ? { ...item, key: event.target.value.replace(/\s+/g, "_") } : item) })} placeholder="variable_key" className="font-mono text-xs" aria-label={`Variable ${index + 1} key`} /><NativeSelect value={variable.type} onChange={(event) => updateStep({ variables: selected.variables.map((item) => item.id === variable.id ? { ...item, type: event.target.value as "text" | "choice" } : item) })} className="w-full bg-white"><NativeSelectOption value="text">Text</NativeSelectOption><NativeSelectOption value="choice">Choice</NativeSelectOption></NativeSelect></div>
                      <Input value={variable.placeholder} onChange={(event) => updateStep({ variables: selected.variables.map((item) => item.id === variable.id ? { ...item, placeholder: event.target.value } : item) })} placeholder="Prompt or example" className="mt-2" aria-label={`Variable ${index + 1} placeholder`} />
                      {variable.type === "choice" && <Input value={variable.options.join(", ")} onChange={(event) => updateStep({ variables: selected.variables.map((item) => item.id === variable.id ? { ...item, options: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) } : item) })} placeholder="Yes, No" className="mt-2" aria-label={`Variable ${index + 1} choices`} />}
                      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#52697e]"><Checkbox checked={variable.required} onCheckedChange={(value) => updateStep({ variables: selected.variables.map((item) => item.id === variable.id ? { ...item, required: value === true } : item) })} /> Required before continuing</label>
                    </div>
                  ))}
                </div>
              </EditorCard>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <EditorCard icon={<AlertTriangle />} title="Conditional branch" description="Show this step only when a previous answer matches." >
                <div className="space-y-3">
                  <NativeSelect value={selected.condition?.variableKey ?? ""} onChange={(event) => updateStep({ condition: event.target.value ? { variableKey: event.target.value, equals: selected.condition?.equals ?? "" } : null })} className="w-full bg-white">
                    <NativeSelectOption value="">Always show this step</NativeSelectOption>
                    {allVariables.filter((variable) => !selected.variables.some((current) => current.id === variable.id)).map((variable) => <NativeSelectOption key={variable.id} value={variable.key}>{variable.label} ({variable.key})</NativeSelectOption>)}
                  </NativeSelect>
                  {selected.condition && <Input value={selected.condition.equals} onChange={(event) => updateStep({ condition: { ...selected.condition!, equals: event.target.value } })} placeholder="Expected value, e.g. No" aria-label="Condition expected value" />}
                </div>
              </EditorCard>

              <EditorCard icon={<ImagePlus />} title="Reference screenshots" description="Images saved with the playbook and shown during every run." >
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#aebdca] bg-[#f8fafb] px-4 py-4 text-sm font-semibold text-[#375067] hover:border-[#168a7c] hover:bg-[#f1faf8]"><ImagePlus className="size-4 text-[#168a7c]" /> Add screenshots<input type="file" accept="image/*" multiple className="sr-only" onChange={addImages} /></label>
                {selected.attachments.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2">{selected.attachments.map((image) => <figure key={image.id} className="group relative overflow-hidden rounded-lg border border-[#d6dee6]"><BlobImage blob={image.blob} alt={image.name} className="aspect-video w-full object-cover" /><button type="button" onClick={() => updateStep({ attachments: selected.attachments.filter((item) => item.id !== image.id) })} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-[#102033]/85 text-white" aria-label={`Remove ${image.name}`}><X className="size-4" /></button></figure>)}</div>}
              </EditorCard>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-sm font-bold text-[#40566c]">{label}</span>{children}{hint && <span className="mt-1.5 block text-xs text-[#7b8d9d]">{hint}</span>}</label>;
}

function EditorCard({ icon, title, description, action, children }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#d6dee6] bg-white p-5 shadow-[0_8px_30px_rgb(16_32_51/4%)]"><div className="mb-4 flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#dff7f1] text-[#107367] [&_svg]:size-4">{icon}</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-[#75889a]">{description}</p></div></div>{action}</div>{children}</section>;
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-[#cbd6df] bg-[#f8fafb] px-4 py-5 text-center text-xs leading-5 text-[#75889a]">{text}</p>;
}
