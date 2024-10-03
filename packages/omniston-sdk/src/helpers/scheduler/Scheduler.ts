import { Timer } from "../timer/Timer";
import type { ITimer, Timeout } from "../timer/Timer.types";
import type { IScheduler } from "./Scheduler.types";
import type { TaskController } from "./TaskController";

/**
 * Helper class to schedule and cancel tasks.
 */
export class Scheduler implements IScheduler {
  private readonly timeouts = new Set<Timeout>();
  private readonly timer: ITimer;

  constructor(timer?: ITimer) {
    this.timer = timer ?? new Timer();
  }

  schedule(task: () => void, afterMs: number): TaskController {
    const taskTimeout = this.timer.setTimeout(() => {
      task.call(undefined);
      this.timeouts.delete(taskTimeout);
    }, afterMs);
    this.timeouts.add(taskTimeout);
    return {
      cancel: () => {
        this.timer.clearTimeout(taskTimeout);
        this.timeouts.delete(taskTimeout);
      },
    };
  }

  cancelAllTasks(): void {
    for (const taskTimeout of this.timeouts) {
      this.timer.clearTimeout(taskTimeout);
    }
    this.timeouts.clear();
  }
}
