import { getForces, getReps } from "../device/activate";
import { promisifyTimeout } from "../util/promisify.js";
import { reactivePromise } from '../util/signals.js';
import { Accessor, createEffect, untrack } from "solid-js";
import { RepSamples } from "./hook";
import { calculateMeanVelocity } from "./util";
import { beep, beepBeepBeep } from "../util/sounds";

export const WORKOUT_MODE = {
  STATIC: "STATIC",
  ISOKINETIC: "ISOKINETIC",
  ECCENTRIC: "ECCENTRIC",
  CONCENTRIC: "CONCENTRIC",
  ASSESSMENT: "ASSESSMENT",
  ADAPTIVE: "ADAPTIVE",
  TUT: "TUT",
  PUMP: "PUMP",
} as const;

export const ACTIVE_WORKOUT_MODES = [
  WORKOUT_MODE.ADAPTIVE,
  WORKOUT_MODE.STATIC,
  WORKOUT_MODE.TUT,
  // WORKOUT_MODE.ISOKINETIC,
  WORKOUT_MODE.ECCENTRIC,
  // WORKOUT_MODE.CONCENTRIC,
  // WORKOUT_MODE.ASSESSMENT,
  WORKOUT_MODE.PUMP
];

const MAX_REPS = 126;
const MAX_WEIGHT = 100;

type WorkoutModeConfigs = {
  [key in keyof typeof WORKOUT_MODE]?: {
    name: string;
    description: string;
    getActivationConfig: (params: { e1rm: number, intensity: number, reps: number, time: number, mvt?: number }) => {
      reps: ReturnType<typeof getReps>,
      forces: ReturnType<typeof getForces>,
      limit: LimitFunction;
      display: {
        weight?: number;
        reps?: number;
        time?: number;
        lowVelocity?: number;
        highVelocity?: number;
      };
    };
  }
}
type LimitHandlers = {
  [key in keyof typeof WORKOUT_LIMIT]?: (params: any) => LimitFunction;
}
type LimitFunction = (repCount: () => number, repSamples: () => RepSamples, abort: Accessor<boolean>) => Promise<any>;

