import { createSignal, For, onCleanup, Show } from 'solid-js';
import { getNestedFormData } from '../../services/util/form.js';
import { createLocalSignal } from '../../services/util/signals.js';
import { PRESETS } from '../../services/device/activate.js';
import { Button } from '../_common/Elements/Elements.jsx';
import { WeightAndRangeOfMotion } from '../Workout/WeightAndRangeOfMotion/WeightAndRangeOfMotion.jsx';
import { Reps } from '../Workout/WorkoutActive/WorkoutActive.jsx';

const DEFAULT_CONFIG = {
  reps: {
    repCounts: {
      total: 13,
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

export default function Manual() {
  const [savedActivateConfig, setSavedActivateConfig] = createLocalSignal("manual-activate-config", DEFAULT_CONFIG);
  const [activateConfig, setActivateConfig] = createSignal(savedActivateConfig());
  const weight = () => activateConfig().activationForce.softMax * 2;
  const setWeight = (weight) => setActivateConfig({
    ...activateConfig(),
    activationForce: {
      ...activateConfig().activationForce,
      forces: {
        ...activateConfig().activationForce.forces,
        max: weight/2 + 10,
      },
      softMax: weight/2,
    }
  });
  const reps = () => activateConfig().reps.repCounts.total - activateConfig().reps.repCounts.baseline;
  const setReps = (reps) => setActivateConfig({
    ...activateConfig(),
    reps: {
      ...activateConfig().reps,
      repCounts: {
        ...activateConfig().reps.repCounts,
        total: reps + activateConfig().reps.repCounts.baseline,
      }
    }
  });
  const preset = () => Object.keys(PRESETS).find((presetName) => deepEqual(PRESETS[presetName], { concentric: activateConfig().activationForce.concentric, eccentric: activateConfig().activationForce.eccentric })) || "Custom";
  const setPreset = (presetName) => setActivateConfig({
    ...activateConfig(),
    activationForce: {
      ...activateConfig().activationForce,
      ...PRESETS[presetName]
    }
  });

  return (
    <div class="flex flex-col h-full">
      <Show when={!Trainer.active()}>
        <BasicControls weight={weight()} setWeight={setWeight} reps={reps()} setReps={setReps} preset={preset()} setPreset={setPreset} />
        <form class="flex flex-col flex-1 p-2" onSubmit={async (e) => {
          e.preventDefault();
          const config = getNestedFormData(e.currentTarget) as typeof DEFAULT_CONFIG;
          setSavedActivateConfig(config);

          if (!Trainer.connected()) {
            await Trainer.connect();
          }

          await Trainer.activate(config.reps, config.activationForce);  
        }}>
          <div class="flex-1 basis-0 overflow-y-auto">
            <ActivateFields value={activateConfig()} onInput={e => setActivateConfig(getNestedFormData(e.target.form))} />
          </div>
          <div class="flex">
            <Button onClick={(e) => {
              e.preventDefault();
              setActivateConfig(DEFAULT_CONFIG);
            }}>Reset</Button>
            <Button class="ml-2 flex-1" type="submit" primary>{Trainer.connected() ? "Workout!" : "Connect"}</Button>
          </div>
        </form>
      </Show>
      <Show when={Trainer.active()}>
        <WorkoutView config={activateConfig()} />
      </Show>
    </div>
  )
}

function BasicControls(props) {
  return (
    <div class="p-4">
      <div class="flex mb-4">
        <FeaturedInput label="lbs total" value={toLbs(props.weight)} setValue={(lbs) => props.setWeight(toKg(lbs))} />
        <FeaturedInput label="reps" value={props.reps} setValue={props.setReps} />
      </div>
      <PresetSelect value={props.preset} setValue={props.setPreset} />
    </div>
  )
}

function toLbs(kg) {
  return (kg * 2.2);
}

function toKg(lbs) {
  return (lbs / 2.2);
}

function FeaturedInput(props) {
  return (
    <div class="field">
      <input class="bg-gray-700 text-center p-2" style="font-size: 3em;" type="number" step="any" id={props.id} name={props.id} value={props.value} onInput={(e) => props.setValue(e.target.valueAsNumber)} />
      <label class="text-center" for={props.id}>{props.label}</label>
    </div>
  );
}

function PresetSelect(props) {
  return (
    <select onChange={(e) => props.setValue(e.target.value)} class="text-gray-900 w-full text-xl p-2">
      <option value="Custom" selected={props.value === "Custom"}>Custom</option>
      <For each={Object.keys(PRESETS)}>{(presetName) => (
        <option value={presetName} selected={props.value === presetName}>{presetName}</option>
      )}</For>
    </select>
  );
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
        input:where([type="number"]) {
            width:100%;
            box-sizing:border-box;
            font-size:1rem;
        }
      `}
    </style>
    <RepConfig id="reps" value={props.value.reps} onInput={props.onInput} />
    <ActivationForce id="activationForce" value={props.value.activationForce} onInput={props.onInput} />
  </>
  );
}

function RepConfig(props) {
  return (
    <details>
      <summary class="p-2">Advanced Reps</summary>
      <fieldset>
        <RepCounts id={props.id + ".repCounts"} value={props.value.repCounts} onInput={props.onInput} />
        <RepBounds label="Top" id={props.id + ".top"} value={props.value.top} onInput={props.onInput} />
        <RepBounds label="Bottom" id={props.id + ".bottom"} value={props.value.bottom} onInput={props.onInput} />
        <RepBand label="Safety" id={props.id + ".safety"} value={props.value.safety} onInput={props.onInput} />
        <NumberInput label="Seed Range" id={props.id + ".seedRange"} value={props.value.seedRange} onInput={props.onInput} />
      </fieldset>
    </details>
  )
}

function RepCounts(props) {
  return (
    <fieldset>
      <legend>Rep Counts</legend>
      <NumberInput label="Total" id={props.id + ".total"} value={props.value.total} onInput={props.onInput} />
      <NumberInput label="Adaptive" id={props.id + ".adaptive"} value={props.value.adaptive} onInput={props.onInput} />
      <NumberInput label="Baseline" id={props.id + ".baseline"} value={props.value.baseline} onInput={props.onInput} />
    </fieldset>
  )
}

function RepBounds(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <RepBand label="Inner" id={props.id + ".inner"} value={props.value.inner} onInput={props.onInput} />
      <RepBand label="Outer" id={props.id + ".outer"} value={props.value.outer} onInput={props.onInput} />
      <NumberInput label="Drift" id={props.id + ".drift"} value={props.value.drift} onInput={props.onInput} />
      <NumberInput label="Threshold" id={props.id + ".threshold"} value={props.value.threshold} onInput={props.onInput} />
    </fieldset>
  )
}

function RepBand(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <NumberInput label="mm/M" id={props.id + ".mmPerM"} value={props.value.mmPerM} onInput={props.onInput} />
      <NumberInput label="mm Max" id={props.id + ".mmMax"} value={props.value.mmMax} onInput={props.onInput} />
    </fieldset>
  )
}

function ActivationForce(props) {
  return (
    <details>
      <summary class="p-2">Advanced Forces</summary>
      <fieldset>
        <fieldset>
          <legend>Forces</legend>
          <NumberInput label="Min" id={props.id + ".forces.min"} value={props.value.forces.min} onInput={props.onInput} />
          <NumberInput label="Max" id={props.id + ".forces.max"} value={props.value.forces.max} onInput={props.onInput} />
        </fieldset>

        <NumberInput label="Soft Max" id={props.id + ".softMax"} value={props.value.softMax} onInput={props.onInput} />
        <NumberInput label="Increment" id={props.id + ".increment"} value={props.value.increment} onInput={props.onInput} />

        <ActivationPhase label="Concentric" id={props.id + ".concentric"} value={props.value.concentric} onInput={props.onInput} />
        <ActivationPhase label="Eccentric" id={props.id + ".eccentric"} value={props.value.eccentric} onInput={props.onInput} />
      </fieldset>
    </details>
  );
}

function ActivationPhase(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <ActivationRamp label="Increase" id={props.id + ".increase"} value={props.value.increase} onInput={props.onInput} />
      <ActivationRamp label="Decrease" id={props.id + ".decrease"} value={props.value.decrease} onInput={props.onInput} />
    </fieldset>
  )
}

function ActivationRamp(props) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      <NumberInput label="Max" id={props.id + ".maxMmS"} value={props.value.maxMmS} onInput={props.onInput} />
      <NumberInput label="Min" id={props.id + ".minMmS"} value={props.value.minMmS} onInput={props.onInput} />
      <NumberInput label="Ramp" id={props.id + ".ramp"} value={props.value.ramp} onInput={props.onInput} />
    </fieldset>
  );
}

function NumberInput(props) {
  return (
    <div class="field">
      <label for={props.id}>{props.label}</label>
      <input class="bg-gray-700" type="number" step="any" id={props.id} name={props.id} value={props.value} onInput={props.onInput} />
    </div>
  );
}

function WorkoutView(props) {
  const leftWeight = () => {
    const { left } = Trainer.sample();
    return left.position <= 0.5 && left.velocity === 0 ? 0 : left.force;
  };

  const rightWeight = () => {
    const { right } = Trainer.sample();
    return right.position <= 0.5 && right.velocity === 0 ? 0 : right.force;
  };

  const leftROM = () => Trainer.rangeOfMotion().left;
  const rightROM = () => Trainer.rangeOfMotion().right;

  const currentRep = () => {
    const { up, down } = Trainer.reps();
    return (up + down) / 2 - props.config.reps.repCounts.baseline;
  };

  const totalReps = () => props.config.reps.repCounts.total - props.config.reps.repCounts.baseline;

  const targetWeight = () => props.config.activationForce.softMax * 2;

  onCleanup(() => {
    if (Trainer.connected()) {
      Trainer.stop();
    }
  });

  return (
    <>
    <div class="flex flex-col flex-1 justify-center items-center">
      <WeightAndRangeOfMotion
        unit="lbs"
        weight={currentRep() < 0 ? targetWeight() : leftWeight() + rightWeight()}
        targetWeight={targetWeight()}
        leftROM={leftROM()}
        rightROM={rightROM()} />
      <div class="text-right mt-8">
        <div class="">
          <span class="text-gray-100 text-7xl">{currentRep()}</span>
          <span class="text-gray-400 text-5xl">/{totalReps() || "?"}</span>
        </div>
        <span class="text-sm font-bold tracking-wider text-gray-500 mx-1">
          REPS
        </span>
      </div>
    </div>
    <Button class="w-full" onClick={(e) => {
      e.preventDefault();
      if (Trainer.connected()) {
        Trainer.stop();
      }
    }}>Stop</Button>
    </>
  )
}

function deepEqual(obj1, obj2) {
  // Check if the objects are of the same type
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  // Check if both objects are null
  if (obj1 === null && obj2 === null) {
    return true;
  }

  // Check if the objects have the same number of properties
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  // Check if the values of the properties are deeply equal
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  // If all checks pass, the objects are deeply equal
  return true;
}