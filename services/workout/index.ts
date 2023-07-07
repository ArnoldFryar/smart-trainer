import type DB from "../db/settings.js";
import { RepSamples } from "./hook";
import { Exercise, PUSH_EXERCISES, PULL_EXERCISES, LEG_EXERCISES, ACCESSORY_EXERCISES, EXERCISES } from "./exercises";
import { WORKOUT_MODE } from "./modes";

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
  users: string[];
  superset: boolean;
  exercises: Array<keyof Exercise>;
  mode: keyof typeof WORKOUT_MODE;
  sets: number;
  reps: number;
  time: number;
  intensity: number;
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
}

export function createWorkoutIterator({ sets: numSets, time, mode, reps, intensity, exercises: exerciseIds, superset, users: userIds }: WorkoutConfig, db?: typeof DB) {
  const users = DEFAULT_USERS;

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

      const consideredReps = reps.slice(0, reps.findIndex(r => r.force.min === maxMinForce) + 1);

      const weightedReps = consideredReps.reduce((count, r) => count + Math.pow(r.force.min / maxMinForce, 2), 0);
      const estimated1rm = maxMinForce * (36 / (37 - weightedReps));
      const estimated1rm_alt = maxMinForce + consideredReps.reduce((force, r) => force + r.force.mean / 30, 0);

      data.metrics = { reps, maxPower, maxForce, maxMeanPower, maxMinForce, weightedReps, estimated1rm, estimated1rm_alt };

      console.log(data.metrics);
    }
    localStorage.setItem("workoutSets", JSON.stringify(JSON.parse(localStorage.getItem("workoutSets") ?? "[]").concat(data).slice(-1000)));
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
          modeConfig: { e1rm, intensity, reps, time, setIndex, mvt: exercise.mvt },
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
