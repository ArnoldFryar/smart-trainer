import {
  createSignal,
  createEffect,
  createRenderEffect,
  untrack,
  createResource,
} from "solid-js";
import { Sample } from "../device/cables";
import { setUserHue } from "../user/colors";
import { createAbortEffect, reactivePromise } from "../util/signals";
import { SetConfig } from "./index";
import { WORKOUT_MODE, WORKOUT_MODE_CONFIGS } from "./modes";
import { getSetMetrics, splitSamplesByPhase } from "./util";

export type State = "calibrating" | "workout" | "rest" | "paused" | "complete";
export function createWorkoutService(
  sets: Array<() => Promise<SetConfig>>,
  save: (set: SetConfig, samples: Sample[], range: { top: number, bottom: number }, interrupted?: boolean) => void
) {
  const [state, setState] = createSignal<State>("calibrating");
  const [loading, setLoading] = createSignal(true);
  const [currentSetIndex, setCurrentSetIndex] = createSignal(0);
  const [currentSet] = createResource<SetConfig, number>(currentSetIndex, (i) =>
    sets[i]()
  );
  const [currentSetSamples, setCurrentSetSamples] = createSignal<Sample[]>([]);
  const currentSetActivationConfig = () => {
    return WORKOUT_MODE_CONFIGS[currentSet().mode].getActivationConfig(currentSet().modeConfig as any);
  };
  const calibrationReps = () => {
    // We prefer to end on a concentric rep, so we add 0.5 to the baseline (except for eccentric only mode)
    return currentSetActivationConfig().reps.repCounts.baseline + (currentSet().mode === WORKOUT_MODE.ECCENTRIC ? 0 : 0.5);
  }
  const rangeOfMotion = () => {
    const { rangeTop, rangeBottom } = Trainer.reps();
    return { top: rangeTop, bottom: rangeBottom };
  }
  const currentSetPhases = () => {
    return splitSamplesByPhase(currentSetSamples(), rangeOfMotion());
  }
  const currentSetMetrics = () => {
    return getSetMetrics(currentSetSamples(), rangeOfMotion());
  }
  const calibrationRepsRemaining = () => {
    const { up, down } = Trainer.reps();
    return calibrationReps() - (up + down) / 2;
  };
  const repCount = () => {
    const { up, down } = Trainer.reps();
    return (up + down) / 2 - calibrationReps();
  };
  const next = async () => {
    saveSet();
    setLoading(true);
    setCurrentSetIndex(currentSetIndex() + 1);
  };
  const prev = async () => {
    saveSet();
    setLoading(true);
    setCurrentSetIndex(currentSetIndex() - 1);
  };
  const pause = () => {
    saveSet(true);
    setState("paused");
    Trainer.stop();
  };
  const resume = () => {
    saveSet();
    setState("calibrating");
  };
  const savedSamples: WeakSet<Sample[]> = new WeakSet();
  const saveSet = (interrupted?: boolean) => {
    const samples = currentSetSamples();
    if (samples.length > 0 && !savedSamples.has(samples)) {
      save(currentSet(), samples, rangeOfMotion(), interrupted);
      savedSamples.add(samples);
    }
  };

  createRenderEffect(() => {
    const rep = Math.floor(repCount());
    const existingSamples = untrack(currentSetSamples);
    if (rep >= 0 && state() === "workout") {
      setCurrentSetSamples([...existingSamples, Trainer.sample()]);
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
        setCurrentSetSamples([]);

        await Trainer.activate(currentSetActivationConfig().reps, currentSetActivationConfig().forces);
        await setUserHue(currentSet().hue);

        setLoading(false);

        await reactivePromise((resolve) => {
          createEffect(() => {
            if (!calibrationRepsRemaining()) {
              resolve();
            }
          });
        }, aborted);

        setState("workout");

        await currentSetActivationConfig().limit(repCount, currentSetPhases, aborted);
        await Trainer.stop();
        saveSet();

        if (currentSetIndex() === sets.length - 1) {
          setState("complete");
        } else {
          setState("rest");
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
      get currentSetActivationConfig() {
        return currentSetActivationConfig();
      },
      get currentSetSamples() {
        return currentSetSamples();
      },
      get currentSetPhases() {
        return currentSetPhases();
      },
      get currentSetMetrics() {
        return currentSetMetrics();
      },
      get rangeOfMotion() {
        return rangeOfMotion();
      },
      get repCount() {
        return repCount();
      },
      get calibrationRepsRemaining() {
        return calibrationRepsRemaining();
      },
    },
    { next, prev, pause, resume },
  ] as const;
}
