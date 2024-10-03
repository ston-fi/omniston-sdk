import { finalize, type Observable, type Subscription } from "rxjs";

export class ObservableRefCount {
  private readonly createObservable: () => Observable<unknown>;
  public refCount = 0;
  private subscription: Subscription | null = null;

  constructor(createObservable: () => Observable<unknown>) {
    this.createObservable = createObservable;
  }

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
    const observable = this.createObservable().pipe(finalize(finalizer));
    this.subscription = observable.subscribe({ next, error });
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
