import {
  createSignal,
  createEffect,
  createRenderEffect,
  untrack,
  createResource,
} from "solid-js";
import { Sample } from "../device/cables";
import { promisifyTimeout } from "../util/promisify";
import { createAbortEffect, reactivePromise } from "../util/signals";
import { MODE_HANDLERS, LIMIT_HANDLERS, SetConfig, activateSet, Set } from "./index";

export type State = "calibrating" | "workout" | "rest" | "paused" | "complete";
export type RepSamples = Array<{ concentric?: Sample[], eccentric?: Sample[] }>;
export function createWorkoutService(sets: Array<() => Promise<Set>>, save: (set: Set, samples: RepSamples, interrupted?: boolean) => void) {
  const [state, setState] = createSignal<State>("calibrating");
  const [loading, setLoading] = createSignal(true);
  const [currentSetIndex, setCurrentSetIndex] = createSignal(0);
  const [currentSet] = createResource<Set, number>(currentSetIndex, (i) => sets[i]())
  const [repSamples, setRepSamples] = createSignal<RepSamples>([]);
  const currentSetConfig = () => {
    return {
      ...MODE_HANDLERS[currentSet().mode](
        currentSet().modeConfig as any
      ),
      ...LIMIT_HANDLERS[currentSet().limit](
        currentSet().limitConfig as any
      ),
    } as SetConfig;
  };
  const calibrationRepsRemaining = () => {
    const { up, down } = Trainer.reps();
    return currentSetConfig().calibrationReps - (up + down) / 2;
  };
  const repCount = () => {
    const { up, down } = Trainer.reps();
    return (up + down) / 2 - currentSetConfig().calibrationReps;
  };
  const next = async () => {
    saveAndResetSamples();
    setLoading(true);
    setCurrentSetIndex(currentSetIndex() + 1);
  };
  const prev = async () => {
    saveAndResetSamples();
    setLoading(true);    
    setCurrentSetIndex(currentSetIndex() - 1);
  };
  const pause = () => {
    saveAndResetSamples(true);
    setState("paused");
    Trainer.stop();
  };
  const resume = () => {
    saveAndResetSamples();
    setState("calibrating");
  };
  const saveAndResetSamples = (interrupted?: boolean) => {
    if (repSamples().length > 0) {
      save(currentSet(), repSamples(), interrupted);
    }
    setRepSamples([]);
  };

  createRenderEffect(() => {
    const rep = repCount();
    if (rep >= 0) {
      const phase = Trainer.phase();
      const newSample = Trainer.sample();
      const existingSamples = untrack(repSamples);
      const newSamples = [...existingSamples];
      const currentRep = (newSamples[rep] = newSamples[rep] ?? {});
      currentRep[phase] = currentRep[phase]
        ? [...currentRep[phase], newSample]
        : [newSample];
      setRepSamples(newSamples);
    }
  });

  createAbortEffect((aborted) => {
    if (currentSet()) {
      untrack(async () => {
        if (state() === "paused") {
          setLoading(false);
          return;
        }

        setState("calibrating");

        await activateSet(currentSetConfig());

        setLoading(false);

        await reactivePromise((resolve) => {
          createEffect(() => {
            if (!calibrationRepsRemaining()) {
              resolve();
            }
          });
        }, aborted);

        setState("workout");

        await currentSetConfig().limit(repCount, repSamples, aborted);
        await Trainer.stop();

        if (currentSetIndex() === sets.length - 1) {
          saveAndResetSamples();
          setState("complete");
        } else {
          setState("rest");
          await promisifyTimeout(currentSet().rest ?? 10000);
          next();
        }
      });
    }
  });

  return [
    {
      get state() {
        return state();
      },
      get loading() {
        return loading();
      },
      get currentSet() {
        return currentSet();
      },
      get currentSetIndex() {
        return currentSetIndex();
      },
      get currentSetConfig() {
        return currentSetConfig();
      },
      get repSamples() {
        return repSamples();
      },
      get repCount() {
        return repCount();
      },
      get calibrationRepsRemaining() {
        return calibrationRepsRemaining();
      }
    },
    { next, prev, pause, resume },
  ] as const;
}
