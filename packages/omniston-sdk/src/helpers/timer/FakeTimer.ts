import type { ITimer, Timeout } from "./Timer.types";

let taskSeq = 0;

/**
 * A fake Timer to use in tests.
 * Set {time} property to allow the time to pass.
 */
export class FakeTimer implements ITimer {
  private _time = 0;
  private tasks: Task[] = [];

  get time() {
    return this._time;
  }

  set time(newTime: number) {
    this._time = newTime;
    this.executeTasks();
  }

  setTimeout(fn: () => void, timeoutMs: number) {
    this.tasks.push({
      run: fn,
      scheduledTime: this._time + timeoutMs,
      id: ++taskSeq,
    });
    return taskSeq;
  }

  clearTimeout(timeout: Timeout): void {
    this.tasks = this.tasks.filter((task) => task.id !== timeout);
  }

  private executeTasks() {
    for (const task of this.tasks) {
      if (task.scheduledTime <= this._time) {
        task.run.call(undefined);
      }
    }
    this.tasks = this.tasks.filter((task) => task.scheduledTime > this._time);
  }
}

interface Task {
  scheduledTime: number;
  id: number;
  run(): void;
}
