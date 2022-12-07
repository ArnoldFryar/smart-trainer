import { getForces, getReps, PRESETS } from "../device/activate";
import type DB from "../db/settings.js";
import { promisifyTimeout } from "../util/promisify.js";
import { reactivePromise } from '../util/signals.js';
import { Accessor, createEffect } from "solid-js";

const MAX_REPS = 255;
const MAX_WEIGHT = 100;

const EXERCISES = {
  SQUAT: "SQUAT",
  BENCH: "BENCH",
  BARBELL_ROW: "BARBELL_ROW",
  DEADLIFT: "DEADLIFT",
  OVERHEAD_PRESS: "OVERHEAD_PRESS",
  BICEP_CURL: "BICEP_CURL",
  HIGH_PULL: "HIGH_PULL",
  THRUSTER: "THRUSTER",
}

const WORKOUT_MODE = {
  STATIC: "STATIC",
  ISOKINETIC: "ISOKINETIC",
  ECCENTRIC: "ECCENTRIC",
  CONCENTRIC: "CONCENTRIC",
}

const WORKOUT_LIMIT = {
  REPS: "REPS",
  TIME: "TIME",
  VELOCITY: "VELOCITY",
}

export const MODE_HANDLERS = {
  [WORKOUT_MODE.STATIC]: ({ weight }) => {
    return {
      maxWeight: weight,
      maxWeightIncrease: 0,
      weightModulation: PRESETS.NEW_SCHOOL,
      calibrationReps: 3.5
    };
  },
  [WORKOUT_MODE.ISOKINETIC]: ({ targetVelocity, e1rm }) => {
    return {
      maxWeight: MAX_WEIGHT,
      maxWeightIncrease: 0,
      weightModulation: {
        concentric: {
          decrease: { minMmS: 0, maxMmS: targetVelocity - 1, ramp: e1rm * 0.4 },
          increase: { minMmS: targetVelocity + 1, maxMmS: targetVelocity + 400, ramp: e1rm },
        },
        eccentric: {
          decrease: { minMmS: -targetVelocity - 400, maxMmS: -targetVelocity - 1, ramp: e1rm },
          increase: { minMmS: -targetVelocity + 1, maxMmS: 0, ramp: e1rm * 0.4 },
        },
      },
      calibrationReps: 3,
    };
  },
  [WORKOUT_MODE.ECCENTRIC]: ({ weight }) => {
    return {
      maxWeight: weight,
      maxWeightIncrease: 0,
      weightModulation: PRESETS.ECCENTRIC_ONLY,
      calibrationReps: 3,
    };
  },
}

export const LIMIT_HANDLERS = {
  [WORKOUT_LIMIT.REPS]: ({ reps }) => {
    return {
      reps: reps,
      limit: (repCount, repSamples, aborted) => {
        return reactivePromise((resolve) => {
          createEffect(() => {
            if (repCount() >= reps) {
              resolve();
            }
          })
        }, aborted)
      }
    } as SetConfig;
  },
  [WORKOUT_LIMIT.TIME]: ({ time }) => {
    return {
      reps: MAX_REPS,
      limit: () => promisifyTimeout(time)
    };
  },
  [WORKOUT_LIMIT.VELOCITY]: ({ velocity }) => {
    return {
      reps: MAX_REPS,
      limit: (repCount, repSamples, aborted) => {
        return reactivePromise((resolve) => {
          const lastRep = () => repSamples()[repCount() - 1];
          const lastRepMeanVelocity = () => lastRep().concentric.reduce((acc, curr) => acc + curr, 0) / lastRep().concentric.length;
          createEffect(() => {
            if (lastRepMeanVelocity() <= velocity) {
              resolve();
            }
          })
        }, aborted)
      }
    } as SetConfig;
  }
}

