import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import { SetConfig } from '../workout';
import { Sample, decodeSamples } from '../device/cables';
import { createLocalSignal } from '../util/signals';
import { createEffect } from 'solid-js';
PouchDB.plugin(PouchFind);

export interface PouchDBBaseDocument {
  _id: string;
  _rev?: string;
}

export interface PouchDBAttachment<T = string> {
  content_type: T;
  data?: string | Blob,
  digest?: string,
  stub?: boolean
}

interface Workout extends PouchDBBaseDocument {
  type: "WORKOUT",
  sets_ids: string[];
  time: number;
}

export interface WorkoutSet extends PouchDBBaseDocument {
  type: "WORKOUT_SET",
  user_id: string;
  workout_id: string;
  exercise_id: string;
  time: number;
  mode: SetConfig["mode"];
  modeConfig: SetConfig["modeConfig"];
  bestEffort: {
    reps: number;
    weight: number;
  };
  e1rm: number;
  range: {
    top: number;
    bottom: number;
  },
  _attachments: {
    "samples.bin": PouchDBAttachment<"application/octet-stream">
  };
}

interface User extends PouchDBBaseDocument {
  type: "USER",
  name: string;
}

interface UserSetting extends PouchDBBaseDocument {
  type: "USER_SETTING",
  user_id: string;
  key: string;
  value: unknown;
}

interface PersonalBest extends PouchDBBaseDocument {
  type: "PERSONAL_BEST",
  user_id: string;
  exercise_id: string;
  set_id: string;
  key: string;
  value: number;
  time: number;
}

type Schema = Workout | WorkoutSet | User | UserSetting | PersonalBest;
type PartialSchema<T extends Schema> = Omit<T, "_id" | "type"> & { _id?: string };

export const db = new PouchDB<Schema>("smartfitness", { auto_compaction: true });
const indexFields = [
  ["time", "type", "user_id"],
  ["type", "user_id", "time"],
  ["type", "user_id", "workout_id"],
  ["type", "user_id", "exercise_id", "time"],
  ["e1rm", "type", "user_id", "exercise_id", "time"],
  ["bestEffort.weight", "type", "user_id", "exercise_id", "bestEffort.reps", "time"],
  ["bestEffort.reps", "type", "user_id", "exercise_id"],
  ["type", "user_id", "exercise_id", "key"],
  ["type", "user_id", "key", "time"]
];

const [couchdb] = createLocalSignal("couchdb-url", "");
createEffect<{ sync?, remote? }>((prev) => {
  prev.sync?.cancel();
  prev.remote?.close();

  const remote = new PouchDB(couchdb());
  const sync = db.sync(remote, { live:true, retry: true });

  return { sync, remote };
}, {})

const indexPromise = Promise.all(indexFields.map(fields =>
  db.createIndex({
    index: { 
      fields,
      ddoc: `index-${fields.join("-")}`
    }
  })
));

function upsert<T extends Schema>(type: T["type"], data: PartialSchema<T>) {
  return data._id ? db.put({ type, ...data } as any) : db.post({ type, ...data } as any);
}

async function find<T extends Schema>(type: T["type"], config: PouchDB.Find.FindRequest<any>): Promise<T[]> {
  await indexPromise;

  return (await db.find({
    ...config,
    selector: {
      type,
      ...config.selector
    }
  })).docs as any;
}

export async function getUsers(): Promise<User[]> {
  return (await db.find({
    selector: {
      type: "USER"
    }
  })).docs as User[];
}

export async function getUser(user_id: string): Promise<User> {
  return await db.get(user_id);
}

export function saveUser(user: PartialSchema<User>) {
  return upsert("USER", user);
}

export async function getSets(user_id: string) {
  const sets = await find("WORKOUT_SET", {
    selector: { user_id, time: { $gt: 0 } },
    sort: [{ time: "desc" }],
  });
  return sets as WorkoutSet[];
}

