import { getForces, getReps } from "../device/activate";
import { promisifyTimeout } from "../util/promisify.js";
import { reactivePromise } from '../util/signals.js';
import { Accessor, createEffect, createMemo, untrack } from "solid-js";
import { Phase } from "./util";
import { beep, beepBeepBeep, repsLeft } from "../util/sounds";
import { SetConfig } from ".";

export const WORKOUT_MODE = {
  CONVENTIONAL: "CONVENTIONAL",
  PROGRESSION: "PROGRESSION",
  ASSESSMENT: "ASSESSMENT",
  ISOKINETIC: "ISOKINETIC",
  ECCENTRIC: "ECCENTRIC",
} as const;

export const ACTIVE_WORKOUT_MODES = [
  WORKOUT_MODE.CONVENTIONAL,
  WORKOUT_MODE.PROGRESSION,
  WORKOUT_MODE.ASSESSMENT,
  WORKOUT_MODE.ISOKINETIC,
  WORKOUT_MODE.ECCENTRIC,
];

const MAX_REPS = 126;
const MAX_WEIGHT = 100;

type WorkoutModeConfigs = {
  [key in keyof typeof WORKOUT_MODE]?: {
    name: string;
    description: string;
    getActivationConfig: (params: SetConfig["modeConfig"]) => {
      forces: ReturnType<typeof getForces>,
    };
  }
}
type LimitHandlers = {
  [key in keyof typeof WORKOUT_LIMIT]?: (params: any) => { reps: ReturnType<typeof getReps>, limit: LimitFunction };
}
type LimitFunction = (repCount: () => number, phases: () => Phase[], abort: Accessor<boolean>) => Promise<any>;

export const WORKOUT_MODE_CONFIGS: WorkoutModeConfigs = {
  [WORKOUT_MODE.CONVENTIONAL]: {
    name: "Conventional",
    description: "Old School",
    getActivationConfig({ weight, spotterVelocity }) {
      const rampDown = 2 * Math.pow(weight, 1/3);
      const eccentricRampUp = rampDown * 2.5;
      const concentricRampUp = rampDown / 2;
      const loadVelocity = spotterVelocity + 100;
      return {
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: 0, maxMmS: spotterVelocity, ramp: spotterVelocity && rampDown },
            increase: { minMmS: loadVelocity, maxMmS: 500 + loadVelocity / 3, ramp: concentricRampUp },
          },
          eccentric: {
            decrease: { minMmS: -1300, maxMmS: -1200, ramp: weight },
            increase: { minMmS: -50, maxMmS: -20, ramp: eccentricRampUp },
          },
        }),
      }
    }
  },
  [WORKOUT_MODE.PROGRESSION]: {
    name: "Progression",
    description: "Old School",
    getActivationConfig({ weight, maxWeight, progressionReps, spotterVelocity }) {
      const rampDown = 2 * Math.pow(weight, 1/3);
      const eccentricRampUp = rampDown * 2.5;
      const concentricRampUp = rampDown / 2;
      const loadVelocity = spotterVelocity + 100;
      const weightIncrement = maxWeight && ((maxWeight - weight) / progressionReps);
      return {
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: 0, maxMmS: spotterVelocity, ramp: spotterVelocity && rampDown },
            increase: { minMmS: loadVelocity, maxMmS: 500 + loadVelocity / 3, ramp: concentricRampUp },
          },
          eccentric: {
            decrease: { minMmS: -1300, maxMmS: -1200, ramp: weight },
            increase: { minMmS: -50, maxMmS: -20, ramp: eccentricRampUp },
          },
        }, weightIncrement, maxWeight),
      }
    }
  },
  [WORKOUT_MODE.ECCENTRIC]: {
    name: "Eccentric",
    description: "Eccentric Only",
    getActivationConfig({ weight, spotterVelocity }) {
      const rampDown = 2 * Math.pow(weight, 1/3);
      const concentricRampDown = rampDown * 2;
      const concentricRampUp = rampDown / 3;
      const eccentricRampUp = rampDown * 1.5;
      return {
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: 50, maxMmS: 550, ramp: concentricRampDown },
            increase: { minMmS: 650, maxMmS: 750, ramp: concentricRampUp },
          },
          eccentric: {
            decrease: { minMmS: spotterVelocity - 50, maxMmS: -spotterVelocity, ramp: rampDown },
            increase: { minMmS: -100, maxMmS: -50, ramp: eccentricRampUp },
          }
        }),
      }
    }
  },
  [WORKOUT_MODE.ISOKINETIC]: {
    name: "Isokinetic",
    description: "Constant Velocity",
    getActivationConfig({ spotterVelocity }) {
      return {
        forces: getForces(MAX_WEIGHT, {
          concentric: {
            decrease: { minMmS: spotterVelocity - 400, maxMmS: spotterVelocity - 1, ramp: 50 },
            increase: { minMmS: spotterVelocity + 1, maxMmS: spotterVelocity + 50, ramp: 50 },
          },
          eccentric: {
            decrease: { minMmS: -spotterVelocity - 400, maxMmS: -spotterVelocity - 1, ramp: 0 },
            increase: { minMmS: -spotterVelocity + 1, maxMmS: 0, ramp: 0 },
          },
        }),
      }
    }
  },
  [WORKOUT_MODE.ASSESSMENT]: {
    name: "Assessment",
    description: "Adaptive",
    getActivationConfig({ weight, spotterVelocity }) {
      const rampUp = Math.pow(weight, 1.1) / 2.5;
      const loadVelocity = 400 + Math.floor(spotterVelocity / 2);
      return {
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: spotterVelocity - 600, maxMmS: spotterVelocity - 1, ramp: rampUp * 0.75 },
            increase: { minMmS: loadVelocity + 1, maxMmS: loadVelocity + 600, ramp: rampUp },
          },
          eccentric: {
            decrease: { minMmS: -1300, maxMmS: -1200, ramp: 0 },
            increase: { minMmS: -100, maxMmS: -50, ramp: 0 },
          },
        })
      }
    }
  },
};

