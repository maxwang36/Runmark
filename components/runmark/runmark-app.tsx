"use client";

import { BookOpen, Check, CloudOff, Database, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { clonePlaybook, createPlaybook, createRun, type Playbook, type PlaybookRun } from "@/lib/runmark/model";
import { downloadText, parsePlaybookFile, safeFilename, serializePlaybook } from "@/lib/runmark/import-export";
import { initializePlaybooks, playbookRepository } from "@/lib/runmark/repository";
import { BuilderView } from "./builder-view";
import { LibraryView } from "./library-view";
import { RunnerView } from "./runner-view";

type View = "library" | "builder" | "runner";

export function RunmarkApp() {
  const [view, setView] = useState<View>("library");
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [activePlaybook, setActivePlaybook] = useState<Playbook | null>(null);
  const [activeRun, setActiveRun] = useState<PlaybookRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    initializePlaybooks()
      .then(setPlaybooks)
      .catch(() => setError("Runmark could not open browser storage. Check that IndexedDB is available."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function refresh() {
    setPlaybooks(await playbookRepository.listPlaybooks());
  }

  async function createNew() {
    const playbook = createPlaybook();
    await playbookRepository.savePlaybook(playbook);
    await refresh();
    setActivePlaybook(playbook);
    setView("builder");
  }

  function edit(playbook: Playbook) {
    setActivePlaybook(structuredClone(playbook));
    setView("builder");
  }

  async function save(playbook: Playbook) {
    const next = { ...playbook, updatedAt: new Date().toISOString() };
    await playbookRepository.savePlaybook(next);
    setActivePlaybook(next);
    await refresh();
    setNotice("Playbook saved locally");
  }

  async function startRun(playbook: Playbook) {
    const saved = await playbookRepository.getRun(playbook.id);
    const run = saved && saved.playbookVersion === playbook.version ? saved : createRun(playbook);
    if (!saved || saved.playbookVersion !== playbook.version) await playbookRepository.saveRun(run);
    setActivePlaybook(playbook);
    setActiveRun(run);
    setView("runner");
  }

  async function saveRun(run: PlaybookRun) {
    setActiveRun(run);
    await playbookRepository.saveRun(run);
  }

  async function restartRun(playbook: Playbook) {
    await playbookRepository.deleteRun(playbook.id);
    const run = createRun(playbook);
    await playbookRepository.saveRun(run);
    setActiveRun(run);
    setNotice("Started a fresh run");
  }

  async function duplicate(playbook: Playbook) {
    const copy = clonePlaybook(playbook);
    await playbookRepository.savePlaybook(copy);
    await refresh();
    setNotice("Playbook duplicated");
  }

  async function remove(playbook: Playbook) {
    await playbookRepository.deletePlaybook(playbook.id);
    await refresh();
    setNotice("Playbook deleted");
  }

  async function exportPlaybook(playbook: Playbook) {
    downloadText(`${safeFilename(playbook.title)}.runmark.json`, await serializePlaybook(playbook));
    setNotice("Playbook exported");
  }

  async function importPlaybook(file: File) {
    try {
      const playbook = await parsePlaybookFile(file);
      await playbookRepository.savePlaybook(playbook);
      await refresh();
      setNotice("Playbook imported");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The playbook could not be imported.");
    }
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#eef2f6]"><div className="text-center text-[#52697e]"><LoaderCircle className="mx-auto size-7 animate-spin text-[#168a7c]" /><p className="mt-3 text-sm font-semibold">Opening your playbooks…</p></div></main>;
  }

  if (error && playbooks.length === 0) {
    return <main className="grid min-h-screen place-items-center bg-[#eef2f6] p-6"><div className="max-w-md rounded-2xl border border-[#efc4c9] bg-white p-7 text-center"><CloudOff className="mx-auto size-8 text-[#b63442]" /><h1 className="mt-4 text-xl font-bold">Local storage unavailable</h1><p className="mt-2 text-sm leading-6 text-[#60758a]">{error}</p><Button className="mt-5" onClick={() => window.location.reload()}>Try again</Button></div></main>;
  }

  return (
    <main className="min-h-screen bg-[#eef2f6] text-[#102033]">
      <header className="sticky top-0 z-40 border-b border-[#23384d] bg-[#102033] text-white shadow-sm">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setView("library")} className="flex items-center gap-3 text-left">
            <span className="grid size-9 place-items-center rounded-xl bg-[#39d0b5] text-[#102033]"><Check className="size-5 stroke-[3]" /></span>
            <span><span className="block text-[15px] font-bold tracking-[-0.02em]">Runmark</span><span className="block text-xs text-[#aab9c9]">Local workspace</span></span>
          </button>
          <nav aria-label="Workspace" className="flex items-center rounded-xl bg-white/8 p-1">
            <Button variant="ghost" size="sm" onClick={() => setView("library")} className={view === "library" ? "bg-white text-[#102033] hover:bg-white" : "text-[#cbd7e1] hover:bg-white/10 hover:text-white"}><BookOpen /> <span className="hidden sm:inline">Library</span></Button>
            {activePlaybook && view !== "library" && <span className="max-w-40 truncate px-3 text-xs font-semibold text-[#aab9c9]">{activePlaybook.title}</span>}
          </nav>
          <div className="hidden items-center gap-2 text-xs font-semibold text-[#aab9c9] sm:flex"><Database className="size-4 text-[#39d0b5]" /> IndexedDB</div>
        </div>
      </header>

      {notice && <div role="status" className="fixed right-4 top-20 z-50 rounded-xl bg-[#102033] px-4 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
      {error && playbooks.length > 0 && <button type="button" onClick={() => setError("")} className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-[#efc4c9] bg-white px-4 py-3 text-left text-sm text-[#8f2934] shadow-xl">{error}</button>}

      {view === "library" && <LibraryView playbooks={playbooks} onCreate={createNew} onEdit={edit} onRun={startRun} onDuplicate={duplicate} onDelete={remove} onExport={exportPlaybook} onImport={importPlaybook} />}
      {view === "builder" && activePlaybook && <BuilderView playbook={activePlaybook} onSave={save} onClose={() => setView("library")} onRun={async (playbook) => { await save(playbook); await startRun(playbook); }} />}
      {view === "runner" && activePlaybook && activeRun && <RunnerView playbook={activePlaybook} run={activeRun} onSaveRun={saveRun} onExit={() => setView("library")} onEdit={() => edit(activePlaybook)} onRestart={() => restartRun(activePlaybook)} />}
    </main>
  );
}
