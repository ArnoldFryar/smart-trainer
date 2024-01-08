import { Exercise, PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES, ACCESSORY_EXERCISES, EXERCISES } from "./exercises";
import { WORKOUT_LIMIT, WORKOUT_MODE } from "./modes";
import { saveSet } from "../db/settings.js";
import { getSetMetrics } from "./util.js";
import { Sample, encodeSamples } from "../device/cables.js";

export type { Exercise };

export type SetConfig = {
  exercise: Exercise;
  rest: number;
  mode: keyof typeof WORKOUT_MODE;
  modeConfig: {
    weight?: number;
    maxWeight?: number;
    progressionReps?: number;
    spotterVelocity?: number;
  },
  limit: keyof typeof WORKOUT_LIMIT;
  limitConfig: {
    reps?: number;
    time?: number;
    forcedReps?: number;
    velocityLoss?: number;
  }
  userId: string;
  hue: number;
};

export type WorkoutConfig = {
  users: string[];
  sets: Array<{
    exercise: keyof Exercise;
    mode: keyof typeof WORKOUT_MODE;
    limit: keyof typeof WORKOUT_LIMIT;
    weight?: number;
    maxWeight?: number;
    progressionReps?: number;
    spotterVelocity?: number;
    reps?: number;
    time?: number;
    forcedReps?: number;
    velocityLoss?: number;
  }>;
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

export const DEFAULT_USERS = {
  "MICHAEL": {
    name: "Michael",
    hue: 335,
    squat: 45
  },
  "ANNA": {
    name: "Anna",
    hue: 250,
    squat: 25
  },
  "LEWIS": {
    name: "Lewis",
    hue: 180,
    squat: 4
  },
  "DAVID": {
    name: "David",
    hue: 40,
    squat: 25
  },
}

export function createWorkoutIterator({ sets, users: userIds }: WorkoutConfig) {
  const users = DEFAULT_USERS;
  const workout_id = Math.random() + "";

  const setConfigs: Array<() => Promise<SetConfig>> = [];
  const save = (set: SetConfig, samples: Sample[], range: { top: number, bottom: number }, interrupted: boolean) => {
    const metrics = getSetMetrics(samples, range);
    const baseObject = set.mode === "ECCENTRIC" ? metrics.eccentric : metrics;
    const repMaxes = baseObject.repMaxes;

    saveSet({
      user_id: set.userId,
      workout_id,
      exercise_id: set.exercise.id,
      time: Date.now(),
      mode: set.mode,
      modeConfig: set.modeConfig,
      bestEffort: {
        reps: repMaxes.best,
        weight: repMaxes[repMaxes.best]
      },
      e1rm: metrics.e1rm,
      range,
      _attachments: {
        "samples.bin": {
          content_type: "application/octet-stream",
          data: new Blob([encodeSamples(samples)])
        }
      }
    }).then(console.log).catch(console.error);
  }

  for (const set of sets) {
    const { exercise: exerciseId, mode, limit, weight, maxWeight, progressionReps, spotterVelocity, ...limitConfig } = set;
    const exercise = EXERCISES[set.exercise];
    for (const userId of userIds) {
      const user = users[userId];
      setConfigs.push(async () => {
        return {
          exercise,
          userId,
          hue: user.hue,
          mode,
          modeConfig: normalizeModeConfig({ weight, maxWeight, progressionReps, spotterVelocity }),
          limit,
          limitConfig,
          rest: 10000,
        }
      });
    }
  }

  return [setConfigs, save] as const;
}

function normalizeModeConfig(config) {
  if (config.spotterVelocity) {
    // m/s to mm/s
    config.spotterVelocity *= 1000;
  }
  if (config.weight) {
    // lbs to kg
    config.weight /= 2 * 2.2;
  }
  if (config.maxWeight) {
    // lbs to kg
    config.maxWeight /= 2 * 2.2;
  }
  return config;
}