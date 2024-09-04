const STOP_OPCODE = 0x50;

export const PRESETS = {
  TUT_BEAST: {
    concentric: {
      decrease: { minMmS: 150, maxMmS: 250, ramp: 7 },
      increase: { minMmS: 350, maxMmS: 450, ramp: 50 },
    },
    eccentric: {
      decrease: { minMmS: -550, maxMmS: -500, ramp: 100 },
      increase: { minMmS: -100, maxMmS: -50, ramp: 28 },
    },
  },
  TUT: {
    concentric: {
      decrease: { minMmS: 250, maxMmS: 350, ramp: 7 },
      increase: { minMmS: 450, maxMmS: 600, ramp: 50 },
    },
    eccentric: {
      decrease: { minMmS: -550, maxMmS: -500, ramp: 100 },
      increase: { minMmS: -100, maxMmS: -50, ramp: 14 },
    },
  },
  OLD_SCHOOL: {
    concentric: {
      decrease: { minMmS: 0, maxMmS: 20, ramp: 3 },
      increase: { minMmS: 75, maxMmS: 600, ramp: 50 },
    },
    eccentric: {
      decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
      increase: { minMmS: -260, maxMmS: -110, ramp: 0 },
    },
  },
  PUMP: {
    concentric: {
      decrease: { minMmS: 50, maxMmS: 450, ramp: 10 },
      increase: { minMmS: 500, maxMmS: 600, ramp: 50 },
    },
    eccentric: {
      decrease: { minMmS: -700, maxMmS: -550, ramp: 1 },
      increase: { minMmS: -100, maxMmS: -50, ramp: 1 },
    },
  },
  ECCENTRIC_ONLY: {
    concentric: {
      decrease: { minMmS: 50, maxMmS: 550, ramp: 50 },
      increase: { minMmS: 650, maxMmS: 750, ramp: 10 },
    },
    eccentric: {
      decrease: { minMmS: -550, maxMmS: -500, ramp: 100 },
      increase: { minMmS: -100, maxMmS: -50, ramp: 20 },
    },
  },
  NEW_SCHOOL: {
    concentric: {
      decrease: { minMmS: 0, maxMmS: 20, ramp: 3 },
      increase: { minMmS: 75, maxMmS: 600, ramp: 0 },
    },
    eccentric: {
      decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
      increase: { minMmS: -100, maxMmS: -50, ramp: 40 },
    },
  },
  ISOKINETIC: {
    concentric: {
      decrease: { minMmS: 0, maxMmS: 79, ramp: 20 },
      increase: { minMmS: 80, maxMmS: 450, ramp: 50 },
    },
    eccentric: {
      decrease: { minMmS: -450, maxMmS: -80, ramp: 50 },
      increase: { minMmS: -79, maxMmS: 0, ramp: 20 },
    },
  },
};

export function getStopCommand() {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setInt8(0, STOP_OPCODE);
  return buffer;
}

export function getForces(
  softMax: number,
  profile = PRESETS.NEW_SCHOOL,
  increment = 0,
  max = softMax + 10
) {
  return {
    ...profile,
    forces: {
      min: 0,
      max,
    },
    softMax,
    increment,
  };
}

const DEFAULT_TOP_BOTTOM = {
  threshold: 5,
  drift: 0,
  inner: {
    mmPerM: 250,
    mmMax: 250,
  },
  outer: {
    mmPerM: 200,
    mmMax: 30,
  },
};

const DEFAULT_SAFETY = {
  mmPerM: 250,
  mmMax: 80,
};

const DEFAULT_SEED_RANGE = 5;

export function getReps(count: number, baseline = 3, adaptive = 3) {
  return {
    repCounts: {
      total: count + baseline + 1,
      baseline,
      adaptive,
    },
    seedRange: DEFAULT_SEED_RANGE,
    top: DEFAULT_TOP_BOTTOM,
    bottom: DEFAULT_TOP_BOTTOM,
    safety: DEFAULT_SAFETY,
  };
}

const ACTIVATION_HEADER = 0x04;

export type ActivateConfig = {
  reps: ReturnType<typeof getReps>;
  force: ReturnType<typeof getForces>;
};

