const queue: Array<{
  characteristic: BluetoothRemoteGATTCharacteristic;
  fn: keyof BluetoothRemoteGATTCharacteristic;
  args?: unknown[];
  resolve: (value: unknown) => void;
  reject: (value: unknown) => void;
}> = [];
let running = false;

async function run() {
  if (!running) {
    running = true;
    for (const { characteristic, fn, args, resolve, reject } of queue) {
      await (characteristic[fn] as Function)(...args).then(resolve, reject);
    }
    queue.length = 0;
    running = false;
  }
}

export function enqueue(
  characteristic: BluetoothRemoteGATTCharacteristic,
  fn: "readValue",
  ...args: unknown[]
): Promise<DataView>;
export function enqueue(
  characteristic: BluetoothRemoteGATTCharacteristic,
  fn: keyof BluetoothRemoteGATTCharacteristic,
  ...args: unknown[]
): Promise<void>;
export function enqueue(
  characteristic: BluetoothRemoteGATTCharacteristic,
  fn: keyof BluetoothRemoteGATTCharacteristic,
  ...args: unknown[]
) {
  let resolve: (value: unknown) => void;
  let reject: (value: unknown) => void;
  const promise = new Promise(
    (_resolve, _reject) => ((resolve = _resolve), (reject = _reject))
  );
  queue.push({
    characteristic,
    fn,
    args,
    resolve,
    reject,
  });
  run();
  return promise;
}