export type Set = {
  exercise: string;
  rest: number;
  mode: keyof typeof WORKOUT_MODE;
  modeConfig: object,
  limit: keyof typeof WORKOUT_LIMIT;
  limitConfig: object;
} & ({
  mode: typeof WORKOUT_MODE["STATIC"],
  modeConfig: { weight: number },
} | {
  mode: typeof WORKOUT_MODE["ISOKINETIC"],
  modeConfig: { targetVelocity: number, e1rm: number },
} | {
  mode: typeof WORKOUT_MODE["ECCENTRIC"],
  modeConfig: { weight: number },
} | {
  mode: typeof WORKOUT_MODE["CONCENTRIC"],
  modeConfig: { weight: number },
}) & ({
  limit: typeof WORKOUT_LIMIT["REPS"],
  limitConfig: { reps: number },
} | {
  limit: typeof WORKOUT_LIMIT["TIME"],
  limitConfig: { time: number },  
} | {
  limit: typeof WORKOUT_LIMIT["VELOCITY"],
  limitConfig: { velocity: number },
})

export type SetConfig = {
  maxWeight: number;
  maxWeightIncrease: number;
  weightModulation: Parameters<typeof getForces>[2];
  reps: number;
  calibrationReps: number;
  limit: (repCount: () => number, repSamples: () => any, abort: Accessor<boolean>) => Promise<any>;
}

export async function activateSet(config: SetConfig) {
  const hasHalfCalibrationRep = Boolean(config.calibrationReps % 1);
  const actualCalibrationReps = Math.floor(config.calibrationReps);
  const totalReps = config.reps + (hasHalfCalibrationRep ? 1 : 0);

  await Trainer.activate(
    getReps(totalReps, actualCalibrationReps, actualCalibrationReps), 
    getForces(config.maxWeight, config.maxWeightIncrease, config.weightModulation)
  );
}

export function createSetStorage(db: typeof DB) {
  const workoutID = crypto.randomUUID();
  const workoutStartTime = Date.now();
  const sets = [];
  return async (set, samples) => {
    const setID = crypto.randomUUID();
    const setEndTime = Date.now();
    const tx = db.transaction(["workouts", "sets"], "readwrite");
    sets.push(setID);
    tx.objectStore("workouts").add({
      id: workoutID,
      time: workoutStartTime,
      sets,
    });
    tx.objectStore("sets").add({
      workout: workoutID,
      exercise: set.exercise,
      time: setEndTime,
      mode: set.mode,
      samples
    });
    await tx.done;
  }
}

// LENGTH
// micro: 3 main, 1 accessory, 1 set (4 sets, 1 break, 5 min)
// short: 3 main, 2 accessory, 3 sets (15 sets, 5 breaks, 20 min)
// full: 3 main, 3 accessory, 5 sets (30 sets, 9 breaks, 40 min)
// MAIN EXERCISE
// push, pull, legs: randomized order
// random exercies of each type
export function createWorkoutIterator(db: typeof DB, workoutOptions) {
  return [{
    exercise: EXERCISES.SQUAT,
    mode: WORKOUT_MODE.STATIC,
    modeConfig: { weight: 20 },
    limit: WORKOUT_LIMIT.REPS,
    limitConfig: { reps: 8 },
  },
  {
    exercise: EXERCISES.BENCH,
    mode: WORKOUT_MODE.STATIC,
    modeConfig: { weight: 20 },
    limit: WORKOUT_LIMIT.REPS,
    limitConfig: { reps: 8 },
  },
  {
    exercise: EXERCISES.DEADLIFT,
    mode: WORKOUT_MODE.STATIC,
    modeConfig: { weight: 20 },
    limit: WORKOUT_LIMIT.REPS,
    limitConfig: { reps: 8 },
  },
  {
    exercise: EXERCISES.OVERHEAD_PRESS,
    mode: WORKOUT_MODE.STATIC,
    modeConfig: { weight: 20 },
    limit: WORKOUT_LIMIT.REPS,
    limitConfig: { reps: 8 },
  },
  {
    exercise: EXERCISES.BARBELL_ROW,
    mode: WORKOUT_MODE.STATIC,
    modeConfig: { weight: 20 },
    limit: WORKOUT_LIMIT.REPS,
    limitConfig: { reps: 8 },
  }][Symbol.iterator] as any as AsyncIterator<Set>;
}