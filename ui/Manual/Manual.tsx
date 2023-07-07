import { createLocalSignal } from '../../services/util/signals.js';

const DEFAULT_CONFIG = {
  reps: {
    repCounts: {
      total: 10,
      baseline: 3,
      adaptive: 3,
    },
    top: {
      inner: {
        mmPerM: 250,
        mmMax: 250,
      },
      outer: {
        mmPerM: 200,
        mmMax: 30,
      },
      drift: 0,
      threshold: 5
    },
    bottom: {
      inner: {
        mmPerM: 250,
        mmMax: 250,
      },
      outer: {
        mmPerM: 200,
        mmMax: 30,
      },
      drift: 0,
      threshold: 5
    },
    safety: {
      mmPerM: 250,
      mmMax: 80,
    },
    seedRange: 5
  },
  activationForce: {
    forces: {
      min: 0,
      max: 20,
    },
    softMax: 10,
    increment: 0,
    concentric: {
      decrease: { minMmS: 0, maxMmS: 20, ramp: 3 },
      increase: { minMmS: 75, maxMmS: 600, ramp: 50 },
    },
    eccentric: {
      decrease: { minMmS: -1300, maxMmS: -1200, ramp: 100 },
      increase: { minMmS: -260, maxMmS: -110, ramp: 0 },
    },
  }
}

export function Manual() {
  const [activateConfig, setActivateConfig] = createLocalSignal("manual-activate-config", DEFAULT_CONFIG);

  console.log(activateConfig());

  return (
    <form class="flex flex-col" onSubmit={async (e) => {
      e.preventDefault();

      const data = new FormData(e.currentTarget);
      const config: typeof DEFAULT_CONFIG = {} as any;

      for (const [key, value] of (data as any).entries()) {
        const parts = key.split(".");
        const last = parts.pop();
        let obj = config;
        for (const part of parts) {
          if (!obj[part]) {
            obj[part] = {};
          }
          obj = obj[part];
        }
        obj[last] = value;
      }

      setActivateConfig(config);

      if (!Trainer.connected()) {
        await Trainer.connect();
      }

      await Trainer.activate(config.reps, config.activationForce);  
    }}>
      <div class="flex">
        <button class="flex-1 p-2 bg-red-900" onClick={(e) => {
          e.preventDefault();
          if (Trainer.connected()) {
            Trainer.stop();
          }
        }}>Stop</button>
        <button class="flex-1 p-2 bg-green-500">Activate</button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <ActivateFields value={activateConfig()} />
      </div>
    </form>
  )
}

function ActivateFields(props) {
  return (<>
    <style>
      {`
        body {
            font-family: sans-serif;
        }
        label {
            display: block;
            font-size: 0.85em;
        }
        fieldset {
            padding:0px;
            background:rgba(0,0,0,0.02);
            border:1px solid rgba(0,0,0,0.15);
            margin-top:5px;
            font-size:0.85em;
        }
        fieldset:not(:has(fieldset)) {
            display:flex;
        }
        legend {
            font-size: 1em;
        }
        .field {
            flex: 1;
            padding:4px;
            margin-top:5px;
        }
        input[type="number"] {
            width:100%;
            box-sizing:border-box;
            font-size:1rem;
        }
      `}
    </style>
    <RepConfig id="reps" value={props.value.reps} />
    <ActivationForce id="activationForce" value={props.value.activationForce} />
  </>
  );
}

function RepConfig(props) {
  return (
    <fieldset>
      <legend>Reps</legend>
      <RepCounts id={props.id + ".repCounts"} value={props.value.repCounts} />
      <RepBounds label="Top" id={props.id + ".top"} value={props.value.top} />
      <RepBounds label="Bottom" id={props.id + ".bottom"} value={props.value.bottom} />
      <RepBand label="Safety" id={props.id + ".safety"} value={props.value.safety} />
      <NumberInput label="Seed Range" id={props.id + ".seedRange"} value={props.value.seedRange} />
    </fieldset>
  )
}

function RepCounts(props) {
  return (
    <fieldset>
      <legend>Rep Counts</legend>
      <NumberInput label="Total" id={props.id + ".total"} value={props.value.total} />
      <NumberInput label="Adaptive" id={props.id + ".adaptive"} value={props.value.adaptive} />
      <NumberInput label="Baseline" id={props.id + ".baseline"} value={props.value.baseline} />
    </fieldset>
  )
}

function RepBounds(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <RepBand label="Inner" id={props.id + ".inner"} value={props.value.inner} />
      <RepBand label="Outer" id={props.id + ".outer"} value={props.value.outer} />
      <NumberInput label="Drift" id={props.id + ".drift"} value={props.value.drift} />
      <NumberInput label="Threshold" id={props.id + ".threshold"} value={props.value.threshold} />
    </fieldset>
  )
}

function RepBand(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <NumberInput label="mm/M" id={props.id + ".mmPerM"} value={props.value.mmPerM} />
      <NumberInput label="mm Max" id={props.id + ".mmMax"} value={props.value.mmMax} />
    </fieldset>
  )
}

function ActivationForce(props) {
  return (
    <fieldset>
      <legend>Activation Force</legend>

      <fieldset>
        <legend>Forces</legend>
        <NumberInput label="Min" id={props.id + ".forces.min"} value={props.value.forces.min} />
        <NumberInput label="Max" id={props.id + ".forces.max"} value={props.value.forces.max} />
      </fieldset>

      <NumberInput label="Soft Max" id={props.id + ".softMax"} value={props.value.softMax} />
      <NumberInput label="Increment" id={props.id + ".increment"} value={props.value.increment} />

      <ActivationPhase label="Concentric" id={props.id + ".concentric"} value={props.value.concentric} />
      <ActivationPhase label="Eccentric" id={props.id + ".eccentric"} value={props.value.eccentric} />
    </fieldset>
  );
}

function ActivationPhase(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <ActivationRamp label="Increase" id={props.id + ".increase"} value={props.value.increase} />
      <ActivationRamp label="Decrease" id={props.id + ".decrease"} value={props.value.decrease} />
    </fieldset>
  )
}

function ActivationRamp(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <NumberInput label="Max" id={props.id + ".maxMmS"} value={props.value.maxMmS} />
      <NumberInput label="Min" id={props.id + ".minMmS"} value={props.value.minMmS} />
      <NumberInput label="Ramp" id={props.id + ".ramp"} value={props.value.ramp} />
    </fieldset>
  );
}

function NumberInput(props) {
  return (
    <div class="field">
      <label for={props.id}>{props.label}</label>
      <input class="bg-gray-700" type="number" step="any" id={props.id} name={props.id} value={props.value} />
    </div>
  );
}