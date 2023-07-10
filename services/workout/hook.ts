import {
  createSignal,
  createEffect,
  createRenderEffect,
  untrack,
  createResource,
} from "solid-js";
import { Sample } from "../device/cables";
import { setUserHue } from "../user/colors";
import { promisifyTimeout } from "../util/promisify";
import { createAbortEffect, reactivePromise } from "../util/signals";
import { SetConfig, getSetMetrics } from "./index";
import { WORKOUT_MODE, WORKOUT_MODE_CONFIGS } from "./modes";

export type State = "calibrating" | "workout" | "rest" | "paused" | "complete";
export type RepSamples = Array<{ concentric?: Sample[]; eccentric?: Sample[] }>;
export function createWorkoutService(
  sets: Array<() => Promise<SetConfig>>,
  save: (set: SetConfig, samples: RepSamples, metrics: any, interrupted?: boolean) => void
) {
  const [state, setState] = createSignal<State>("calibrating");
  const [loading, setLoading] = createSignal(true);
  const [currentSetIndex, setCurrentSetIndex] = createSignal(0);
  const [currentSet] = createResource<SetConfig, number>(currentSetIndex, (i) =>
    sets[i]()
  );
  const [repSamples, setRepSamples] = createSignal<RepSamples>([]);
  const currentSetActivationConfig = () => {
    return WORKOUT_MODE_CONFIGS[currentSet().mode].getActivationConfig(currentSet().modeConfig as any);
  };
  const [currentSetMetrics, setCurrentSetMetrics] = createSignal(null);
  const calibrationReps = () => {
    // We prefer to end on a concentric rep, so we add 0.5 to the baseline (except for eccentric only mode)
    return currentSetActivationConfig().reps.repCounts.baseline + (currentSet().mode === WORKOUT_MODE.ECCENTRIC ? 0 : 0.5);
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
      const metrics = getSetMetrics(repSamples());
      setCurrentSetMetrics(metrics);
      save(currentSet(), repSamples(), metrics, interrupted);
    }
    setRepSamples([]);
  };

  createRenderEffect(() => {
    const rep = Math.floor(repCount());
    const existingSamples = untrack(repSamples);
    if (rep >= 0 && rep <= existingSamples.length && state() === "workout") {
      let phase = Trainer.phase();
      const newSample = Trainer.sample();
      const newSamples = [...existingSamples];
      let currentRep = (newSamples[rep] = newSamples[rep] ?? {});
      // if the trainer says we're in a new phase,
      // but the sample velocity disagrees,
      // put the sample data in the correct phase
      const combinedVelocity =
        newSample.left.velocity + newSample.right.velocity;
      if (
        !currentRep[phase] &&
        ((phase === "concentric" && combinedVelocity < 0) ||
          (phase === "eccentric" && combinedVelocity > 0))
      ) {
        phase = phase === "concentric" ? "eccentric" : "concentric";
        if (!currentRep[phase]) {
          currentRep = newSamples[rep - 1] ?? {};
        }
      }
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

        await currentSetActivationConfig().limit(repCount, repSamples, aborted);
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
      get currentSetActivationConfig() {
        return currentSetActivationConfig();
      },
      get currentSetMetrics() {
        return currentSetMetrics();
      },
      get repSamples() {
        return repSamples();
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
