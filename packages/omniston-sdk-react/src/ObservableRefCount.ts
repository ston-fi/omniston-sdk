import type { Observable as SimpleObservable } from "@ston-fi/omniston-sdk";
import { Observable, type Subscription } from "rxjs";

export class ObservableRefCount {
  public refCount = 0;
  private subscription: Subscription | null = null;

  constructor(private createObservable: () => SimpleObservable<unknown>) {}

  subscribe({
    next,
    error,
    finalizer,
  }: {
    next: (data: unknown) => void;
    error: (err: unknown) => void;
    finalizer: () => void;
  }) {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = new Observable<unknown>((subscriber) => {
      const subscription = this.createObservable().subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        finalizer();
      };
    }).subscribe({ next, error });
    return this.subscription;
  }

  increaseRefCount() {
    this.refCount++;
  }

  decreaseRefCount() {
    this.refCount--;
    // Defer unsubscribe to the next tick to avoid triggering on unmount/remount in development mode
    setTimeout(() => {
      if (this.refCount === 0) {
        this.subscription?.unsubscribe();
        this.subscription = null;
      }
    }, 0);
  }
}
