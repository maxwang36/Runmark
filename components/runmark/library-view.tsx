"use client";

import {
  BookOpen,
  Copy,
  Download,
  FileJson,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { ChangeEvent, useRef } from "react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Playbook } from "@/lib/runmark/model";

type Props = {
  playbooks: Playbook[];
  onCreate: () => void;
  onEdit: (playbook: Playbook) => void;
  onRun: (playbook: Playbook) => void;
  onDuplicate: (playbook: Playbook) => void;
  onDelete: (playbook: Playbook) => void;
  onExport: (playbook: Playbook) => void;
  onImport: (file: File) => void;
};

export function LibraryView({ playbooks, onCreate, onEdit, onRun, onDuplicate, onDelete, onExport, onImport }: Props) {
  const importRef = useRef<HTMLInputElement>(null);

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = "";
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#168a7c]">Playbook library</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#102033]">Your workflows</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-[#60758a]">Build repeatable procedures, keep the important values visible, and run every workflow with confidence.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" onChange={handleImport} />
          <Button variant="outline" onClick={() => importRef.current?.click()} className="border-[#cbd6df] bg-white">
            <Upload /> Import
          </Button>
          <Button onClick={onCreate} className="bg-[#168a7c] text-white hover:bg-[#107367]">
            <Plus /> New playbook
          </Button>
        </div>
      </div>

      {playbooks.length === 0 ? (
        <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-[#b8c5d0] bg-white p-8 text-center">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#dff7f1] text-[#107367]"><BookOpen /></div>
            <h2 className="mt-4 text-lg font-bold">Create your first playbook</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#60758a]">Start from a blank workflow or import a Runmark JSON backup.</p>
            <Button onClick={onCreate} className="mt-5 bg-[#168a7c] text-white hover:bg-[#107367]"><Plus /> New playbook</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {playbooks.map((playbook) => {
            const variables = playbook.steps.reduce((count, step) => count + step.variables.length, 0);
            const attachments = playbook.steps.reduce((count, step) => count + step.attachments.length, 0);
            return (
              <article key={playbook.id} className="flex min-h-64 flex-col rounded-2xl border border-[#d6dee6] bg-white p-5 shadow-[0_8px_30px_rgb(16_32_51/5%)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgb(16_32_51/9%)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#e8f3f5] text-[#176b73]"><BookOpen className="size-5" /></div>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`More actions for ${playbook.title}`}><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(playbook)}><Pencil /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(playbook)}><Copy /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport(playbook)}><Download /> Export JSON</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem variant="destructive" onSelect={(event) => event.preventDefault()}><Trash2 /> Delete</DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{playbook.title}”?</AlertDialogTitle>
                        <AlertDialogDescription>This removes the playbook and its saved local run. Export it first if you may need it later.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep playbook</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => onDelete(playbook)}>Delete permanently</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <Badge variant={playbook.status === "ready" ? "default" : "secondary"} className={playbook.status === "ready" ? "bg-[#dff7f1] text-[#107367]" : ""}>{playbook.status}</Badge>
                  <span className="text-xs text-[#7b8d9d]">Version {playbook.version}</span>
                </div>
                <h2 className="mt-3 text-xl font-bold tracking-[-0.025em] text-[#102033]">{playbook.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#60758a]">{playbook.description || "No description yet."}</p>
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5 text-xs font-medium text-[#6c7f91]">
                  <span>{playbook.steps.length} steps</span>
                  <span>{variables} variables</span>
                  <span>{attachments} images</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#e4e9ee] pt-4">
                  <Button variant="outline" onClick={() => onEdit(playbook)} className="border-[#cbd6df]"><Pencil /> Edit</Button>
                  <Button onClick={() => onRun(playbook)} className="bg-[#102033] text-white hover:bg-[#24394e]"><Play /> Run</Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-xs text-[#75889a]">
        <FileJson className="size-4" /> Playbooks and screenshots are stored in this browser using IndexedDB.
      </div>
    </section>
  );
}
