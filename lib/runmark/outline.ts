import { createStep, type PlaybookStep } from "./model";

export function parseOutline(value: string): PlaybookStep[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const cleaned = line.replace(/^(?:\d+[.)]|[-*•])\s*/, "").trim();
      const next = createStep(index + 1, cleaned || `Step ${index + 1}`);
      next.instructions = cleaned;
      return next;
    });
}
