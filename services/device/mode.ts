export const MODES = {
  BASELINE: 0,
  SOFTWARE: 1,
  STATIC: 2,
  TWO_PHASE: 3,
  MASTER: 4,
};

export function parseMode(dataView: DataView) {
  if (!dataView?.byteLength) {
    return MODES.BASELINE;
  }

  return dataView.getUint8(0);
}
