import { getForces, getReps } from "../device/activate";
import type DB from "../db/settings.js";
import { promisifyTimeout } from "../util/promisify.js";
import { reactivePromise } from '../util/signals.js';
import { Accessor, createEffect } from "solid-js";
import { RepSamples } from "./hook";
import { calculateMeanVelocity } from "./util";

const MAX_REPS = 126;
const MAX_WEIGHT = 100;

const EXERCISES = {
  BACK_SQUAT: "BACK_SQUAT",
  FLAT_BENCH_PRESS: "FLAT_BENCH_PRESS",
  BARBELL_ROW: "BARBELL_ROW",
  DEADLIFT: "DEADLIFT",
  OVERHEAD_PRESS: "OVERHEAD_PRESS",
  HIGH_PULL: "HIGH_PULL",
  THRUSTER: "THRUSTER",
  LUNGES: "LUNGES",
  BICEP_CURL: "BICEP_CURL",
  TRICEP_EXTENSION: "TRICEP_EXTENSION",
  LATERAL_RAISE: "LATERAL_RAISE",
  REAR_FLY: "REAR_FLY",
  CHEST_FLY: "CHEST_FLY",
  CALF_RAISE: "CALF_RAISE",
}

const PUSH_EXERCISES = [EXERCISES.FLAT_BENCH_PRESS, EXERCISES.OVERHEAD_PRESS];
const PULL_EXERCISES = [EXERCISES.BARBELL_ROW, EXERCISES.HIGH_PULL];
const LEG_EXERCISES = [EXERCISES.BACK_SQUAT, EXERCISES.DEADLIFT];
const ACCESSORY_EXERCISES = [EXERCISES.BICEP_CURL, EXERCISES.TRICEP_EXTENSION, EXERCISES.LATERAL_RAISE, EXERCISES.REAR_FLY, EXERCISES.CHEST_FLY];

