import { openDB, DBSchema } from 'idb';

interface AppDB extends DBSchema {
  settings: {
    key: string;
    value: number;
  };
  workouts: {
    value: {
      type: string;
      sets: string[];
      time: number;
    };
    key: string;
  };
  sets: {
    value: {
      workout: string;
      exercise: string;
      time: number;
      mode: string;
      samples: Array<{
        time: number;
        left: {
          position: number;
          velocity: number;
          force: number;
        },
        right: {
          position: number;
          velocity: number;
          force: number;
        },
      }>
    };
    key: string;
    indexes: { exercise: number };
  };
}

// const db = await openDB<AppDB>('my-db', 1, {
//   upgrade(db) {
//     db.createObjectStore('settings');
//     const setStore = db.createObjectStore('sets');
//     setStore.createIndex('exercise', 'exercise');
//   },
// });