export type Cable = {
  position: number,
  velocity: number,
  force: number
};

export type Sample = {
  time: number,
  left: Cable,
  right: Cable
};

export function parseSample(dataview?: DataView): Sample {
  if (!dataview?.byteLength) {
    return {
      left: { position: 0, velocity: 0, force: 0 },
      right: { position: 0, velocity: 0, force: 0 },
      time: 0,
    };
  }

  return {
    time: dataview.getUint32(0, true),
    left: {
      position: dataview.getInt16(4, true) / 10,
      velocity: dataview.getInt16(6, true) / 10,
      force: dataview.getInt16(8, true) / 100,
    },
    right: {
      position: dataview.getInt16(10, true) / 10,
      velocity: dataview.getInt16(12, true) / 10,
      force: dataview.getInt16(14, true) / 100,
    },
  };
}

export function parseCable(dataview: DataView): Cable {
  return {
    position: dataview.getFloat32(0, true),
    velocity: dataview.getFloat32(4, true),
    force: dataview.getFloat32(8, true),
  };
}
