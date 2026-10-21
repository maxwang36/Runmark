export type StepType = "action" | "check" | "decision" | "warning";
export type VariableType = "text" | "choice";

export type StoredImage = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
};

export type CheckItem = {
  id: string;
  label: string;
  detail: string;
};

export type VariableDefinition = {
  id: string;
  key: string;
  label: string;
  type: VariableType;
  placeholder: string;
  options: string[];
  required: boolean;
};

export type StepCondition = {
  variableKey: string;
  equals: string;
};

export type PlaybookStep = {
  id: string;
  type: StepType;
  title: string;
  instructions: string;
  context: string;
  warning: string;
  checks: CheckItem[];
  variables: VariableDefinition[];
  condition: StepCondition | null;
  attachments: StoredImage[];
};

export type Playbook = {
  id: string;
  title: string;
  description: string;
  version: number;
  status: "draft" | "ready";
  createdAt: string;
  updatedAt: string;
  steps: PlaybookStep[];
};

export type RunStatus = "in-progress" | "completed";

export type PlaybookRun = {
  id: string;
  playbookId: string;
  playbookVersion: number;
  status: RunStatus;
  currentStepId: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  values: Record<string, string>;
  checked: Record<string, string[]>;
  notes: Record<string, string>;
  evidence: Record<string, StoredImage[]>;
};

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createVariable(index = 1): VariableDefinition {
  return {
    id: newId("variable"),
    key: `variable_${index}`,
    label: `Variable ${index}`,
    type: "text",
    placeholder: "Enter a value",
    options: [],
    required: true,
  };
}

export function createCheck(index = 1): CheckItem {
  return {
    id: newId("check"),
    label: `Check ${index}`,
    detail: "",
  };
}

export function createStep(index = 1, title?: string): PlaybookStep {
  return {
    id: newId("step"),
    type: "action",
    title: title || `Step ${index}`,
    instructions: "Describe what needs to happen in this step.",
    context: "",
    warning: "",
    checks: [],
    variables: [],
    condition: null,
    attachments: [],
  };
}

export function createPlaybook(title = "Untitled playbook"): Playbook {
  const now = new Date().toISOString();
  return {
    id: newId("playbook"),
    title,
    description: "",
    version: 1,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    steps: [createStep(1)],
  };
}

export function createRun(playbook: Playbook): PlaybookRun {
  const now = new Date().toISOString();
  return {
    id: newId("run"),
    playbookId: playbook.id,
    playbookVersion: playbook.version,
    status: "in-progress",
    currentStepId: playbook.steps[0]?.id ?? "",
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    values: {},
    checked: {},
    notes: {},
    evidence: {},
  };
}

export function clonePlaybook(playbook: Playbook): Playbook {
  const now = new Date().toISOString();
  return {
    ...structuredClone(playbook),
    id: newId("playbook"),
    title: `${playbook.title} copy`,
    status: "draft",
    version: 1,
    createdAt: now,
    updatedAt: now,
    steps: playbook.steps.map((step) => ({
      ...structuredClone(step),
      id: newId("step"),
      checks: step.checks.map((check) => ({ ...check, id: newId("check") })),
      variables: step.variables.map((variable) => ({ ...variable, id: newId("variable") })),
      attachments: step.attachments.map((attachment) => ({ ...attachment, id: newId("image") })),
    })),
  };
}
