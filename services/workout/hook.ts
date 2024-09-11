import {
  createSignal,
  createEffect,
  createRenderEffect,
  untrack,
  createResource,
} from "solid-js";
import { getSets } from "../db/settings";
import {
  ActivateConfig,
  EchoConfig,
  getActivateCommand,
  RegularConfig,
} from "../device/activate";
import { Sample } from "../device/cables";
import { setUserHue } from "../user/colors";
import { createAbortEffect, reactivePromise } from "../util/signals";
import { SetConfig } from "./index";
import { LIMIT_HANDLERS, WORKOUT_MODE, WORKOUT_MODE_CONFIGS } from "./modes";
import { getSetMetrics, splitSamplesByPhase } from "./util";

export type State = "calibrating" | "workout" | "rest" | "paused" | "complete";
export function createWorkoutService(
  sets: Array<() => Promise<SetConfig>>,
  save: (
    set: SetConfig,
    samples: Sample[],
    range: { top: number; bottom: number },
    interrupted?: boolean
  ) => Promise<void>
) {
  const [state, setState] = createSignal<State>("calibrating");
  const [loading, setLoading] = createSignal(true);
  const [currentSetIndex, setCurrentSetIndex] = createSignal(0);
  const [currentSet] = createResource<SetConfig, number>(currentSetIndex, (i) =>
    sets[i]()
  );
  const [previousSets, { refetch }] = createResource(() => {
    return getSets(currentSet()?.userId);
  });
  const prevSet = () => previousSets()?.[0];
  const [currentSetSamples, setCurrentSetSamples] = createSignal<Sample[]>([]);
  const currentSetActivationConfig = () => {
    const { limit, ...limitConfig } = LIMIT_HANDLERS[currentSet()?.limit]?.(
      currentSet()?.limitConfig as any
    );
    return {
      command: WORKOUT_MODE_CONFIGS[currentSet()?.mode]?.command,
      config: WORKOUT_MODE_CONFIGS[currentSet()?.mode]?.config(
        currentSet()?.modeConfig as any,
        limitConfig
      ),
      limit,
    };
  };
  const calibrationReps = () => {
    const { command, config } = currentSetActivationConfig();
    // We prefer to end on a concentric rep, so we add 0.5 to the baseline (except for eccentric only mode)
    const repOffset =
      command === getActivateCommand &&
      currentSet().mode !== WORKOUT_MODE.ECCENTRIC
        ? 0.5
        : 0;
    return (
      ((config as ActivateConfig).reps?.repCounts.baseline ??
        (config as EchoConfig | RegularConfig).romRepCount ??
        3) + repOffset
    );
  };
  const rangeOfMotion = () => {
    const { rangeTop, rangeBottom } = Trainer.reps();
    return { top: rangeTop, bottom: rangeBottom };
  };
  const currentSetPhases = () => {
    return splitSamplesByPhase(currentSetSamples(), rangeOfMotion());
  };
  const currentSetMetrics = () => {
    return getSetMetrics(currentSetSamples(), rangeOfMotion());
  };
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
    if (currentSet()) {
      const rep = Math.floor(repCount());
      const existingSamples = untrack(currentSetSamples);
      if (rep >= 0 && state() === "workout") {
        setCurrentSetSamples([...existingSamples, Trainer.sample()]);
      }
    }
  });

  createAbortEffect((aborted) => {
    if (currentSet()) {
      untrack(async () => {
        if (state() === "paused") {
          setLoading(false);
          return;
        }

        const { command, config, limit } = currentSetActivationConfig();

        setState("calibrating");
        setCurrentSetSamples([]);

        await Trainer._writeCommand(command(config));
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

        await limit(repCount, currentSetPhases, aborted);
        await Trainer.stop();
        saveSet().then(() => refetch());

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
      get prevSet() {
        return prevSet();
      },
    },
    { next, prev, pause, resume },
  ] as const;
}
