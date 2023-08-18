import { createSignal, For, Show } from "solid-js";
import { EXERCISES } from "../../../services/workout/exercises.js";
import {
  Button,
  FieldSet,
  Radio,
  RadioGroup,
  Select,
  Slider,
} from "../../_common/Elements/Elements.js";
import { createLocalSignal } from "../../../services/util/signals.js";
import { DEFAULT_USERS, WorkoutConfig } from "../../../services/workout/index.js";
import { ACTIVE_WORKOUT_MODES, WORKOUT_MODE, WORKOUT_MODE_CONFIGS } from "../../../services/workout/modes.js";
import { getNestedFormData } from "../../../services/util/form.js";
export namespace WorkoutForm {
  export interface Props {
    config: WorkoutConfig;
    connected: boolean;
    onSubmit: (workoutOptions: any) => void;
  }
}

const EXERCISE_KEYS = Object.keys(EXERCISES);

export function WorkoutForm(props: WorkoutForm.Props) {
  const activate = async (e) => {
    e.preventDefault();
    const data = getNestedFormData(e.target);
    props.onSubmit(data);
  };
  return (
    <form onSubmit={activate} class="p-4">
      <UserSelect value={props.config.users}/>
      <Sets value={props.config.sets} name="sets"/>
      <Button type="submit" primary>{props.connected ? "Workout!" : "Connect"}</Button>
    </form>
  );
}

function UserSelect(props: { value: string[] }) {
  const [users, setUsers] = createLocalSignal("users", DEFAULT_USERS);
  const usersEntries = () => Object.entries(users());
  return (
    <FieldSet label="Users">
      <div class="flex w-full">
        <For each={usersEntries()}>
          {([key, user]) => (
            <label class="group flex flex-col mr-2 cursor-pointer">
              <input type="checkbox" checked={props.value?.includes?.(key)} name="users[]" value={key} class="hidden peer"/>
              <div class={`
                flex
                justify-center
                items-center
                w-14
                h-14
                rounded-full
                text-xl
                text-white
                border
                border-transparent
                opacity-50
                peer-checked:border-white/30
                peer-checked:opacity-100
                hover:border-white/30
              `} style={`background:hsl(${user.hue}, 60%, 35%);`}>
                {user.name[0]}
              </div>
              <div class="flex justify-center text-xs mt-2 
                text-gray-600 peer-checked:text-white">
                {user.name}
              </div>
            </label>
          )}
        </For>
        <div class="group flex flex-col mr-2 cursor-pointer">
            <div class={`
              flex
              justify-center
              items-center
              w-14
              h-14
              rounded-full
              text-xl
              border
              text-white
              border-gray-600
              bg-gray-800
            `}>
              +
            </div>
            <div class="flex justify-center text-xs mt-2 text-white">
              Add User
            </div>
          </div>
      </div>
    </FieldSet>
  );
}

const DEFAULT_SET = {
  exercise: "BACK_SQUAT",
  mode: WORKOUT_MODE.ADAPTIVE,
  forcedReps: 3,
  spotterVelocity: 0.25
};

function Sets(props) {
  let button!: HTMLButtonElement;
  const [sets, setSets] = createSignal(props.value || [DEFAULT_SET]);
  const [openIndex, setOpenIndex] = createSignal(sets().length === 1 ? 0 : -1);
  const copyLast = (e) => {
    e.preventDefault();
    const formData = getNestedFormData((e.target as HTMLButtonElement).form);
    const currentSets = formData[props.name];
    setSets([
      ...currentSets,
      currentSets[currentSets.length - 1]
    ]);
    setOpenIndex(currentSets.length);
  }
  const copyAll = (e) => {
    e.preventDefault();
    const formData = getNestedFormData((e.target as HTMLButtonElement).form);
    const currentSets = formData[props.name];
    setSets([
      ...currentSets,
      ...currentSets
    ]);
    setOpenIndex(-1);
  }
  const updateSets = (e) => {
    const formData = getNestedFormData((e.target as HTMLInputElement).form);
    const currentSets = formData[props.name];
    setSets(currentSets);
  }
  const removeSet = (i) => {
    if (canRemove()) {
      const formData = getNestedFormData((button as HTMLButtonElement).form);
      const currentSets = formData[props.name];
      setSets([
        ...currentSets.slice(0, i),
        ...currentSets.slice(i + 1)
      ]);
      if (openIndex() === i) {
        setOpenIndex(-1);
      } else if (openIndex() > i) {
        setOpenIndex(openIndex() - 1)
      }
    }
  }
  const canRemove = () => sets().length > 1;

  return (
    <FieldSet label={`Sets`}>
      <For each={sets()}>
        {(set, i) => (
          <Set 
            name={`${props.name}.${i()}`} 
            value={set} 
            open={i() === openIndex()} 
            onOpen={() => setOpenIndex(i())} 
            onChange={updateSets} 
            canRemove={canRemove()}
            onRemove={() => removeSet(i())}
            />
        )}
      </For>
      <Button ref={button} onClick={copyLast}>Add Set</Button>
      <Button onClick={copyAll}>Copy All</Button>
    </FieldSet>
  );
}

