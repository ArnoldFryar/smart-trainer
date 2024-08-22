export type Heuristic = {
  left: CableHeuristic;
  right: CableHeuristic;
};

export type CableHeuristic = {
  concentric: PhaseHeuristic;
  eccentric: PhaseHeuristic;
};

export type PhaseHeuristic = {
  kgAvg: number /* f32 */;
  kgMax: number /* f32 */;
  velAvg: number /* f32 */;
  velMax: number /* f32 */;
  wattAvg: number /* f32 */;
  wattMax: number /* f32 */;
};

export function parseHeuristic(dataView: DataView): Heuristic {
  return {
    left: parseCableHeuristic(dataView, 0),
    right: parseCableHeuristic(dataView, 48),
  };
}

function parseCableHeuristic(
  dataView: DataView,
  byteOffset: number
): CableHeuristic {
  return {
    concentric: parsePhaseHeuristic(dataView, byteOffset),
    eccentric: parsePhaseHeuristic(dataView, byteOffset + 24),
  };
}

function parsePhaseHeuristic(
  dataView: DataView,
  byteOffset: number
): PhaseHeuristic {
  return {
    kgAvg: dataView.getFloat32(byteOffset, true),
    kgMax: dataView.getFloat32(byteOffset + 4, true),
    velAvg: dataView.getFloat32(byteOffset + 8, true),
    velMax: dataView.getFloat32(byteOffset + 12, true),
    wattAvg: dataView.getFloat32(byteOffset + 16, true),
    wattMax: dataView.getFloat32(byteOffset + 20, true),
  };
}
