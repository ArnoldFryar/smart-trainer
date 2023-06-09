import { getForces, getReps } from "../device/activate";
import type DB from "../db/settings.js";
import { promisifyTimeout } from "../util/promisify.js";
import { reactivePromise } from '../util/signals.js';
import { Accessor, createEffect, untrack } from "solid-js";
import { RepSamples } from "./hook";
import { calculateMeanVelocity } from "./util";
import { Exercise, PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES, ACCESSORY_EXERCISES, EXERCISES } from "./exercises";
import { beep, beepBeepBeep } from "../util/sounds";

const MAX_REPS = 126;
const MAX_WEIGHT = 100;

export type { Exercise };

export const WORKOUT_MODE = {
  STATIC: "STATIC",
  ISOKINETIC: "ISOKINETIC",
  ECCENTRIC: "ECCENTRIC",
  CONCENTRIC: "CONCENTRIC",
  ASSESSMENT: "ASSESSMENT",
  ADAPTIVE: "ADAPTIVE",
}

export const WORKOUT_LIMIT = {
  REPS: "REPS",
  TIME: "TIME",
  VELOCITY_LOSS: "VELOCITY_LOSS",
  ASSESSMENT: "ASSESSMENT",
  FAILURE: "FAILURE",
  SPOTTER: "SPOTTER",
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
    const RATE = 8;
    return {
      maxWeight: MAX_WEIGHT,
      maxWeightIncrease: 0,
      weightModulation: {
        concentric: {
          decrease: { minMmS: 0, maxMmS: 0, ramp: 0 },
          increase: { minMmS: targetVelocity, maxMmS: 1500, ramp: RATE },
        },
        eccentric: {
          decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
          increase: { minMmS: -100, maxMmS: -50, ramp: 0 },
        },
      },
      calibrationReps: 3.5
    };
  },
  [WORKOUT_MODE.ADAPTIVE]: ({ maxVelocity, minVelocity, ratio }) => {
    const RATE = 15 * ratio;
    return {
      maxWeight: MAX_WEIGHT,
      maxWeightIncrease: 0,
      weightModulation: {
        concentric: {
          decrease: { minMmS: minVelocity - 600, maxMmS: minVelocity - 1, ramp: RATE * 0.8 },
          increase: { minMmS: maxVelocity + 1, maxMmS: maxVelocity + 600, ramp: RATE },
        },
        eccentric: {
          decrease: { minMmS: -1300, maxMmS: -1200, ramp: 0 },
          increase: { minMmS: -100, maxMmS: -50, ramp: 0 },
        },
      },
      calibrationReps: 3.5,
      baselineReps: 2
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
  [WORKOUT_LIMIT.VELOCITY_LOSS]: ({ velocityThreshold = 0.8, minReps = 2 }) => {
    return {
      reps: MAX_REPS,
      limit: (repCount, repSamples, aborted) => {
        return reactivePromise((resolve) => {
          const repVelocities = () => repSamples().map((rep) => calculateMeanVelocity(rep.concentric));
          const bestVelocity = () => Math.max(...repVelocities());
          const lastVelocity = () => repVelocities()[Math.floor(repCount() - 1)];
          createEffect(() => {
            if (repCount() > minReps && lastVelocity() < bestVelocity() * velocityThreshold) {
              resolve();
            }
          })
        }, aborted)
      }
    } as SetConfig;
  },
  [WORKOUT_LIMIT.ASSESSMENT]: ({ stopVelocity, minReps = 2, forceThreshold = 0.1 }) => {
    return {
      reps: MAX_REPS,
      limit: (repCount, repSamples, aborted) => {
        return reactivePromise((resolve) => {
          const prevRep = (i: number) => repSamples()[Math.floor(repCount() - i)];
          const prevForce = (i: number) => Math.max(...prevRep(i).concentric.map(c => Math.max(c.left.force, c.right.force)));
          const prevMeanVelocity = (i: number) => prevRep(i) 
            ? calculateMeanVelocity(prevRep(i).concentric)
            : Infinity;
          createEffect(() => {
            if (repCount() >= minReps) {
              const difference = repCount() >= 3 ? Math.abs(prevForce(1) - prevForce(2)) : Infinity;
              if (difference <= forceThreshold) {
                resolve();
              } else if (prevMeanVelocity(1) <= stopVelocity) {
                resolve();
              }
            }
          })
        }, aborted)
      }
    } as SetConfig;
  },
  [WORKOUT_LIMIT.SPOTTER]: ({ hardReps = 3 }) => {
    return {
      reps: MAX_REPS,
      limit: (repCount, repSamples, aborted) => {
        return reactivePromise((resolve) => {
          const prevRep = (i: number) => repSamples()[Math.floor(repCount() - i)];
          const minForce = (rep: RepSamples[number]) => Math.min(...rep.concentric.map(c => Math.max(c.left.force, c.right.force)));
          const maxMinForce = () => Math.max(...repSamples().filter(rep => rep.concentric).map(rep => minForce(rep)));
          let currentHardReps = 0;
          createEffect(() => {
            if (repCount() >= 3 && repCount() % 1 === 0) {
              untrack(() => {
                const prevForce = minForce(prevRep(1));
                const target = maxMinForce();
                if (prevForce < target) {
                  if (++currentHardReps === hardReps) {
                    console.log("done");
                    beepBeepBeep();
                    resolve();
                  } else {
                    console.log(`${hardReps - currentHardReps} more?`);
                    beep();
                  }
                } else {
                  console.log("keep going", repCount())
                  currentHardReps = 0;
                }
              });
            }
          })
        }, aborted)
      }
    } as SetConfig;
  },
  [WORKOUT_LIMIT.FAILURE]: ({ expectedPause = 1, warningCount = 3 }) => {
    return {
      reps: MAX_REPS,
      limit: (repCount, repSamples, aborted) => {
        return reactivePromise((resolve) => {
          let struggleStart = null;
          let currentWarningCount = 0;
          createEffect(() => {
            if (Trainer.phase() === "concentric") {
              const rom = Math.max(Trainer.rangeOfMotion().left, Trainer.rangeOfMotion().right);
              if (rom < 0.1) {
                if (struggleStart === null) {
                  struggleStart = Trainer.sample().time;
                  currentWarningCount = 0;
                } else {
                  const struggleCount = Math.floor((Trainer.sample().time - struggleStart) / 1000) - expectedPause;
                  if (struggleCount > currentWarningCount) {
                    if (++currentWarningCount === warningCount) {
                      beepBeepBeep();
                      resolve();
                    } else {
                      beep();
                    }
                  }
                }
              } else {
                struggleStart = null;
              }
            } else {
              struggleStart = null;
            }
          })
        }, aborted)
      }
    } as SetConfig;
  }
}

export type Set = {
  exercise: Exercise;
  rest: number;
  mode: keyof typeof WORKOUT_MODE;
  modeConfig: {
    weight?: number,
    targetVelocity?: number,
    e1rm?: number,
    maxVelocity?: number, 
    minVelocity?: number, 
    ratio?: number 
  },
  limit: keyof typeof WORKOUT_LIMIT;
  limitConfig: {
    reps?: number,
    time?: number,
    velocityThreshold?: number,
    stopVelocity?: number
  };
  user: { id:number, hue: number }
};

export type SetConfig = {
  maxWeight: number;
  maxWeightIncrease: number;
  weightModulation: Parameters<typeof getForces>[2];
  reps: number;
  calibrationReps: number;
  baselineReps?: number;
  limit: (repCount: () => number, repSamples: () => RepSamples, abort: Accessor<boolean>) => Promise<any>;
}

export async function activateSet(config: SetConfig) {
  const hasHalfCalibrationRep = Boolean(config.calibrationReps % 1);
  const actualCalibrationReps = Math.floor(config.calibrationReps);
  const baselineReps = config.baselineReps || actualCalibrationReps;
  const totalReps = config.reps + (hasHalfCalibrationRep ? 1 : 0);

  await Trainer.activate(
    getReps(totalReps, baselineReps, actualCalibrationReps), 
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
  superset: boolean;
  users: number;
  exercises: Array<keyof Exercise>;
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

  return [
    ...main,
    ...accessory
  ];
}

// LENGTH
// micro: 2 main, 2 set (4 sets, 1 break, 5 min)
// short: 3 main, 2 accessory, 3 sets (15 sets, 5 breaks, 20 min)
// full: 3 main, 3 accessory, 5 sets (30 sets, 9 breaks, 40 min)
export function createWorkoutIterator({ length, exercises, superset, users }: WorkoutConfig, db?: typeof DB) {
  const numSets = length === "full" ? 5 : length === "short" ? 3 : 1;
  const hardReps = 3;
  const setExercises = exercises.map(exercise => EXERCISES[exercise]);
  const userData = [{ id:0, hue: 345 }, { id: 1, hue: 190 }, { id:2, hue: 50 }];

  const sets = [];
  const save = (set, samples: RepSamples, interrupted: boolean) => {
    let data: any = { set, samples, interrupted };
    if (!interrupted) {
      const reps = samples.filter(s => s.concentric).map(sample => {
        const forces = sample.concentric.map(c => c.left.force + c.right.force);
        const velocities = sample.concentric.map(c => Math.abs(c.left.velocity) > Math.abs(c.right.velocity) ? c.left.velocity : c.right.velocity);
        const powers = sample.concentric.map((c, i) => forces[i] * velocities[i]);
        return {
          sample,
          force: {
            min: Math.min(...forces),
            max: Math.max(...forces),
            mean: forces.reduce((a, b) => a + b, 0) / forces.length,
            median: forces.sort((a, b) => a - b)[Math.floor(forces.length / 2)],
          },
          velocity: {
            min: Math.min(...velocities),
            max: Math.max(...velocities),
            mean: velocities.reduce((a, b) => a + b, 0) / velocities.length,
            median: velocities.sort((a, b) => a - b)[Math.floor(velocities.length / 2)],
          },
          power: {
            min: Math.min(...powers),
            max: Math.max(...powers),
            mean: powers.reduce((a, b) => a + b, 0) / powers.length,
            median: powers.sort((a, b) => a - b)[Math.floor(powers.length / 2)],
          }
        }
      });

      const maxPower = Math.max(...reps.map(r => r.power.max));
      const maxForce = Math.max(...reps.map(r => r.force.max));
      const maxMeanPower = Math.max(...reps.map(r => r.power.mean));
      const maxMinForce = Math.max(...reps.map(r => r.force.min));

      const weightedReps = reps.slice(0, reps.findIndex(r => r.force.min === maxMinForce) + 1).reduce((count, r) => count + Math.pow(r.force.min / maxMinForce, 2), 0);
      const estimated1rm = maxMinForce * (36 / (37 - weightedReps));

      data.metrics = { reps, maxPower, maxForce, maxMeanPower, maxMinForce, weightedReps, estimated1rm };

      console.log(data.metrics);
    }
    localStorage.setItem("workoutSets", JSON.stringify(JSON.parse(localStorage.getItem("workoutSets") ?? "[]").concat(data).slice(-1000)));
  }

  const addSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = setExercises[exerciseIndex];
    const ratio = exercise.ratio * (1 + setIndex * 0.1);
    const minVelocity = 50 + 1.5 * (1000 * (exercise.mvt ?? 0.25));
    const maxVelocity = 400 + Math.floor(minVelocity / 2);
    for (let userIndex = 0; userIndex < users; userIndex++) {
      sets.push(() => {
        return {
          exercise,
          user: userData[userIndex],
          mode: WORKOUT_MODE.ADAPTIVE,
          modeConfig: { ratio, maxVelocity, minVelocity },
          limit: WORKOUT_LIMIT.SPOTTER,
          limitConfig: { hardReps },
          rest: exerciseIndex % setExercises.length === 0 ? 10000 : 10000,
        }
      });
    }
  }

  if (superset) {
    for (let setIndex = 0; setIndex < numSets; setIndex++) {
      for (let exerciseIndex = 0; exerciseIndex < setExercises.length; exerciseIndex++) {
        addSet(exerciseIndex, setIndex);
      }
    }
  } else {
    for (let exerciseIndex = 0; exerciseIndex < setExercises.length; exerciseIndex++) {
      for (let setIndex = 0; setIndex < numSets; setIndex++) {
        addSet(exerciseIndex, setIndex);
      }
    }
  }

  return [sets, save] as const;
}