import type { Playbook, StoredImage } from "./model";

type PortableImage = Omit<StoredImage, "blob"> & { dataUrl: string };
type PortablePlaybook = Omit<Playbook, "steps"> & {
  format: "runmark-playbook";
  formatVersion: 1;
  steps: Array<Omit<Playbook["steps"][number], "attachments"> & { attachments: PortableImage[] }>;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function serializePlaybook(playbook: Playbook) {
  const portable: PortablePlaybook = {
    ...playbook,
    format: "runmark-playbook",
    formatVersion: 1,
    steps: await Promise.all(playbook.steps.map(async (step) => ({
      ...step,
      attachments: await Promise.all(step.attachments.map(async ({ blob, ...attachment }) => ({
        ...attachment,
        dataUrl: await blobToDataUrl(blob),
      }))),
    }))),
  };
  return JSON.stringify(portable, null, 2);
}

export async function parsePlaybookFile(file: File): Promise<Playbook> {
  const parsed = JSON.parse(await file.text()) as PortablePlaybook;
  if (parsed.format !== "runmark-playbook" || parsed.formatVersion !== 1 || !Array.isArray(parsed.steps)) {
    throw new Error("This is not a supported Runmark playbook file.");
  }
  const now = new Date().toISOString();
  return {
    ...parsed,
    id: `playbook-${crypto.randomUUID()}`,
    title: `${parsed.title} import`,
    createdAt: now,
    updatedAt: now,
    steps: await Promise.all(parsed.steps.map(async (step) => ({
      ...step,
      attachments: await Promise.all(step.attachments.map(async ({ dataUrl, ...attachment }) => ({
        ...attachment,
        blob: await (await fetch(dataUrl)).blob(),
      }))),
    }))),
  };
}

export function downloadText(filename: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "playbook";
}
