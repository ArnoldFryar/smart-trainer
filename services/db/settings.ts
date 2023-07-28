import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import { SetConfig } from '../workout';
PouchDB.plugin(PouchFind);

interface PouchDBBaseDocument {
  _id: string;
  _rev?: string;
}

interface PouchDBAttachment<T = string> {
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

interface WorkoutSet extends PouchDBBaseDocument {
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

const db = new PouchDB<Schema>("smartfitness", { auto_compaction: true });
const indexFields = [
  ["time", "type", "user_id"],
  ["type", "user_id", "time"],
  ["type", "user_id", "workout_id"],
  ["type", "user_id", "exercise_id", "time"],
  ["type", "user_id", "exercise_id", "key"],
  ["type", "user_id", "key", "time"]
];

const indexPromise = indexFields.map(fields =>
  db.createIndex({
    index: { 
      fields,
      ddoc: `index-${fields.join("-")}`
    }
  })
);

function upsert<T extends Schema>(type: T["type"], data: PartialSchema<T>) {
  return data._id ? db.put({ type, ...data } as any) : db.post({ type, ...data } as any);
}

async function find<T extends Schema>(type: T["type"], config: PouchDB.Find.FindRequest<any>): Promise<T[]> {
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

(window as any).db = db;