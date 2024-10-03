import type { TaskController } from "./TaskController";

export interface IScheduler {
  schedule(task: () => void, afterMs: number): TaskController;
  cancelAllTasks(): void;
}
