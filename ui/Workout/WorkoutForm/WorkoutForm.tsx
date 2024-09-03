import { batch, createResource, createSignal, For, Show } from "solid-js";
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
import { ACTIVE_WORKOUT_MODES, WORKOUT_LIMIT, WORKOUT_MODE } from "../../../services/workout/modes.js";
import { getNestedFormData } from "../../../services/util/form.js";
import { getEstimated1RepMax } from "../../../services/db/settings.js";

export type SetConfigCache = { 
  [exercise: keyof typeof EXERCISES]: { 
    [mode: string]: WorkoutConfig["sets"][number] 
  }
};
export namespace WorkoutForm {
  export interface Props {
    config: WorkoutConfig;
    cache: SetConfigCache;
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
      <Sets value={props.config.sets} name="sets" cache={props.cache}/>
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
  mode: WORKOUT_MODE.CONVENTIONAL,
  limit: WORKOUT_LIMIT.REPS,
  reps: 10,
  weight: 40
};

function Sets(props) {
  let button!: HTMLButtonElement;
  const [sets, setSets] = createSignal(props.value || [DEFAULT_SET]);
  const [openIndex, setOpenIndex] = createSignal(-1);
  const copyLast = (e) => {
    e.preventDefault();
    const formData = getNestedFormData((e.target as HTMLButtonElement).form);
    const currentSets = formData[props.name] || [];
    setSets([
      ...currentSets,
      currentSets[currentSets.length - 1] || DEFAULT_SET
    ]);
    // setOpenIndex(currentSets.length);
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
            cache={props.cache}
            open={i() === openIndex()} 
            onOpen={(o) => setOpenIndex(o ? i() : -1)} 
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

function createInputSignal<T extends () => number>(syncedValue: T) {
  const [value, setValue] = createSignal(syncedValue());
  // createEffect(() => setValue(syncedValue()));
  return [value, setValue, (e) => setValue(parseInt(e.target.value, 10))] as const;
}

function Set(props) {
  const [value, setValue] = createSignal(props.value);
  const [weight, setWeight, onWeightInput] = createInputSignal(() => props.value.weight);
  const [maxWeight, setMaxWeight, onMaxWeightInput] = createInputSignal(() => props.value.maxWeight);

  const [e1rm] = createResource(async () => {
    const e1rmPerCableKg = (await getEstimated1RepMax("MICHAEL", props.value.exercise))?.e1rm;
    return e1rmPerCableKg * 2.2;
  });

  // TODO: on excerise change, select an appropriate weight 
  // relative to the weight for the previous exercise
  // createEffect((prev: number | undefined) => {
  //   if (prev) {
  //     const ratio = e1rm() / prev;
  //     untrack(() => {
  //       setWeight(weight() * ratio);
  //       setMaxWeight(maxWeight() * ratio);
  //     })
  //   }
  //   return e1rm() ?? prev;
  // })

  const onOpen = (e) => {
    props.onOpen(e.currentTarget.open);
  }
  const onRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onRemove?.();
  }
  const applyCachedExercise = (e) => {
    const exercise = e.target.value;
    const cachedSet = props.cache[exercise]?.[value().mode];
    if (cachedSet) {
      batch(() => {
        setValue(cachedSet);
        setWeight(cachedSet.weight);
        setMaxWeight(cachedSet.maxWeight);
      });
    }
  }
  const applyCachedMode = (e) => {
    const mode = e.target.value;
    const cachedSet = props.cache[value().exercise]?.[mode];
    if (cachedSet) {
      batch(() => {
        setValue(cachedSet);
        setWeight(cachedSet.weight);
        setMaxWeight(cachedSet.maxWeight);
      });
    }
  }

  return (
    <details open={props.open} onToggle={onOpen} class="mb-2" onChange={props.onChange}>
      <summary class="flex justify-center items-center p-2 text-gray-400 bg-gray-800 rounded">
        <span class="text-white flex-1 ml-1">
          <span class="flex">
            <Select name={`${props.name}.exercise`} class="flex-1 w-0 bg-gray-700" onChange={applyCachedExercise}>
              <For each={EXERCISE_KEYS}>
                {(key) => (
                  <option selected={key === value().exercise}>
                    {key}
                  </option>
                )}
              </For>
            </Select>
            <Select name={`${props.name}.mode`} class="flex-1 w-0 bg-gray-700 ml-1" onChange={applyCachedMode}>
              <For each={ACTIVE_WORKOUT_MODES}>
                {(mode) => (
                  <option selected={mode === value().mode}>
                    {mode}  
                  </option>
                )}
              </For>
            </Select>
            <Show when={props.canRemove}>
              <Button class="ml-2" onClick={onRemove}>✕</Button>
            </Show>
          </span>
          <span class="block text-xs text-gray-400 mt-2">
          <span class="font-mono mr-2">{props.open ? "▼" : "▶"}</span>
            <Show when={weight()}>
              {weight() + (maxWeight() && maxWeight() !== weight() ? `→${maxWeight()}` : "")}lbs 
              <Show when={e1rm()}>
                ({(100*weight()/e1rm()).toFixed(1)}%)
              </Show>
            </Show>
            <Show when={value().concentricDuration != null}>
              {value().concentricDuration}s
            </Show>
            <Show when={value().reps}>
              &nbsp;&bull; {value().reps}reps
            </Show>
            <Show when={value().forcedReps}>
            &nbsp;&bull; {value().forcedReps}fr
            </Show>
            <Show when={value().rir}>
            &nbsp;&bull; {value().rir}rir
            </Show>
            <Show when={value().spotterVelocity}>
            &nbsp;&bull; {value().spotterVelocity}m/s
            </Show>
          </span>
        </span>
      </summary>
      <div class="border border-gray-800 px-2 -mt-2">
        <Show when={value().mode === WORKOUT_MODE.ECHO}>
          <FieldSet label="Concentric Duration">
            <Slider name={`${props.name}.concentricDuration`} value={value().concentricDuration ?? 2} max={10} min={0} step={0.25} unit="s"/>
          </FieldSet>
        </Show>
        <Show when={value().mode !== WORKOUT_MODE.ECHO}>
          <FieldSet 
            label={`${value().mode === WORKOUT_MODE.PROGRESSION ? "Starting Weight" : "Weight"}`} 
            subtext={`(${(100*weight()/e1rm()).toFixed(1)}% e1RM)`}>
            <Slider name={`${props.name}.weight`} value={weight() ?? 40} max={440} min={1} unit="lbs" onInput={onWeightInput}/>
          </FieldSet>
          <Show when={value().mode === WORKOUT_MODE.PROGRESSION}>
            <FieldSet label="Maximum Weight" subtext={`(${(100*maxWeight()/e1rm()).toFixed(1)}% e1RM)`}>
              {/* TODO: show ± percentage of e1RM */}
              <Slider name={`${props.name}.maxWeight`} value={Math.max(maxWeight(), weight()) ?? 40} max={440} min={1} unit="lbs" onInput={onMaxWeightInput}/>
            </FieldSet>
            <FieldSet label="Incremental Steps">
              <Slider name={`${props.name}.progressionReps`} value={value().progressionReps ?? 3} max={10} min={1} unit="reps"/>
            </FieldSet>
          </Show>
          <FieldSet label="Spotter Velocity" subtext="X% MVT">
            {/* TODO: show percentage of eMVT */}
            <Slider name={`${props.name}.spotterVelocity`} value={value().spotterVelocity ?? 0.25} max={0.5} min={0} step={0.01} unit="m/s"/>
          </FieldSet>
        </Show>
        <RadioGroup label="Workout Limit" checkedValue={value().limit}>
          <For each={Object.keys(WORKOUT_LIMIT)}>
            {(limit) => (
              <Radio name={`${props.name}.limit`} value={limit}>
                <span class="text-sm">{limit}</span>
              </Radio>
            )}
          </For>
        </RadioGroup>
        {/* TODO: show estimated RPE */}
        <Show when={value().limit === WORKOUT_LIMIT.REPS}>
          <FieldSet label="Reps">
            <Slider name={`${props.name}.reps`} value={value().reps ?? 10} max={30} min={1} unit="reps"/>
          </FieldSet>
        </Show>
        <Show when={value().limit === WORKOUT_LIMIT.TIME}>
          <FieldSet label="Time">
            <Slider name={`${props.name}.time`} value={value().time ?? 30} max={120} min={10} step={10} unit="sec"/>
          </FieldSet>
        </Show>
        <Show when={value().limit === WORKOUT_LIMIT.FORCED_REPS}>
          <FieldSet label="Forced Reps">
            <Slider name={`${props.name}.forcedReps`} value={value().forcedReps ?? 3} max={10} min={1} unit="reps"/>
          </FieldSet>
        </Show>
        <Show when={value().limit === WORKOUT_LIMIT.VELOCITY_LOSS}>
          <FieldSet label="Velocity Loss">
            <Slider name={`${props.name}.velocityLoss`} value={value().spotterVelocity ?? 40} max={80} min={10} step={5} unit="%"/>
          </FieldSet>
        </Show>
      </div>
    </details>
  )
}
