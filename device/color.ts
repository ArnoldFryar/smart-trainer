const COLOR_OPCODE = 0x43;

export const SCHEME_PRESETS = {
  POLICE: [0xff0000, 0x333333, 0x0000ff],
  SUNSET: [0xe23cbf, 0xf15a60, 0xff7801],
  OCEAN: [0x00ffcc, 0x0066ff, 0x000099],
  CHRISTMAS: [0x2c6a61, 0xf8edcc, 0xd9283c],
};

export function getColorSchemeCommand(colors: [number, number, number]) {
  const commandBuffer = new ArrayBuffer(14);
  const commandView = new DataView(commandBuffer);

  commandView.setUint8(0, COLOR_OPCODE);
  commandView.setUint8(1, 0); // what is this? combine with the op code into a Uint16?

  let currentOffset = 2;
  for (const color of colors) {
    for (const byte of getColorBytes(color)) {
      commandView.setUint8(currentOffset++, byte);
    }
  }

  return commandBuffer;
}

function getColorBytes(color: number) {
  const colorBuffer = new ArrayBuffer(4);
  const colorView = new DataView(colorBuffer);
  colorView.setUint32(0, color, false);
  return [colorView.getUint8(1), colorView.getUint8(2), colorView.getUint8(3)];
}
