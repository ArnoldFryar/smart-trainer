import { createMachine, interpret } from 'xstate';
import { createRoot, createSignal, createRenderEffect, createEffect, onCleanup, from } from 'solid-js';
import { Set, SetConfig, MODE_HANDLERS, LIMIT_HANDLERS, createSetStorage, createWorkoutIterator,  } from './index';
import db from "../db/settings.js";
import { reactivePromise } from '../util/signals.js';
import { createForwardAndBackwardIterator, promisifyTimeout } from '../util/promisify';
import type { Sample } from "../device/cables"
import { getForces, getReps } from '../device/activate';

interface Context {
  storage: (set: unknown, data: unknown) => Promise<void>;
  currentSet?: IteratorResult<Set> & { index: number };
  currentSetConfig?: SetConfig;
  calibrationRepsRemaining?: () => number;
  repCount?: () => number;
  repSamples?: () => Array<{ concentric?: Sample[], eccentric?: Sample[] }>;
}

export function createWorkoutService(workoutOptions) {
  const setStorage = createSetStorage(db);
  const workoutIterator = createWorkoutIterator(db, workoutOptions);
  const machine = createWorkoutMachine(Trainer, workoutIterator, setStorage);
  const service = interpret<Context>(machine).start();
  onCleanup(() => service.stop());
  return [from(service), service.send.bind(service)] as const;
}

function createWorkoutMachine(Trainer: typeof window.Trainer, workoutIterator: AsyncIterator<Set>, storage: Context["storage"]) {
  const sets = createForwardAndBackwardIterator(workoutIterator);
  return createMachine<Context>({
    predictableActionArguments: true,
    id: 'workout',
    initial: 'nextThenActivate',
    context: {
      storage
    },
    states: {
      rest: {
        invoke: {
          src: 'rest',
          onDone: 'activate',
          onError: 'paused'
        },
        on: {
          SKIP: 'activate',
          EXIT: 'complete'
        }
      },
      activate: {
        invoke: {
          src: 'activate',
          onDone: 'calibrate',
          onError: 'paused',
        }
      },
      calibrate: {
        invoke: {
          src: 'calibrate',
          onDone: 'workout',
          onError: 'paused',
        },
        on: {
          PAUSE: 'paused',
          SKIP: 'nextThenActivate',
          BACK: 'prevThenActivate',
          EXIT: 'complete'
        }
      },
      workout: {
        invoke: {
          src: 'workout',
        },
        on: {
          PAUSE: 'paused',
          SKIP: 'nextThenActivate',
          BACK: 'prevThenActivate',
          EXIT: 'complete',
          COMPLETED: [
            {
              target: 'rest',
              cond: 'hasNextSet'
            },
            {
              target: 'complete'
            }
          ]
        },
        exit: 'finishSet'
      },
      paused: {
        on: {
          RESUME: 'activate',
          SKIP: 'nextWhilePaused',
          BACK: 'prevWhilePaused',
          EXIT: 'complete'
        }
      },
      nextThenActivate: {
        invoke: {
          src: 'nextSet',
          onDone: 'activate',
          onError: 'paused',
        }
      },
      prevThenActivate: {
        invoke: {
          src: 'prevSet',
          onDone: 'activate',
          onError: 'paused',
        }
      },
      nextWhilePaused: {
        invoke: {
          src: 'nextSet',
          onDone: 'paused',
          onError: 'paused',
        }
      },
      prevWhilePaused: {
        invoke: {
          src: 'prevSet',
          onDone: 'paused',
          onError: 'paused',
        }
      },
      complete: {
        type: 'final'
      }
    }
  }, {
    actions: {
      activate: async (context, event) => {
        const currentSet = context.currentSet;
        const currentSetConfig = context.currentSetConfig = {
          ...MODE_HANDLERS[currentSet.value.mode](currentSet.value.modeConfig as any),
          ...LIMIT_HANDLERS[currentSet.value.limit](currentSet.value.limitConfig as any)
        } as SetConfig;
        const hasHalfCalibrationRep = Boolean(currentSetConfig.calibrationReps % 1);
        const actualCalibrationReps = Math.floor(currentSetConfig.calibrationReps);
        const totalReps = currentSetConfig.reps + (hasHalfCalibrationRep ? 1 : 0);
        await Trainer.activate(
          getReps(totalReps, actualCalibrationReps, actualCalibrationReps), 
          getForces(currentSetConfig.maxWeight, currentSetConfig.maxWeightIncrease, currentSetConfig.weightModulation)
        );
      },
      calibrate: async (context, event) => {
        const calibrationRepsRemaining = context.calibrationRepsRemaining = () => {
          const { up, down } = Trainer.reps();
          return context.currentSetConfig.calibrationReps - (up + down) / 2;
        }
        return reactivePromise((resolve) => {
          createEffect(() => {
            if (!calibrationRepsRemaining()) {
              resolve();
            }
          });
        })
      },
      workout: (context, event) => (callback) => {
        let disposeRoot;
        const repCount = context.repCount = () => {
          const { up, down } = Trainer.reps();
          return (up + down) / 2 - context.currentSetConfig.calibrationReps;
        }
        const repSamples = context.repSamples = createRoot((_disposeRoot) => {
          disposeRoot = _disposeRoot;
          const [samples, setSamples] = createSignal([]);

          createRenderEffect(() => {
            const rep = repCount();
            const phase = Trainer.phase();
            const newSample = Trainer.sample();
            const existingSamples = samples();
            const newSamples = [...existingSamples];
            const currentRep = newSamples[rep] = newSamples[rep] ?? {};
            currentRep[phase] = currentRep[phase] ? [...currentRep[phase], newSample] : [newSample];
            setSamples(newSamples);
          });

          return samples;
        });
        context.currentSetConfig.limit(repCount, repSamples).then(() => callback("COMPLETED"));
        return disposeRoot;
      },
      finishSet: async (context, event) => {
        try {
          context.storage(context.currentSet.value, context.repSamples());
        } finally {
          context.currentSetConfig = undefined;
          context.calibrationRepsRemaining = undefined;
          context.repCount = undefined;
          context.repSamples = undefined;
          await Trainer.stop();
        }
      },
      rest: async (context, event) => {
        context.currentSet = await sets.next();
        await promisifyTimeout(context.currentSet.value.rest ?? 10000);
      },
      nextSet: async (context, event) => {
        context.currentSet = await sets.next()
      },
      prevSet: async (context, event) => {
        context.currentSet = await sets.previous()
      },
    },
    guards: {
      hasNextSet: (context, event) => {
        return context.currentSet.done;
      },
      hasPreviousSet: (context, event) => {
        return context.currentSet.index > 0;
      }
    }
  });
}