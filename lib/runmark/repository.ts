import type { Playbook, PlaybookRun } from "./model";
import { transitGatewayPlaybook } from "./seed";

export interface PlaybookRepository {
  listPlaybooks(): Promise<Playbook[]>;
  getPlaybook(id: string): Promise<Playbook | undefined>;
  savePlaybook(playbook: Playbook): Promise<void>;
  deletePlaybook(id: string): Promise<void>;
  getRun(playbookId: string): Promise<PlaybookRun | undefined>;
  saveRun(run: PlaybookRun): Promise<void>;
  deleteRun(playbookId: string): Promise<void>;
}

const databaseName = "runmark";
const databaseVersion = 1;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("playbooks")) {
        database.createObjectStore("playbooks", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("runs")) {
        const runs = database.createObjectStore("runs", { keyPath: "id" });
        runs.createIndex("playbookId", "playbookId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class IndexedDbPlaybookRepository implements PlaybookRepository {
  async listPlaybooks() {
    const database = await openDatabase();
    const items = await requestResult(database.transaction("playbooks").objectStore("playbooks").getAll()) as Playbook[];
    database.close();
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getPlaybook(id: string) {
    const database = await openDatabase();
    const item = await requestResult(database.transaction("playbooks").objectStore("playbooks").get(id)) as Playbook | undefined;
    database.close();
    return item;
  }

  async savePlaybook(playbook: Playbook) {
    const database = await openDatabase();
    const transaction = database.transaction("playbooks", "readwrite");
    transaction.objectStore("playbooks").put(playbook);
    await transactionDone(transaction);
    database.close();
  }

  async deletePlaybook(id: string) {
    const database = await openDatabase();
    const playbookTransaction = database.transaction("playbooks", "readwrite");
    playbookTransaction.objectStore("playbooks").delete(id);
    await transactionDone(playbookTransaction);
    const keys = await requestResult(database.transaction("runs").objectStore("runs").index("playbookId").getAllKeys(id));
    const runTransaction = database.transaction("runs", "readwrite");
    keys.forEach((key) => runTransaction.objectStore("runs").delete(key));
    await transactionDone(runTransaction);
    database.close();
  }

  async getRun(playbookId: string) {
    const database = await openDatabase();
    const runs = await requestResult(database.transaction("runs").objectStore("runs").index("playbookId").getAll(playbookId)) as PlaybookRun[];
    database.close();
    return runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  async saveRun(run: PlaybookRun) {
    const database = await openDatabase();
    const transaction = database.transaction("runs", "readwrite");
    transaction.objectStore("runs").put(run);
    await transactionDone(transaction);
    database.close();
  }

  async deleteRun(playbookId: string) {
    const database = await openDatabase();
    const keys = await requestResult(database.transaction("runs").objectStore("runs").index("playbookId").getAllKeys(playbookId));
    const transaction = database.transaction("runs", "readwrite");
    keys.forEach((key) => transaction.objectStore("runs").delete(key));
    await transactionDone(transaction);
    database.close();
  }
}

export const playbookRepository = new IndexedDbPlaybookRepository();

export async function initializePlaybooks() {
  const playbooks = await playbookRepository.listPlaybooks();
  if (playbooks.length > 0) return playbooks;
  if (window.localStorage.getItem("runmark:seeded") === "true") return [];
  await playbookRepository.savePlaybook(structuredClone(transitGatewayPlaybook));
  window.localStorage.setItem("runmark:seeded", "true");
  return playbookRepository.listPlaybooks();
}
