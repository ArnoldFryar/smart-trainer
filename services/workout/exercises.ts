const EQUIPMENT = {
  BAR: "BAR",
  HANDLES: "HANDLES",
  BENCH: "BENCH",
  ROPE: "ROPE",
};

const MOVEMENT = {
  VERTICAL_PULL: "VERTICAL_PULL",
  HORIZONTAL_PULL: "HORIZONTAL_PULL",
  VERTICAL_PUSH: "VERTICAL_PUSH",
  HORIZONTAL_PUSH: "HORIZONTAL_PUSH",
  LEGS_SQUAT: "LEGS_SQUAT",
  LEGS_HINGE: "LEGS_HINGE",
}

const BACK_SQUAT_WR = 490;
// https://symmetricstrength.com/standards#/75/kg/male/-
const BACK_SQUAT_SS = 242;
// https://www.t-nation.com/training/know-your-ratios-destroy-weaknesses/
const BENCH_SQUAT_RATIO = 0.75;
// https://strengthlevel.com/
const BACK_SQUAT_SL = 219.2;
const avg = (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length;

export type Exercise = {
  id: string;
  ratio: number;
  mvt: number;
  equipment: string | string[];
  movement?: string;
};

export const EXERCISES: Record<string, Exercise> = {
  BACK_SQUAT: {
    id: "BACK_SQUAT",
    ratio: 1,
    mvt: 0.3,
    equipment: EQUIPMENT.BAR,
    movement: MOVEMENT.LEGS_SQUAT,
  },
  FRONT_SQUAT: {
    id: "FRONT_SQUAT",
    ratio: avg(
      194 / BACK_SQUAT_SS, // 0.803
      172 / BACK_SQUAT_SL, // 0.786
      0.85
    ),
    mvt: 0.3, // TODO: check
    equipment: EQUIPMENT.BAR,
    movement: MOVEMENT.LEGS_SQUAT,
  },
  FLAT_BENCH_PRESS: {
    id: "FLAT_BENCH_PRESS",
    ratio: avg(
      365 / BACK_SQUAT_WR, // 0.744
      181 / BACK_SQUAT_SS, // 0.747
      168.8 / BACK_SQUAT_SL, // 0.770
      BENCH_SQUAT_RATIO, // 0.750
    ),
    equipment: [EQUIPMENT.BAR, EQUIPMENT.BENCH],
    mvt: 0.15,
    movement: MOVEMENT.HORIZONTAL_PUSH,
  },
  INCLINE_BENCH_PRESS: {
    id: "INCLINE_BENCH_PRESS",
    ratio: avg(
      148 / BACK_SQUAT_SS, // 0.611
      149 / BACK_SQUAT_SL, // 0.679
      0.8 * BENCH_SQUAT_RATIO, // 0.600
    ),
    mvt: 0.2, // TODO: check
    equipment: [EQUIPMENT.BAR, EQUIPMENT.BENCH],
    movement: MOVEMENT.HORIZONTAL_PUSH,
  },
  DB_CHEST_PRESS: {
    id: "DB_CHEST_PRESS",
    ratio: avg(
      156 / BACK_SQUAT_SL, // 0.711
    ),
    equipment: [EQUIPMENT.HANDLES, EQUIPMENT.BENCH],
    mvt: 0.15,
    movement: MOVEMENT.HORIZONTAL_PUSH,
  },
  BARBELL_ROW: {
    id: "BARBELL_ROW",
    ratio: avg(
      148 / BACK_SQUAT_SS, // 0.611
      146 / BACK_SQUAT_SL, // 0.667
      0.7 * BENCH_SQUAT_RATIO, // 0.525
    ),
    equipment: EQUIPMENT.BAR,
    mvt: 0.4,
    movement: MOVEMENT.HORIZONTAL_PULL,
  },
  DEADLIFT: {
    id: "DEADLIFT",
    ratio: avg(
      487.5 / BACK_SQUAT_WR, // 0.990
      278 / BACK_SQUAT_SS, // 1.145
      265.9 / BACK_SQUAT_SL, // 1.21
      1.2
    ),
    equipment: EQUIPMENT.HANDLES,
    mvt: 0.15,
    movement: MOVEMENT.LEGS_HINGE,
  },
  OVERHEAD_PRESS: {
    id: "OVERHEAD_PRESS",
    ratio: avg(
      212.5 / BACK_SQUAT_WR, // 0.433
      118 / BACK_SQUAT_SS, // 0.488
      112.3 / BACK_SQUAT_SL, // 0.511
      0.6 * BENCH_SQUAT_RATIO, // 0.450
    ),
    mvt: 0.2,
    equipment: EQUIPMENT.BAR,
    movement: MOVEMENT.VERTICAL_PUSH,
  },
  DB_SHOULDER_PRESS: {
    id: "DB_SHOULDER_PRESS",
    ratio: avg(
      120 / BACK_SQUAT_SL, // 0.547
      0.6 * BENCH_SQUAT_RATIO, // 0.450
    ),
    mvt: 0.2,
    equipment: EQUIPMENT.HANDLES,
    movement: MOVEMENT.VERTICAL_PUSH,
  },
  THRUSTER: {
    id: "THRUSTER",
    ratio: avg(
      156 / BACK_SQUAT_SS, // 0.644
      145 / BACK_SQUAT_SL, // 0.660
      0.85 * BENCH_SQUAT_RATIO, // 0.638
    ),
    mvt: 0.3, // TODO: check
    equipment: EQUIPMENT.BAR,
  },
  LUNGES: {
    id: "LUNGES",
    ratio: 174.7 / BACK_SQUAT_SL, // 0.8
    mvt: 0.3, // TODO: check
    equipment: EQUIPMENT.BAR,
    movement: MOVEMENT.LEGS_SQUAT,
  },
  BICEP_CURL: {
    id: "BICEP_CURL",
    ratio: avg(
      114 / BACK_SQUAT_WR, // 0.232
      91 / BACK_SQUAT_SL, // 0.413
      0.4 * BENCH_SQUAT_RATIO, // 0.300
    ),
    mvt: 0.15, // TODO: check
    equipment: EQUIPMENT.HANDLES,
  },
  OVERHEAD_TRICEP_EXTENSION: {
    id: "OVERHEAD_TRICEP_EXTENSION",
    ratio: 96.9 / BACK_SQUAT_SL, // 0.44
    mvt: 0.15, // TODO: check
    equipment: EQUIPMENT.ROPE,
  },
  LATERAL_RAISE: {
    id: "LATERAL_RAISE",
    ratio: 2 * 35.6 / BACK_SQUAT_SL, // 0.16
    mvt: 0.25, // TODO: check
    equipment: EQUIPMENT.HANDLES,
  },
  REAR_FLY: {
    id: "REAR_FLY",
    ratio: 125.7 / BACK_SQUAT_SL, // 0.57
    mvt: 0.25, // TODO: check
    equipment: EQUIPMENT.HANDLES,
  },
  CHEST_FLY: {
    id: "CHEST_FLY",
    ratio: 2 * 52.3 / BACK_SQUAT_SL, // 0.24
    mvt: 0.25, // TODO: check
    equipment: EQUIPMENT.HANDLES,
  },
  CALF_RAISE: {
    id: "CALF_RAISE",
    ratio: 242.5 / BACK_SQUAT_SS, // 1.106
    mvt: 0.25, // TODO: check
    equipment: EQUIPMENT.BAR,
  },
}


export const PUSH_EXERCISES = [EXERCISES.FLAT_BENCH_PRESS, EXERCISES.OVERHEAD_PRESS];
export const PULL_EXERCISES = [EXERCISES.BARBELL_ROW/*, EXERCISES.HIGH_PULL*/];
export const LEG_EXERCISES = [EXERCISES.BACK_SQUAT, EXERCISES.DEADLIFT];
export const ACCESSORY_EXERCISES = [EXERCISES.BICEP_CURL, EXERCISES.OVERHEAD_TRICEP_EXTENSION, EXERCISES.LATERAL_RAISE, EXERCISES.REAR_FLY, EXERCISES.CHEST_FLY];