export const WORKOUT_LIMIT = {
  REPS: "REPS",
  TIME: "TIME",
  VELOCITY_LOSS: "VELOCITY_LOSS",
  FORCED_REPS: "FORCED_REPS",
  FAILURE: "FAILURE",
} as const;

export const LIMIT_HANDLERS: LimitHandlers = {
  [WORKOUT_LIMIT.REPS]: ({ reps, expectedPause, warningCount }) => {
    return {
      reps: getReps(reps),
      limit: withFailure({ expectedPause, warningCount }, (repCount, _phases, aborted) => {
        return reactivePromise((resolve) => {
          createEffect(() => {
            if (repCount() >= reps) {
              beepBeepBeep();
              resolve();
            } else if (repCount() > reps - 3 && repCount() % 1 === 0) {
              repsLeft(reps - repCount());
            }
          })
        }, aborted)
      })
    };
  },
  [WORKOUT_LIMIT.TIME]: ({ time, expectedPause, warningCount }) => {
    const timeMs = time * 1000;
    return {
      reps: getReps(MAX_REPS),
      limit: withFailure({ expectedPause, warningCount }, async () => {
        await promisifyTimeout(timeMs - 2000);
        beep();
        await promisifyTimeout(1000);
        beep();
        await promisifyTimeout(1000);
        beepBeepBeep();
      })
    }
  },
  [WORKOUT_LIMIT.VELOCITY_LOSS]: ({ velocityThreshold = 0.8, minReps = 2, expectedPause, warningCount }) => {
    return {
      reps: getReps(MAX_REPS),
      limit: withFailure({ expectedPause, warningCount }, (repCount, phases, aborted) => {
        return reactivePromise((resolve) => {
          // TODO: reverse for eccentric (velocity gain)
          const concentricReps = () => phases().filter(p => p.phase === "concentric");
          const repVelocities = () => concentricReps().map((rep) => rep.velocity.mean);
          const bestVelocity = () => Math.max(...repVelocities());
          const lastVelocity = () => repVelocities()[Math.floor(repCount() - 1)];
          createEffect(() => {
            if (repCount() > minReps && lastVelocity() < bestVelocity() * velocityThreshold) {
              resolve();
            }
          })
        }, aborted)
      })
    };
  },
  [WORKOUT_LIMIT.FORCED_REPS]: ({ forcedReps, expectedPause, warningCount }) => {
    return {
      reps: getReps(MAX_REPS),
      limit: withFailure({ expectedPause, warningCount }, (_repCount, phases, aborted) => {
        return reactivePromise((resolve) => {
          // TODO: support eccentric forced reps
          const completedPhases = () => phases().slice(0, -1);
          const concentricReps = () => completedPhases().filter(p => p.phase === "concentric");
          const concentricRepCount = createMemo(() => concentricReps().length);
          const prevRep = (i: number) => concentricReps()[Math.floor(concentricRepCount() - i)];
          const maxMedianForce = () => Math.max(...concentricReps().map(rep => rep.force.median));
          let currentForcedReps = 0;
          createEffect(() => {
            if (concentricRepCount() >= 3) {
              untrack(() => {
                if (prevRep(1).force.median < maxMedianForce()) {
                  if (++currentForcedReps === forcedReps) {
                    console.log("done");
                    beepBeepBeep();
                    resolve();
                  } else {
                    repsLeft(forcedReps - currentForcedReps);
                  }
                } else if (currentForcedReps > 0) {
                  repsLeft(forcedReps - currentForcedReps);
                }
              });
            }
          })
        }, aborted)
      })
    };
  },
  [WORKOUT_LIMIT.FAILURE]: ({ expectedPause = 1, warningCount = 3 }) => {
    return {
      reps: getReps(MAX_REPS),
      limit: (_repCount, _phases, aborted) => {
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
    };
  }
} as const;

function withFailure(options, baseLimit: LimitFunction): LimitFunction {
  return (repCount, phases, aborted) => Promise.race([
    baseLimit(repCount, phases, aborted),
    LIMIT_HANDLERS[WORKOUT_LIMIT.FAILURE](options).limit(repCount, phases, aborted)
  ]);
}

function getAppropriateWeight(mode, e1rm, rir, repCount = 15 /* default for pump */) {
  const e1rmMultiplier = mode === WORKOUT_MODE.ECCENTRIC ? 1.4 : 1;
  const repMax = repCount + rir;
  return estimateXRepMaxLombardi(e1rm * e1rmMultiplier, repMax);
}

function getMaxWeight(e1rm, reps) {
  return e1rm / (1 + reps / 30);
}

function estimateXRepMaxLombardi(oneRepMax: number, reps: number) {
  return oneRepMax / Math.pow(reps, 0.1);
}

function getMaxReps(e1rm, weight) {
  return (e1rm / weight - 1) * 30;
}

function getE1rm(weight, reps) {
  return weight * (1 + reps / 30);
}