export async function getSetsForExercise(user_id: string, exercise_id: string) {
  const sets = await find("WORKOUT_SET", {
    selector: { user_id, exercise_id, time: { $gt: 0 } },
    sort: [{ time: "desc" }],
  });
  return sets as WorkoutSet[];
}

export async function getSet(set_id: string): Promise<WorkoutSet> {
  return await db.get(set_id);
}

export async function getSetSamples(set_id: string): Promise<Sample[]> {
  const samplesBlob = await db.getAttachment(set_id, "samples.bin") as Blob;
  return decodeSamples(await samplesBlob.arrayBuffer());
}

export async function saveSet(set: PartialSchema<WorkoutSet>) {
  return upsert("WORKOUT_SET", set);
}

export async function getLatestExercisePBs(user_id: string, exercise_id: string) {
  const allExercisePBHistory = (await db.find({
    selector: {
      type: "PERSONAL_BEST",
      user_id,
      exercise_id
    },
    sort: [{ time: "desc" }]
  })).docs as PersonalBest[];

  const latestPBs = allExercisePBHistory.reduce((latestPBs, pb) => {
    if (!latestPBs[pb.key]) {
      latestPBs[pb.key] = pb;
    }
    return latestPBs;
  }, {} as Record<string, PersonalBest>);

  return latestPBs;
}

export async function getExercisePBHistory(user_id: string, exercise_id: string, key: string) {
  return (await db.find({
    selector: {
      type: "PERSONAL_BEST",
      user_id,
      exercise_id,
      key
    },
    sort: [{ time: "desc" }]
  })).docs as PersonalBest[];
}

export async function getLatestExercisePB(user_id: string, exercise_id: string, key: string) {
  return (await db.find({
    selector: {
      type: "PERSONAL_BEST",
      user_id,
      exercise_id,
      key
    },
    sort: [{ time: "desc" }],
    limit: 1
  })).docs[0] as PersonalBest;
}

export async function getLatestPB(user_id: string) {
  return (await db.find({
    selector: {
      type: "PERSONAL_BEST",
      user_id
    },
    sort: [{ time: "desc" }],
    limit: 1
  })).docs[0] as PersonalBest;
}

export async function savePB(pb: PartialSchema<PersonalBest>) {
  return upsert("PERSONAL_BEST", pb);
}

export async function getEstimated1RepMax(user_id: string, exercise_id: string, time: number = Date.now()) {
  const bestSets = (await db.find({
    selector: {
      type: "WORKOUT_SET",
      user_id,
      exercise_id,
      time: { $lt: time },
      e1rm: { $gt: null },
    },
    sort: [{ e1rm: "desc" }],
    limit: 1
  })).docs as WorkoutSet[];

  return bestSets[0];
}

export async function getActualRepMax(user_id: string, exercise_id: string, reps: number, time: number = Date.now()) {
  const bestSets = (await db.find({
    selector: {
      type: "WORKOUT_SET",
      user_id,
      exercise_id,
      "bestEffort.reps": reps,
      "bestEffort.weight": { $gt: null},
      time: { $lt: time },
    },
    sort: [{ "bestEffort.weight": "desc" }],
    limit: 1
  })).docs as WorkoutSet[];

  return bestSets[0];
}

export async function getHighestRepMax(user_id: string, exercise_id: string) {
  const bestSets = (await db.find({
    selector: {
      type: "WORKOUT_SET",
      user_id,
      exercise_id,
      "bestEffort.reps": { $gt: null },
    },
    sort: [{ "bestEffort.reps": "desc" }],
    limit: 1
  })).docs as WorkoutSet[];

  return bestSets[0]?.bestEffort.reps ?? 0;
}

export async function getAllRepMaxes(user_id: string, exercise_id: string) {
  const maxReps = await getHighestRepMax(user_id, exercise_id);
  const bestSets = [];
  for (let reps = 1; reps <= maxReps; reps++) {
    bestSets.push(getActualRepMax(user_id, exercise_id, reps));
  }
  return Promise.all(bestSets);
}

(window as any).db = db;