export function getActivateCommand({ reps, force }: ActivateConfig) {
  const buffer = new ArrayBuffer(96);
  const dataView = new DataView(buffer);

  dataView.setUint32(0, ACTIVATION_HEADER, true);
  dataView.setUint8(4, reps.repCounts.total);
  dataView.setUint8(5, reps.repCounts.baseline);
  dataView.setUint8(6, reps.repCounts.adaptive);
  dataView.setUint8(7, 0);
  dataView.setFloat32(8, reps.seedRange, true);
  dataView.setFloat32(12, reps.top.threshold, true);
  dataView.setFloat32(16, reps.top.drift, true);
  dataView.setUint16(20, reps.top.inner.mmPerM, true);
  dataView.setUint16(22, reps.top.inner.mmMax, true);
  dataView.setUint16(24, reps.top.outer.mmPerM, true);
  dataView.setUint16(26, reps.top.outer.mmMax, true);
  dataView.setFloat32(28, reps.bottom.threshold, true);
  dataView.setFloat32(32, reps.bottom.drift, true);
  dataView.setUint16(36, reps.bottom.inner.mmPerM, true);
  dataView.setUint16(38, reps.bottom.inner.mmMax, true);
  dataView.setUint16(40, reps.bottom.outer.mmPerM, true);
  dataView.setUint16(42, reps.bottom.outer.mmMax, true);
  dataView.setUint16(44, reps.safety.mmPerM, true);
  dataView.setUint16(46, reps.safety.mmMax, true);

  dataView.setInt16(48, force.concentric.decrease.minMmS, true);
  dataView.setInt16(50, force.concentric.decrease.maxMmS, true);
  dataView.setFloat32(52, force.concentric.decrease.ramp, true);
  dataView.setInt16(56, force.concentric.increase.minMmS, true);
  dataView.setInt16(58, force.concentric.increase.maxMmS, true);
  dataView.setFloat32(60, force.concentric.increase.ramp, true);
  dataView.setInt16(64, force.eccentric.decrease.minMmS, true);
  dataView.setInt16(66, force.eccentric.decrease.maxMmS, true);
  dataView.setFloat32(68, force.eccentric.decrease.ramp, true);
  dataView.setInt16(72, force.eccentric.increase.minMmS, true);
  dataView.setInt16(74, force.eccentric.increase.maxMmS, true);
  dataView.setFloat32(76, force.eccentric.increase.ramp, true);
  dataView.setFloat32(80, force.forces.min, true);
  dataView.setFloat32(84, force.forces.max, true);
  dataView.setFloat32(88, force.softMax, true);
  dataView.setFloat32(92, force.increment, true);

  return buffer;
}

export const ECHO_HEADER = 78; // 0x4E;

// Isometric-ish
export type EchoConfig = {
  romRepCount: number /* i8, byte */; // 0 in p
  repCount: number /* i8, byte */;
  mode: /* M */ {
    // used in p
    spotter: number /* i16, short */; // 0 in p, 1.3f i.MEDIUM (m/s?)
    eccentricOverload: number /* i16, short */; // s/e in p
    referenceMapBlend: number /* i16, short */; // 0 in p
    concentricDelayS: number /* f32, float */; // 0.0f in p
    concentric: {
      duration: number /* f32, float? */; // f2/c in p, seconds
      maxVelocity: number /* f32, float */;
    };
    eccentric: {
      duration: number /* f32, float? */; // 0.1f in p, seconds
      maxVelocity: number /* f32, float */;
    };
  };
};

export function getEchoConfig(
  reps,
  concentricDuration,
  eccentricOverload = 100
): EchoConfig {
  return {
    romRepCount: 3,
    repCount: reps,
    mode: {
      spotter: 0,
      eccentricOverload,
      referenceMapBlend: 0,
      concentricDelayS: 0.1,
      concentric: {
        duration: concentricDuration,
        maxVelocity: 55,
      },
      eccentric: {
        duration: 0,
        maxVelocity: -200,
      },
    },
  };
}

export function getEchoCommand(config: EchoConfig) {
  const buffer = new ArrayBuffer(32);
  const dataView = new DataView(buffer);

  dataView.setUint32(0, ECHO_HEADER, true);
  dataView.setUint8(4, config.romRepCount);
  dataView.setUint8(5, config.repCount);
  dataView.setUint16(6, config.mode.spotter, true);
  dataView.setUint16(8, config.mode.eccentricOverload, true);
  dataView.setUint16(10, config.mode.referenceMapBlend, true);
  dataView.setFloat32(12, config.mode.concentricDelayS, true);
  dataView.setFloat32(16, config.mode.concentric.duration, true);
  dataView.setFloat32(20, config.mode.concentric.maxVelocity, true);
  dataView.setFloat32(24, config.mode.eccentric.duration, true);
  dataView.setFloat32(28, config.mode.eccentric.maxVelocity, true);

  return buffer;
}

export const REGULAR_HEADER = 79; // 0x4F;

