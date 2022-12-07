import { createSignal, createEffect, createRenderEffect, untrack } from "solid-js";
import { promisifyTimeout } from "../util/promisify";
import { createAbortEffect, reactivePromise } from "../util/signals";
import { MODE_HANDLERS, LIMIT_HANDLERS, SetConfig, activateSet } from "./index";

export function createWorkoutFSM(sets, save) {
  const [state, setState] = createSignal("calibrating");
  const [loading, setLoading] = createSignal(true);
  const [currentSet, setCurrentSet] = createSignal(null);
  const [repSamples, setRepSamples] = createSignal([]);
  const currentSetConfig = () => {
    return {
      ...MODE_HANDLERS[currentSet().value.mode](currentSet().value.modeConfig as any),
      ...LIMIT_HANDLERS[currentSet().value.limit](currentSet().value.limitConfig as any)
    } as SetConfig;
  }
  const calibrationRepsRemaining = () => {
    const { up, down } = Trainer.reps();
    return currentSetConfig().calibrationReps - (up + down) / 2;
  }
  const repCount = () => {
    const { up, down } = Trainer.reps();
    return (up + down) / 2 - currentSetConfig().calibrationReps;
  }
  const next = async () => {
    saveAndResetSamples();
    setLoading(true);
    setCurrentSet(await sets.next());
  }
  const prev = async () => {
    saveAndResetSamples();
    setLoading(true);
    setCurrentSet(await sets.previous());
  }
  const pause = () => {
    saveAndResetSamples();
    setState("paused");
    Trainer.stop();
  }
  const resume = () => {
    saveAndResetSamples();
    setState("calibrating");
  }
  const saveAndResetSamples = () => {
    if (repSamples().length > 0) {
      save(currentSet(), repSamples())
    }
    setRepSamples([]);
  }

  createRenderEffect(() => {
    const rep = repCount();
    if (rep >= 0) {
      const phase = Trainer.phase();
      const newSample = Trainer.sample();
      const existingSamples = untrack(repSamples);
      const newSamples = [...existingSamples];
      const currentRep = newSamples[rep] = newSamples[rep] ?? {};
      currentRep[phase] = currentRep[phase] ? [...currentRep[phase], newSample] : [newSample];
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
        }, aborted)

        setState("workout");

        await currentSetConfig().limit(repCount, repSamples, aborted);
        await Trainer.stop();

        if (currentSet().done) {
          saveAndResetSamples();
          setState("complete");
        } else {
          setState("rest");
          await promisifyTimeout(currentSet().value.rest ?? 10000)
          next();
        }
      })
    }
  })

  
  return { state, loading, currentSet, currentSetConfig, repSamples, repCount, calibrationRepsRemaining, next, prev, pause, resume };
}