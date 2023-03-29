import { createSignal } from 'solid-js';
import { createObservedSignal } from '../util/signals.js';
import { promisifyEvent, promisifyTimeout } from '../util/promisify.js';
import { enqueue } from '../util/ble-queue.js';
import { getColorSchemeCommand } from './color.js';
import { getStopCommand, getActivateCommand } from './activate.js';
import { parseSample } from './cables.js';
import { parseMode, MODES } from './mode.js';
import { parseReps } from './reps.js';

const PRIMARY_SERVICE_ID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTICS = {
  LEFT_CABLE: 'bc4344e9-8d63-4c89-8263-951e2d74f744',
  RIGHT_CABLE: '92ef83d6-8916-4921-8172-a9919bc82566',
  MODE: '67d0dae0-5bfc-4ea2-acc9-ac784dee7f29',
  VERSION: '74e994ac-0e80-4c02-9cd0-76cb31d3959b',
  BLE_UPDATE_REQUEST: 'ef0e485a-8749-4314-b1be-01e57cd1712e',
  UPDATE_STATE: '383f7276-49af-4335-9072-f01b0f8acad6',
  WIFI_STATE: 'a7d06ce0-2e84-485f-9c25-3d4ba6fe7319',
  SAMPLE: '90e991a6-c548-44ed-969b-eb541014eae3',
  DIAGNOSTIC_DETAILS: '5fa538ec-d041-42f6-bbd6-c30d475387b7',
  REPS: '8308f2a6-0875-4a94-a86f-5c5c5e1b068a',
  COMMAND: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
};

class VFormTrainer {
  public connected: () => boolean;
  public active: () => boolean;
  private _setConnected: (connected: boolean) => void;
  public sample: () => ReturnType<typeof parseSample>;
  public mode: () => ReturnType<typeof parseMode>;
  public reps: () => ReturnType<typeof parseReps>;
  public phase: () => "concentric" | "eccentric";
  public rangeOfMotion: () => { top: number; bottom: number, left: number, right: number };

  private _device?: BluetoothDevice;
  private _server?: BluetoothRemoteGATTServer;
  private _service?: BluetoothRemoteGATTService;

  constructor() {
    [this.connected, this._setConnected] = createSignal(false);
    this.sample = this.createPollSignal(CHARACTERISTICS.SAMPLE, parseSample);
    this.mode = this.createNotifySignal(CHARACTERISTICS.MODE, parseMode);
    this.reps = this.createNotifySignal(CHARACTERISTICS.REPS, parseReps);
    this.active = () => this.connected() && this.mode() !== MODES.BASELINE;
    this.phase = () => {
      const { up, down } = this.reps();
      return up === down ? 'concentric' : 'eccentric';
    };
    this.rangeOfMotion = () => {
      const { rangeTop, rangeBottom } = this.reps();
      const { left, right } = this.sample();
      const range = rangeTop - rangeBottom;
      return { 
        top: rangeTop, 
        bottom: rangeBottom, 
        left: (left.position - rangeBottom) / range, 
        right: (right.position - rangeBottom) / range
      };
    };
    this.autoconnect();
  }
  async autoconnect() {
    try {
      let abortController: AbortController;
      const devices = await navigator.bluetooth.getDevices();
      const device = devices.find((d) => d.name.startsWith('Vee'));
      if (device) {
        const watchAndConnect = async () => {
          if (document.hidden) {
            abortController?.abort();
          } else {
            abortController = new AbortController();
            device.watchAdvertisements({
              signal: abortController.signal,
            });

            await promisifyEvent(device, 'advertisementreceived');
            document.removeEventListener('visibilitychange', watchAndConnect);

            this._doConnect(device);
          }
        };

        document.addEventListener("visibilitychange", watchAndConnect);
        watchAndConnect();
      }
    } catch (e) {
      console.log(e);
    }
  }
  async connect() {
    this._setConnected(undefined);
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Vee' }],
      optionalServices: [PRIMARY_SERVICE_ID],
    });
    await this._doConnect(device);
  }
  async _doConnect(device: BluetoothDevice) {
    try {
      this._device = device;
      this._server = await device.gatt.connect();
      this._device.addEventListener('gattserverdisconnected', () => {
        console.log('disconnect');
        this._device = null;
        this._server = null;
        this._service = null;
        this._setConnected(false);
      });
      this._service = await this._server.getPrimaryService(PRIMARY_SERVICE_ID);
      this._setConnected(true);
      await this._writeCommand(new ArrayBuffer(96));
      await this.stop();
      await this.setColor(0x000000);
    } catch (e) {
      this._setConnected(false);
      throw e;
    }
  }
  async disconnect() {
    this._server.disconnect();
  }
  async setColor(color) {
    return this.setColorScheme([color, color, color]);
  }
  async setColorScheme(colors) {
    await this._writeCommand(getColorSchemeCommand(colors));
  }
  async activate(reps, force) {
    await this._writeCommand(getActivateCommand(reps, force));
  }
  async stop() {
    await this._writeCommand(getStopCommand());
  }
  async _writeCommand(command) {
    const commandCharacteristic = await this._service.getCharacteristic(CHARACTERISTICS.COMMAND);
    const method = commandCharacteristic.properties.writeWithoutResponse ? 'writeValueWithoutResponse' : 'writeValueWithResponse';
    await enqueue(
      commandCharacteristic,
      method,
      command
    );
  }
  createNotifySignal<T extends (d?: DataView) => any>(
    characteristicUuid: string,
    parseDataView: T
  ) {
    return createObservedSignal(parseDataView(undefined), async (set) => {
      const characteristic = await this._service.getCharacteristic(
        characteristicUuid
      );
      const update = () => set(parseDataView(characteristic.value));
      await enqueue(characteristic, 'startNotifications');
      characteristic.addEventListener('characteristicvaluechanged', update);
      await enqueue(characteristic, 'readValue');
      return async () => {
        characteristic.removeEventListener(
          'characteristicvaluechanged',
          update
        );
        await enqueue(characteristic, 'stopNotifications');
      };
    });
  }
  createPollSignal<T extends (d?: DataView) => any>(
    characteristicUuid: string,
    parseDataView: T
  ) {
    return createObservedSignal(parseDataView(undefined), async (set) => {
      let cancelled = false;
      const characteristic = await this._service.getCharacteristic(
        characteristicUuid
      );
      while (!cancelled) {
        set(parseDataView(await enqueue(characteristic, 'readValue')));
      }
      return () => {
        cancelled = true;
      };
    });
  }
}

declare global {
  var Trainer: VFormTrainer;
}

export default window.Trainer = new VFormTrainer();
