export function parseReps(dataView?: DataView) {
  if (!dataView?.byteLength) {
    return { up: 0, down: 0, rangeTop: 0, rangeBottom: 0 };
  }

  return {
    up: dataView.getInt32(0, true),
    down: dataView.getInt32(4, true),
    rangeTop: dataView.getFloat32(8, true),
    rangeBottom: dataView.getFloat32(12, true),
  };
}