export const WORKOUT_MODE_CONFIGS: WorkoutModeConfigs = {
  [WORKOUT_MODE.ADAPTIVE]: {
    name: "Assess",
    description: "Strength Test",
    getActivationConfig({ e1rm, intensity, reps, time, mvt }) {
      const [hardReps, multiplier] = {
        1: [3, 1.75], 
        2: [3, 1.5], 
        3: [3, 1.25], 
        4: [4, 1.5], 
        5: [4, 1.25], 
        6: [4, 1.1], 
        7: [5, 1.25],
        8: [5, 1.1],
        9: [5, 1],
      }[intensity];
      const rampUp = Math.pow(e1rm, 1.1) / (1 + multiplier);
      const minVelocity = (30 + 1000 * (mvt ?? 0.25)) * multiplier;
      const maxVelocity = 400 + Math.floor(minVelocity / 2);
      console.log({ hardReps, minVelocity, maxVelocity });
      return {
        reps: getReps(MAX_REPS),
        forces: getForces(MAX_WEIGHT, {
          concentric: {
            decrease: { minMmS: minVelocity - 600, maxMmS: minVelocity - 1, ramp: rampUp * 0.75 },
            increase: { minMmS: maxVelocity + 1, maxMmS: maxVelocity + 600, ramp: rampUp },
          },
          eccentric: {
            decrease: { minMmS: -1300, maxMmS: -1200, ramp: 0 },
            increase: { minMmS: -100, maxMmS: -50, ramp: 0 },
          },
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.SPOTTER]({ hardReps }),
        display: {
          hardReps,
          lowVelocity: minVelocity,
          highVelocity: maxVelocity,
        }
      }
    }
  },
  [WORKOUT_MODE.STATIC]: {
    name: "Isotonic",
    description: "Old School",
    getActivationConfig({ e1rm, intensity, reps, time, mvt }) {
      const weight = getAppropriateWeight(WORKOUT_MODE.STATIC, e1rm, intensity, reps);
      console.log({ weight, e1rm, intensity, reps });
      return {
        reps: getReps(reps),
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: 0, maxMmS: 20, ramp: 3 },
            increase: { minMmS: 75, maxMmS: 600, ramp: 0 },
          },
          eccentric: {
            decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
            increase: { minMmS: -100, maxMmS: -50, ramp: 40 },
          },
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.REPS_FAILURE]({ reps }),
        display: {
          weight,
          reps,
          lowVelocity: mvt
        }
      }
    }
  },
  [WORKOUT_MODE.TUT]: {
    name: "TUT",
    description: "Time Under Tension",
    getActivationConfig({ e1rm, intensity, reps, time }) {
      const weight = getAppropriateWeight(WORKOUT_MODE.STATIC, e1rm, intensity, reps);
      const rampDown = 2 * Math.pow(weight, 1/3);
      const rampUp = rampDown * (1.5 + intensity / 10 * 3);
      const spotVelocity = 200 + (1 - intensity / 10) * 200;
      const loadVelocity = spotVelocity + 100;
      return {
        reps: getReps(reps),
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: spotVelocity - 100, maxMmS: spotVelocity, ramp: rampDown },
            increase: { minMmS: loadVelocity, maxMmS: loadVelocity + 100, ramp: 50 },
          },
          eccentric: {
            decrease: { minMmS: -550, maxMmS: -500, ramp: 100 },
            increase: { minMmS: -100, maxMmS: -50, ramp: rampUp },
          }
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.REPS]({ reps }),
        display: {
          weight,
          reps,
          lowVelocity: spotVelocity,
          highVelocity: loadVelocity,
        }
      }
    }
  },
  [WORKOUT_MODE.ECCENTRIC]: {
    name: "Eccentric",
    description: "Eccentric Only",
    getActivationConfig({ e1rm, intensity, reps, time }) {
      const weight = getAppropriateWeight(WORKOUT_MODE.STATIC, e1rm, intensity, reps);
      return {
        reps: getReps(reps),
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: 50, maxMmS: 550, ramp: 50 },
            increase: { minMmS: 650, maxMmS: 750, ramp: 10 },
          },
          eccentric: {
            decrease: { minMmS: -550, maxMmS: -500, ramp: 100 },
            increase: { minMmS: -100, maxMmS: -50, ramp: 20 },
          }
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.REPS]({ reps }),
        display: {
          weight,
          reps,
        }
      }
    }
  },
  [WORKOUT_MODE.PUMP]: {
    name: "Pump",
    description: "Power Output",
    getActivationConfig({ e1rm, intensity, reps, time }) {
      const weight = getAppropriateWeight(WORKOUT_MODE.PUMP, e1rm, intensity, reps);
      return {
        reps: getReps(MAX_REPS),
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: 50, maxMmS: 450, ramp: 10 },
            increase: { minMmS: 500, maxMmS: 600, ramp: 50 },
          },
          eccentric: {
            decrease: { minMmS: -700, maxMmS: -550, ramp: 1 },
            increase: { minMmS: -100, maxMmS: -50, ramp: 1 },
          }
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.TIME]({ time }),
        display: {
          weight,
          time,
          lowVelocity: 450,
          highVelocity: 500
        }
      }
    }
  },
  [WORKOUT_MODE.ISOKINETIC]: {
    name: "Isokinetic",
    description: "Constant Velocity",
    getActivationConfig({ e1rm, intensity, reps, time }) {
      const targetVelocity = 200 + (1 - intensity / 10) * 200;
      return {
        reps: getReps(reps),
        forces: getForces(MAX_WEIGHT, {
          concentric: {
            decrease: { minMmS: 0, maxMmS: targetVelocity - 1, ramp: e1rm * 0.4 },
            increase: { minMmS: targetVelocity + 1, maxMmS: targetVelocity + 400, ramp: e1rm },
          },
          eccentric: {
            decrease: { minMmS: -targetVelocity - 400, maxMmS: -targetVelocity - 1, ramp: e1rm },
            increase: { minMmS: -targetVelocity + 1, maxMmS: 0, ramp: e1rm * 0.4 },
          },
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.REPS]({ reps }),
        display: {
          reps,
          lowVelocity: targetVelocity - 1,
          highVelocity: targetVelocity + 1,
        }
      }
    }
  },
  [WORKOUT_MODE.CONCENTRIC]: {
    name: "Concentric",
    description: "Concentric Only",
    getActivationConfig({ e1rm, intensity, reps, time }) {
      const weight = getAppropriateWeight(WORKOUT_MODE.CONCENTRIC, e1rm, intensity, reps + 10);
      return {
        reps: getReps(reps),
        forces: getForces(weight, {
          concentric: {
            decrease: { minMmS: 0, maxMmS: 20, ramp: 3 },
            increase: { minMmS: 75, maxMmS: 600, ramp: 0 },
          },
          eccentric: {
            decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
            increase: { minMmS: -100, maxMmS: -50, ramp: 40 },
          }
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.REPS]({ reps }),
        display: {
          weight,
          reps,
        }
      }
    }
  },
  [WORKOUT_MODE.ASSESSMENT]: {
    name: "Assessment",
    description: "Assessment",
    getActivationConfig({ e1rm, intensity, reps, time }) {
      const rampUp = Math.pow(e1rm, 1.1) / 2;
      const targetVelocity = 200 + (1 - intensity / 10) * 200;
      const stopVelocity = targetVelocity - 50;
      return {
        reps: getReps(reps),
        forces: getForces(MAX_WEIGHT, {
          concentric: {
            decrease: { minMmS: 0, maxMmS: 0, ramp: 0 },
            increase: { minMmS: targetVelocity, maxMmS: 1500, ramp: rampUp },
          },
          eccentric: {
            decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
            increase: { minMmS: -100, maxMmS: -50, ramp: 0 },
          },
        }),
        limit: LIMIT_HANDLERS[WORKOUT_LIMIT.ASSESSMENT]({ stopVelocity, minReps: 2, forceThreshold: 0.1 }),
        display: {
          highVelocity: targetVelocity,
          lowVelocity: stopVelocity,
        }
      };
    }
  }
};

export const WORKOUT_LIMIT = {
  REPS: "REPS",
  TIME: "TIME",
  VELOCITY_LOSS: "VELOCITY_LOSS",
  ASSESSMENT: "ASSESSMENT",
  FAILURE: "FAILURE",
  SPOTTER: "SPOTTER",
  REPS_FAILURE: "REPS_FAILURE",
} as const;

export const LIMIT_HANDLERS: LimitHandlers = {
  [WORKOUT_LIMIT.REPS]: ({ reps }) => {
    return (repCount, repSamples, aborted) => {
      return reactivePromise((resolve) => {
        createEffect(() => {
          if (repCount() >= reps) {
            beepBeepBeep();
            resolve();
          } else if (repCount() > reps - 3 && reps % 1 === 0) {
            beep();
          }
        })
      }, aborted)
    };
  },
  [WORKOUT_LIMIT.TIME]: ({ time }) => {
    const timeMs = time * 1000;
    return async() => {
      await promisifyTimeout(timeMs - 2000);
      beep();
      await promisifyTimeout(1000);
      beep();
      await promisifyTimeout(1000);
      beepBeepBeep();
    }
  },
  [WORKOUT_LIMIT.VELOCITY_LOSS]: ({ velocityThreshold = 0.8, minReps = 2 }) => {
    return (repCount, repSamples, aborted) => {
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
    };
  },
  [WORKOUT_LIMIT.ASSESSMENT]: ({ stopVelocity, minReps = 2, forceThreshold = 0.1 }) => {
    return (repCount, repSamples, aborted) => {
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
    };
  },
  [WORKOUT_LIMIT.SPOTTER]: ({ hardReps = 3 }) => {
    return (repCount, repSamples, aborted) => {
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
    };
  },
  [WORKOUT_LIMIT.FAILURE]: ({ expectedPause = 1, warningCount = 3 }) => {
    return (repCount, repSamples, aborted) => {
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
    };
  },
  [WORKOUT_LIMIT.REPS_FAILURE]: (options) => {
    const reps = LIMIT_HANDLERS[WORKOUT_LIMIT.REPS](options);
    const failure = LIMIT_HANDLERS[WORKOUT_LIMIT.FAILURE](options);
    return (repCount, repSamples, aborted) => {
      return Promise.race([
        reps(repCount, repSamples, aborted),
        failure(repCount, repSamples, aborted)
      ])
    };
  }
} as const;

const minRir = 4; // number reps in reserve when intensity is 0

function getAppropriateWeight(mode, e1rm, intensity, repCount = 15 /* default for pump */) {
  const e1rmMultiplier = mode === "eccentric" ? 1.4 : mode === "tut" ? 1.2 : 1;
  const rir = minRir - intensity * 0.5;
  const repMax = repCount + rir;
  return getMaxWeight(e1rm * e1rmMultiplier, repMax);
}

function getMaxWeight(e1rm, reps) {
  return e1rm / (1 + reps / 30);
}

function getMaxReps(e1rm, weight) {
  return (e1rm / weight - 1) * 30;
}

function getE1rm(weight, reps) {
  return weight * (1 + reps / 30);
}