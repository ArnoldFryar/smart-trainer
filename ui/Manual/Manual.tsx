import { createSignal, For, onCleanup, Show } from 'solid-js';
import { getNestedFormData } from '../../services/util/form.js';
import { createLocalSignal } from '../../services/util/signals.js';
import { PRESETS, getRegularCommand, getEchoCommand } from '../../services/device/activate.js';
import { Button } from '../_common/Elements/Elements.jsx';
import { WeightAndRangeOfMotion } from '../Workout/WeightAndRangeOfMotion/WeightAndRangeOfMotion.jsx';
import { wakeLock } from '../../services/util/wake-lock.js';

const DEFAULT_ACTIVATE_CONFIG = {
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

const DEFAULT_REGULAR_CONFIG = {
  romRepCount: 3,
  repCount: 10,
  mode: {
    spotter: 0,
    concentric: 10,
    eccentric: 10,
    progression: 0,
    curve: {
      linearC1: 0,
      squareC2: 0,
    },
  },
};

const DEFAULT_ECHO_CONFIG = {
  romRepCount: 3,
  repCount: 10,
  mode: {
    spotter: 0,
    eccentricOverload: 0,
    referenceMapBlend: 0,
    concentricDelayS: 0.0,
    concentric:{
      duration: 3,
      maxVelocity: 55,
    },
    eccentric: {
      duration: 0,
      maxVelocity: -200,
    }
  },
}
  

export default function Manual() {
  const [command, setCommand] = createLocalSignal("manual-command", "Activate");
  const [savedActivateConfig, setSavedActivateConfig] = createLocalSignal("manual-activate-config", DEFAULT_ACTIVATE_CONFIG);
  const [savedRegularConfig, setSavedRegularConfig] = createLocalSignal("manual-regular-config", DEFAULT_REGULAR_CONFIG);
  const [savedEchoConfig, setSavedEchoConfig] = createLocalSignal("manual-echo-config", DEFAULT_ECHO_CONFIG);
  const [activateConfig, setActivateConfig] = createSignal(savedActivateConfig());
  const [regularConfig, setRegularConfig] = createSignal(savedRegularConfig());
  const [echoConfig, setEchoConfig] = createSignal(savedEchoConfig());
  const weight = () => {
    if (command() === "Activate") {
      return activateConfig().activationForce.softMax * 2;
    } else if (command() === "Regular") {
      return regularConfig().mode.concentric * 2;
    } else if (command() === "Echo") {
      return "NaN";
    }
  }
  const setWeight = (weight) => {
    if (!Number.isNaN(weight)) {
      setActivateConfig({
        ...activateConfig(),
        activationForce: {
          ...activateConfig().activationForce,
          forces: {
            ...activateConfig().activationForce.forces,
            max: weight/2 + 10,
          },
          softMax: weight/2,
        }
      })
      setRegularConfig({
        ...regularConfig(),
        mode: {
          ...regularConfig().mode,
          concentric: weight/2,
          eccentric: (regularConfig().mode.eccentric/regularConfig().mode.concentric || 1) * weight/2,
        }
      });
    }
  };
  const reps = () => {
    if (command() === "Activate") {
      return activateConfig().reps.repCounts.total - activateConfig().reps.repCounts.baseline;
    } else if (command() === "Regular") {
      return regularConfig().repCount;
    } else if (command() === "Echo") {
      return echoConfig().repCount;
    }
  }
  const setReps = (reps) => {
    setActivateConfig({
      ...activateConfig(),
      reps: {
        ...activateConfig().reps,
        repCounts: {
          ...activateConfig().reps.repCounts,
          total: reps + activateConfig().reps.repCounts.baseline,
        }
      }
    })
    setRegularConfig({
      ...regularConfig(),
      repCount: reps,
    });
    setEchoConfig({
      ...echoConfig(),
      repCount: reps,
    });
  };
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
        <BasicControls weight={weight()} setWeight={setWeight} reps={reps()} setReps={setReps} command={command()} setCommand={setCommand} />
        <form class="flex flex-col flex-1 p-2" onSubmit={async (e) => {
          e.preventDefault();
          const config = getNestedFormData(e.currentTarget);

          if (command() === "Activate") {
            setSavedActivateConfig(config);
          } else if (command() === "Regular") {
            setSavedRegularConfig(config);
          } else if (command() === "Echo") {
            setSavedEchoConfig(config);
          }

          if (!Trainer.connected()) {
            await Trainer.connect();
          }

          if (command() === "Activate") {
            await Trainer.activate(config.reps, config.activationForce);  
          } else if (command() === "Regular") {
            await Trainer._writeCommand(getRegularCommand(config));
          } else if (command() === "Echo") {
            console.log(getEchoCommand(config));
            await Trainer._writeCommand(getEchoCommand(config));
          }
        }}>
          <div class="flex-1 basis-0 overflow-y-auto">
            <Show when={command() === "Activate"}>
              <ActivateFields value={activateConfig()} onInput={e => setActivateConfig(getNestedFormData(e.target.form))} preset={preset} setPreset={setPreset} />
            </Show>
            <Show when={command() === "Regular"}>
              <RegularFields value={regularConfig()} onInput={e => setRegularConfig(getNestedFormData(e.target.form))}/>
            </Show>
            <Show when={command() === "Echo"}>
              <EchoFields value={echoConfig()} onInput={e => setEchoConfig(getNestedFormData(e.target.form))}/>
            </Show>
          </div>
          <FieldStyles/>
          <div class="flex">
            <Button onClick={(e) => {
              e.preventDefault();
              if (command() === "Activate") {
                setActivateConfig(DEFAULT_ACTIVATE_CONFIG);
              } else if (command() === "Regular") {
                setRegularConfig(DEFAULT_REGULAR_CONFIG);
              } else if (command() === "Echo") {
                setEchoConfig(DEFAULT_ECHO_CONFIG);
              }
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
      <CommandSelect value={props.command} setValue={props.setCommand} />
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
      <input class="bg-gray-700 text-center p-2" style="font-size: 3em;" type="number" step="any" id={props.id} name={props.id} value={props.value} disabled={Number.isNaN(props.value)} onInput={(e) => props.setValue(e.target.valueAsNumber)} />
      <label class="text-center" for={props.id}>{props.label}</label>
    </div>
  );
}

function CommandSelect(props) {
  return (
    <select onChange={(e) => props.setValue(e.target.value)} class="text-gray-900 w-full text-xl p-2">
      <option value="Activate" selected={props.value === "Activate"}>Activate</option>
      <option value="Regular" selected={props.value === "Regular"}>Regular</option>
      <option value="Echo" selected={props.value === "Echo"}>Echo</option>
    </select>
  );
}

function FieldStyles() {
  return <style>
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
}

function RegularFields(props) {
  return (
    <details>
      <summary class="p-2">Advanced</summary>
      <fieldset>
        <legend>Rep Counts</legend>
        <NumberInput label="ROM Reps" id={"romRepCount"} value={props.value.romRepCount} onInput={props.onInput} />
        <NumberInput label="Working Reps" id={"repCount"} value={props.value.repCount} onInput={props.onInput} />
      </fieldset>
      <fieldset>
        <legend>Mode</legend>
        <NumberInput label="Spotter" id={"mode.spotter"} value={props.value.mode.spotter} onInput={props.onInput} />
        <NumberInput label="Concentric" id={"mode.concentric"} value={props.value.mode.concentric} onInput={props.onInput} />
        <NumberInput label="Eccentric" id={"mode.eccentric"} value={props.value.mode.eccentric} onInput={props.onInput} />
        <NumberInput label="Progression" id={"mode.progression"} value={props.value.mode.progression} onInput={props.onInput} />
      </fieldset>
      <fieldset>
        <legend>Curve</legend>
        <NumberInput label="Linear (bx)" id={"mode.curve.linearC1"} value={props.value.mode.curve.linearC1} onInput={props.onInput} />
        <NumberInput label="Square (ax^2)" id={"mode.curve.squareC2"} value={props.value.mode.curve.squareC2} onInput={props.onInput} />
      </fieldset>
    </details>
  );
}

function EchoFields(props) {
  return (
    <details>
      <summary class="p-2">Advanced</summary>
      <fieldset>
        <legend>Rep Counts</legend>
        <NumberInput label="ROM Reps" id={"romRepCount"} value={props.value.romRepCount} onInput={props.onInput} />
        <NumberInput label="Working Reps" id={"repCount"} value={props.value.repCount} onInput={props.onInput} />
      </fieldset>
      <fieldset>
        <legend>Mode</legend>
        <NumberInput label="Spotter" id={"mode.spotter"} value={props.value.mode.spotter} onInput={props.onInput} />
        <NumberInput label="Eccentric Overload" id={"mode.eccentricOverload"} value={props.value.mode.eccentricOverload} onInput={props.onInput} />
        <NumberInput label="Reference Map Blend" id={"mode.referenceMapBlend"} value={props.value.mode.referenceMapBlend} onInput={props.onInput} />
        <NumberInput label="Concentric Delay" id={"mode.concentricDelayS"} value={props.value.mode.concentricDelayS} onInput={props.onInput} />
      </fieldset>
      <fieldset>
        <legend>Concentric</legend>
        <NumberInput label="Duration" id={"mode.concentric.duration"} value={props.value.mode.concentric.duration} onInput={props.onInput} />
        <NumberInput label="Max Velocity" id={"mode.concentric.maxVelocity"} value={props.value.mode.concentric.maxVelocity} onInput={props.onInput} />
      </fieldset>
      <fieldset>
        <legend>Eccentric</legend>
        <NumberInput label="Duration" id={"mode.eccentric.duration"} value={props.value.mode.eccentric.duration} onInput={props.onInput} />
        <NumberInput label="Max Velocity" id={"mode.eccentric.maxVelocity"} value={props.value.mode.eccentric.maxVelocity} onInput={props.onInput} />
      </fieldset>
    </details>
  );
}

function ActivateFields(props) {
  return (<>
    <RepConfig id="reps" value={props.value.reps} onInput={props.onInput} />
    <ActivationForce id="activationForce" value={props.value.activationForce} onInput={props.onInput} preset={props.preset} setPreset={props.setPreset} />
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
      <ActivationPresetSelect value={props.preset} setValue={props.setPreset}/>
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

function ActivationPresetSelect(props) {
  return (
    <select onChange={(e) => props.setValue(e.target.value)} class="text-gray-900 w-full text-xl p-2">
      <option value="Custom" selected={props.value === "Custom"}>Custom</option>
      <For each={Object.keys(PRESETS)}>{(presetName) => (
        <option value={presetName} selected={props.value === presetName}>{presetName}</option>
      )}</For>
    </select>
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

  wakeLock();

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