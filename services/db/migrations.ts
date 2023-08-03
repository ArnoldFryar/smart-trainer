import { SetConfig } from "../workout";
import { getSetMetrics } from "../workout/util";
import { db, getSetSamples, PouchDBAttachment, PouchDBBaseDocument, WorkoutSet } from "./settings";

interface WorkoutSetv1 extends PouchDBBaseDocument {
  type: "WORKOUT_SET",
  user_id: string;
  workout_id: string;
  exercise_id: string;
  time: number;
  mode: SetConfig["mode"];
  modeConfig: SetConfig["modeConfig"];
  stats: {
    reps: number;
    maxMinForce: number;
    e1rm: number;
  };
  range: {
    top: number;
    bottom: number;
  },
  _attachments: {
    "samples.bin": PouchDBAttachment<"application/octet-stream">
  };
}

export async function migrateWorkoutSetsv1() {
  // get all workout sets, update them, and put them back
  const sets = (await db.find({
    selector: {
      type: "WORKOUT_SET"
    }
  })).docs as any as WorkoutSetv1[];

  for (const set of sets) {
    if (set.stats) {
      const samples = await getSetSamples(set._id);
      const metrics = getSetMetrics(samples, set.range);
      const baseObject = set.mode === "ECCENTRIC" ? metrics.eccentric : metrics;
      const repMaxes = baseObject.repMaxes;

      delete set.stats;

      (set as any as WorkoutSet).bestEffort = {
        reps: repMaxes.best,
        weight: repMaxes[repMaxes.best],
        e1rm: repMaxes.e1rm
      };

      await db.put(set as any);
    }
  }
}