// Isotonic-ish
export type RegularConfig = {
  romRepCount: number /* i8, byte */;
  repCount: number /* i8, byte */;
  mode: /* G */ {
    // used in o
    spotter: number /* i16, short */; // mm/s?
    concentric: number /* f32, float */;
    eccentric: number /* f32, float */;
    progression: number /* f32, float */;

    // seems only linearC1 is used ("bands")
    curve: /* F */ {
      linearC1: number /* f32, float */;
      squareC2: number /* f32, float */; // hardcoded to 0.0f in F
    };
  };
};

export function getRegularConfig(
  repCount,
  concentric,
  eccentric = concentric,
  spotter = 0,
  progression = 0,
  linearC1 = 0
): RegularConfig {
  return {
    romRepCount: 3,
    repCount,
    mode: {
      spotter,
      concentric,
      eccentric,
      progression,
      curve: {
        linearC1,
        squareC2: 0.0,
      },
    },
  };
}

export function getRegularCommand(config: RegularConfig) {
  const buffer = new ArrayBuffer(28);
  const dataView = new DataView(buffer);

  dataView.setUint32(0, REGULAR_HEADER, true);
  dataView.setUint8(4, config.romRepCount);
  dataView.setUint8(5, config.repCount);
  dataView.setUint16(6, config.mode.spotter, true);
  dataView.setFloat32(8, config.mode.concentric, true);
  dataView.setFloat32(12, config.mode.eccentric, true);
  dataView.setFloat32(16, config.mode.progression, true);
  dataView.setFloat32(20, config.mode.curve.linearC1, true);
  dataView.setFloat32(24, config.mode.curve.squareC2, true);

  return buffer;
}

/*

function parseActivationPacket(rawHexPacket) {
  return parseActivationBuffer(getActivationBuffer(rawHexPacket));
}

function getActivationBuffer(rawHexPacket) {
  const trimmedHexPacket = rawHexPacket.replace(/\s/g, "");
  let hexDataString = "";
  for (let i = 0; i < 6; i++) {
    hexDataString += trimmedHexPacket.slice(64 * i + 28, 64 * (i + 1));
  }
  const uint8array = new Uint8Array(hexDataString.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
  return uint8array.buffer;
}

function parseActivationBuffer(buffer) {
  const dataView = new DataView(buffer);
  const activationData = {
    header: dataView.getUint32(0, true),
    reps: {
      repCounts: {
        total: dataView.getUint8(4, true),
        baseline: dataView.getUint8(5, true),
        adaptive: dataView.getUint8(6, true),
        emptyByte: dataView.getUint8(7, true)
      },
      seedRange: dataView.getFloat32(8, true),
      top: {
        threshold: dataView.getFloat32(12, true),
        drift: dataView.getFloat32(16, true),
        inner: {
          mmPerM: dataView.getUint16(20, true),
          mmMax: dataView.getUint16(22, true),
        },
        outer: {
          mmPerM: dataView.getUint16(24, true),
          mmMax: dataView.getUint16(26, true)
        },
      },
      bottom: {
        threshold: dataView.getFloat32(28, true),
        drift: dataView.getFloat32(32, true),
        inner: {
          mmPerM: dataView.getUint16(36, true),
          mmMax: dataView.getUint16(38, true),
        },
        outer: {
          mmPerM: dataView.getUint16(40, true),
          mmMax: dataView.getUint16(42, true)
        },
      },
      safety: {
        mmPerM: dataView.getUint16(44, true),
        mmMax: dataView.getUint16(46, true)
      }
    },
    force: {
      concentric: {
        decrease: {
          minMmS: dataView.getInt16(48, true),
          maxMmS: dataView.getInt16(50, true),
          ramp: dataView.getFloat32(52, true)
        },
        increase: {
          minMmS: dataView.getInt16(56, true),
          maxMmS: dataView.getInt16(58, true),
          ramp: dataView.getFloat32(60, true)
        }
      },
      eccentric: {
        decrease: {
          minMmS: dataView.getInt16(64, true),
          maxMmS: dataView.getInt16(66, true),
          ramp: dataView.getFloat32(68, true)
        },
        increase: {
          minMmS: dataView.getInt16(72, true),
          maxMmS: dataView.getInt16(74, true),
          ramp: dataView.getFloat32(76, true)
        }
      },
      forces: {
        min: dataView.getFloat32(80, true),
        max: dataView.getFloat32(84, true),
      },
      softMax: dataView.getFloat32(88, true),
      increment: dataView.getFloat32(92, true),
    }
  }
  return activationData;
}

*/
