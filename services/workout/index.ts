import { Exercise, PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES, ACCESSORY_EXERCISES, EXERCISES } from "./exercises";
import { WORKOUT_MODE } from "./modes";
import { saveSet } from "../db/settings.js";
import { getSetMetrics } from "./util.js";
import { Sample, encodeSamples } from "../device/cables.js";

export type { Exercise };

export type SetConfig = {
  exercise: Exercise;
  rest: number;
  mode: keyof typeof WORKOUT_MODE;
  modeConfig: {
    e1rm?: number,
    time?: number, 
    reps?: number, 
    ratio?: number 
  },
  userId: string;
  hue: number;
};

export type WorkoutConfig = {
  users: string[];
  superset: boolean;
  exercises: Array<keyof Exercise>;
  mode: keyof typeof WORKOUT_MODE;
  sets: number;
  reps?: number;
  time?: number;
  rir?: number;
  forcedReps?: number;
  assistance?: number;
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

export function createWorkoutIterator({ sets: numSets, mode, exercises: exerciseIds, superset, users: userIds, ...modeConfig }: WorkoutConfig) {
  const users = DEFAULT_USERS;
  const workout_id = Math.random() + "";

  const sets = [];
  const save = (set: SetConfig, samples: Sample[], range: { top: number, bottom: number }, interrupted: boolean) => {
    const metrics = getSetMetrics(samples, range);
    const metricKey = set.mode === "ECCENTRIC" ? "eccentric" : "concentric";

    saveSet({
      user_id: set.userId,
      workout_id,
      exercise_id: set.exercise.id,
      time: Date.now(),
      mode: set.mode,
      modeConfig: set.modeConfig,
      stats: {
        maxMinForce: metrics[metricKey].maxMinForce,
        reps: metrics[metricKey].samples.length,
        e1rm: metrics.e1rm
      },
      range,
      _attachments: {
        "samples.bin": {
          content_type: "application/octet-stream",
          data: new Blob([encodeSamples(samples)])
        }
      }
    }).then(console.log).catch(console.error);
    // let data: WorkoutSet = { set, samples, metrics, interrupted };
    // localStorage.setItem("workoutSets", JSON.stringify(JSON.parse(localStorage.getItem("workoutSets") ?? "[]").concat(data).slice(-1000)));
  }

  const addSet = (exerciseId: string, setIndex: number) => {
    const exercise = EXERCISES[exerciseId];
    for (const userId of userIds) {
      const user = users[userId];
      const e1rm = user.exercises?.[exerciseId]?.e1rm ?? user.squat * exercise.ratio;
      sets.push(() => {
        return {
          exercise,
          userId,
          hue: user.hue,
          mode,
          modeConfig: { e1rm, setIndex, mvt: exercise.mvt, ...modeConfig },
          rest: 10000,
        }
      });
    }
  }

  if (superset) {
    for (let setIndex = 0; setIndex < numSets; setIndex++) {
      for (const exerciseId of exerciseIds) {
        addSet(exerciseId, setIndex);
      }
    }
  } else {
    for (const exerciseId of exerciseIds) {
      for (let setIndex = 0; setIndex < numSets; setIndex++) {
        addSet(exerciseId, setIndex);
      }
    }
  }

  return [sets, save] as const;
}