const WORKOUT_MODE = {
  STATIC: "STATIC",
  ISOKINETIC: "ISOKINETIC",
  ECCENTRIC: "ECCENTRIC",
  CONCENTRIC: "CONCENTRIC",
  ASSESSMENT: "ASSESSMENT",
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
      weightModulation: {
        concentric: {
          decrease: { minMmS: 0, maxMmS: 20, ramp: 3 },
          increase: { minMmS: 75, maxMmS: 600, ramp: 0 },
        },
        eccentric: {
          decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
          increase: { minMmS: -100, maxMmS: -50, ramp: 40 },
        },
      },
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
      weightModulation: {
        concentric: {
          decrease: { minMmS: 50, maxMmS: 550, ramp: 50 },
          increase: { minMmS: 650, maxMmS: 750, ramp: 10 },
        },
        eccentric: {
          decrease: { minMmS: -550, maxMmS: -500, ramp: 100 },
          increase: { minMmS: -100, maxMmS: -50, ramp: 20 },
        },
      },
      calibrationReps: 3,
    };
  },
  [WORKOUT_MODE.CONCENTRIC]: ({ weight }) => {
    return {
      maxWeight: weight,
      maxWeightIncrease: 0,
      weightModulation: {
        concentric: {
          decrease: { minMmS: 0, maxMmS: 20, ramp: 3 },
          increase: { minMmS: 75, maxMmS: 600, ramp: 0 },
        },
        eccentric: {
          decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
          increase: { minMmS: -100, maxMmS: -50, ramp: 40 },
        },
      },
      calibrationReps: 3,
    };
  },
  [WORKOUT_MODE.ASSESSMENT]: ({ targetVelocity }) => {
    const RATE = 15;
    return {
      maxWeight: 20,
      maxWeightIncrease: 20,
      weightModulation: {
        concentric: {
          decrease: { minMmS: 50, maxMmS: targetVelocity/2, ramp: RATE/2 },
          increase: { minMmS: targetVelocity, maxMmS: 1500, ramp: RATE },
        },
        eccentric: {
          decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
          increase: { minMmS: -100, maxMmS: -50, ramp: 0 },
        },
      },
      calibrationReps: 3.5
    };
  }
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
  [WORKOUT_LIMIT.VELOCITY]: ({ stopVelocity }) => {
    return {
      reps: MAX_REPS,
      limit: (repCount, repSamples, aborted) => {
        return reactivePromise((resolve) => {
          const prevRep = (i: number) => repSamples()[repCount() - i];
          const prevRepMeanVelocity = (i: number) => prevRep(i) 
            ? calculateMeanVelocity(prevRep(i).concentric)
            : Infinity;
          createEffect(() => {
            if (prevRepMeanVelocity(1) <= stopVelocity && prevRepMeanVelocity(2) <= stopVelocity) {
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
  limit: (repCount: () => number, repSamples: () => RepSamples, abort: Accessor<boolean>) => Promise<any>;
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

export type WorkoutConfig = {
  length: "full" | "short" | "mini";
  exercises: { main: string[], accessory: string[] };
  targetVelocity: number;
  stopVelocity: number;
}

export async function selectExercises() {
  // TODO: select last exercise of each type from db 
  // (VERTICAL_PULL, HORIZONTAL_PULL, VERTICAL_PUSH, HORIZONTAL_PUSH, LEGS_SQUAT, LEGS_HINGE)
  // prefer to keep the same exercise of each type with small chance of changing
  // chance of changing should increase with time/sets since last change
  // exercise selection is random, but should follow a distribution set by user preferences
  // if no exercises have been done in a category, select random exercise in that category
  // then randomly choose between vertical/horizontal for pull/push and squat/hinge for legs
  // randomize order of main exercises

  const pull = PULL_EXERCISES[Math.floor(Math.random() * PULL_EXERCISES.length)];
  const push = PUSH_EXERCISES[Math.floor(Math.random() * PUSH_EXERCISES.length)];
  const legs = LEG_EXERCISES[Math.floor(Math.random() * LEG_EXERCISES.length)];
  const main = [pull, push, legs].sort(() => Math.random() - 0.5);

  // TODO: select accessories based on main exercises
  // accessories should complement main exercises
  const accessory = [...ACCESSORY_EXERCISES].sort(() => Math.random() - 0.5).slice(0, 3);

  return { main, accessory };
}

// LENGTH
// micro: 3 main, 1 accessory, 1 set (4 sets, 1 break, 5 min)
// short: 3 main, 2 accessory, 3 sets (15 sets, 5 breaks, 20 min)
// full: 3 main, 3 accessory, 5 sets (30 sets, 9 breaks, 40 min)
export function createWorkoutIterator({ length, exercises, targetVelocity, stopVelocity }: WorkoutConfig, db?: typeof DB) {
  const numSets = length === "full" ? 5 : length === "short" ? 3 : 2;
  const exerciseWeights = new Map();

  const sets = [];
  const save = (set, samples: RepSamples, interrupted: boolean) => {
    localStorage.setItem("workoutSets", JSON.stringify(JSON.parse(localStorage.getItem("workoutSets") ?? "[]").concat({ set, samples, interrupted }).slice(-1000)));
    if (!interrupted && !exerciseWeights.has(set.exercise)) {
      const maxWeight = Math.max(...samples.filter(s => s.concentric).flatMap(s => s.concentric.map(c => Math.max(c.left.force, c.right.force))));
      exerciseWeights.set(set.exercise, maxWeight);
    }
  }

  for (let setIndex = 0; setIndex < numSets; setIndex++) {
    for (let exerciseIndex = 0; exerciseIndex < 1 /* exercises.main.length */; exerciseIndex++) {
      const exercise = exercises.main[exerciseIndex];
      sets.push(() => {
        const weight = exerciseWeights.get(exercise);
        return {
          exercise,
          mode: weight ? WORKOUT_MODE.STATIC : WORKOUT_MODE.ASSESSMENT,
          modeConfig: { weight, targetVelocity },
          limit: WORKOUT_LIMIT.VELOCITY,
          limitConfig: { stopVelocity: weight ? stopVelocity : targetVelocity },
          rest: exerciseIndex % exercises.main.length === 0 ? 10000 : 10000,
        }
      });
    }
  }

  return [sets, save] as const;
}