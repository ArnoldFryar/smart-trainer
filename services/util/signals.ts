import {
  Setter,
  Accessor,
  createRoot,
  createSignal,
  getListener,
  onMount,
  onCleanup,
  createEffect,
} from 'solid-js';

export function createObservedSignal<T>(
  initValue: T,
  initFn: (set: Setter<T>) => any
): Accessor<T> {
  const [get, set] = createSignal(initValue);
  let dispose: undefined | (() => void);
  let watched = 0;
  return () => {
    if (getListener()) {
      if (!watched++ && !dispose) {
        dispose = initFn(set);
      }

      onCleanup(() => {
        if (!--watched) {
          queueMicrotask(() => {
            if (!watched) {
              Promise.resolve(dispose).then((d) => d?.());
              dispose = undefined;
            }
          });
        }
      });
    }

    return get();
  };
}

export function createLocalSignal<T>(key: string, initialValue: T) {
  const stored = typeof window !== undefined && localStorage.getItem(key);
  const [get, set] = createSignal<T>(
    stored ? JSON.parse(stored) : initialValue
  );

  onMount(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      set(JSON.parse(stored));
    }
  });

  return [
    get,
    (value: T) => {
      localStorage.setItem(key, JSON.stringify(value));
      set(() => value);
    },
  ] as const;
}

export function reactivePromise<T>(fn: (resolve: (data?: T) => void, aborted?: Accessor<boolean>) => any, aborted?: Accessor<boolean>): Promise<T> {
  return new Promise((resolve, reject) => {
    createRoot((disposeRoot) => {
      createEffect(() => {
        if (aborted()) {
          disposeRoot();
          reject(new Error('aborted'));
        }
      });
      fn((data) => {
        disposeRoot();
        resolve(data);
      }, aborted);
    });
  });
}

export function createAbortEffect(fn: (abort: Accessor<boolean>) => any) {
  createEffect(() => {
    const [aborted, setAborted] = createSignal(false);
    fn(aborted);
    onCleanup(() => setAborted(true));
  });
}