function Set(props) {
  const [mode, setMode] = createSignal(props.value.mode || WORKOUT_MODE.ADAPTIVE);
  const selectMode = (e) => setMode(e.target.value);
  const onOpen = (e) => {
    if (e.currentTarget.open) {
      props.onOpen();
    }
  }
  const onRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onRemove?.();
  }

  return (
    <details open={props.open} onToggle={onOpen} class="mb-2" onChange={props.onChange}>
      <summary class="p-2 text-gray-400 bg-gray-800 rounded">
        <span class="text-white inline-block ml-1">
          {props.value.exercise}
          <span class="block text-xs text-gray-400">
            {WORKOUT_MODE_CONFIGS[mode()].name}
            <Show when={props.value.reps}>
              &nbsp;&bull; {props.value.reps}reps
            </Show>
            <Show when={props.value.forcedReps}>
            &nbsp;&bull; {props.value.forcedReps}fr
            </Show>
            <Show when={props.value.rir}>
            &nbsp;&bull; {props.value.rir}rir
            </Show>
            <Show when={props.value.spotterVelocity}>
            &nbsp;&bull; {props.value.spotterVelocity}m/s
            </Show>
          </span>
        </span>
        <Show when={props.canRemove}><Button class="float-right" onClick={onRemove}>
          ✕
        </Button></Show>
        
      </summary>
      <div class="border border-gray-800 px-2 -mt-2">
        <FieldSet label="Exercise">
          <Select name={`${props.name}.exercise`} class="mr-2">
            <For each={EXERCISE_KEYS}>
              {(key) => (
                <option selected={key === props.value.exercise}>
                  {key}
                </option>
              )}
            </For>
          </Select>
        </FieldSet>
        <RadioGroup label="Workout Mode" checkedValue={mode()} onChange={selectMode}>
          <For each={ACTIVE_WORKOUT_MODES}>
            {(mode) => (
              <Radio name={`${props.name}.mode`} value={mode}>
                <span class="text-sm">{WORKOUT_MODE_CONFIGS[mode].name}</span>
              </Radio>
            )}
          </For>
        </RadioGroup>
        <Show when={mode() !== WORKOUT_MODE.ADAPTIVE && mode() !== WORKOUT_MODE.PUMP}>
          <FieldSet label="Reps">
            <Slider name={`${props.name}.reps`} value={props.value.reps ?? 10} max={20} min={1}/>
          </FieldSet>
        </Show>
        <Show when={mode() === WORKOUT_MODE.PUMP}>
          <FieldSet label="Time">
            <Slider name={`${props.name}.time`} value={props.value.time ?? 30} max={120} min={10} step={10}/>
          </FieldSet>
        </Show>
        <Show when={mode() === WORKOUT_MODE.ADAPTIVE || mode() === WORKOUT_MODE.TUT}>
          <FieldSet label="Forced Reps">
            <Slider name={`${props.name}.forcedReps`} value={props.value.forcedReps ?? 3} max={10} min={1}/>
          </FieldSet>
          <FieldSet label="Spotter Velocity (m/s)">
            <Slider name={`${props.name}.spotterVelocity`} value={props.value.spotterVelocity ?? 0.25} max={0.5} min={0} step={0.05}/>
          </FieldSet>
        </Show>
        <Show when={mode() === WORKOUT_MODE.STATIC || mode() === WORKOUT_MODE.ECCENTRIC}>
          <FieldSet label="Reps in Reserve">
            <Slider name={`${props.name}.rir`} value={props.value.rir ?? 3} max={10} min={0}/>
          </FieldSet>
        </Show>
      </div>
    </details>
  )
}
