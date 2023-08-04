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
export namespace WorkoutForm {
  export interface Props {
    config: WorkoutConfig;
    connected: boolean;
    onSubmit: (workoutOptions: any) => void;
  }
}

const EXERCISE_KEYS = Object.keys(EXERCISES);

export function WorkoutForm(props: WorkoutForm.Props) {
  const [mode, setMode] = createSignal(props.config.mode || "assess");
  const activate = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    props.onSubmit({
      reps: parseInt(data.get("reps") as string) ?? undefined,
      time: parseInt(data.get("time") as string) ?? undefined,
      forcedReps: parseInt(data.get("forcedReps") as string) ?? undefined,
      assistance: parseInt(data.get("assistance") as string) ?? undefined,
      rir: parseInt(data.get("rir") as string) ?? undefined,
      sets: parseInt(data.get("sets") as string),
      mode: data.get("mode"),
      superset: data.get("superset") === "true",
      users: data.getAll("users"),
      exercises: data.getAll("exercise"),
    });
  };
  const selectMode = (e) => {
    setMode(e.target.value);
  };
  return (
    <form onSubmit={activate} class="p-4">
      <UserSelect value={props.config.users}/>
      <RadioGroup label="Workout Mode" checkedValue={mode()} onChange={selectMode}>
        <For each={ACTIVE_WORKOUT_MODES}>
          {(mode) => (
            <Radio name="mode" value={mode}>
              <span class="text-sm">{WORKOUT_MODE_CONFIGS[mode].name}</span>
              <span class="text-xs opacity-80 block">
                {WORKOUT_MODE_CONFIGS[mode].description}
              </span>
            </Radio>
          )}
        </For>
      </RadioGroup>
      <Show when={mode() !== WORKOUT_MODE.ADAPTIVE && mode() !== WORKOUT_MODE.PUMP}>
        <FieldSet label="Reps">
          <Slider name="reps" value={props.config.reps ?? 10} max={20} min={1}/>
        </FieldSet>
      </Show>
      <Show when={mode() === WORKOUT_MODE.PUMP}>
        <FieldSet label="Time">
          <Slider name="time" value={props.config.time ?? 30} max={120} min={10} step={10}/>
        </FieldSet>
      </Show>
      <Show when={mode() === WORKOUT_MODE.ADAPTIVE || mode() === WORKOUT_MODE.TUT}>
        <FieldSet label="Forced Reps">
          <Slider name="forcedReps" value={props.config.forcedReps ?? 3} max={10} min={1}/>
        </FieldSet>
        <FieldSet label="Spotter Assistance">
          <Slider name="assistance" value={props.config.assistance ?? 3} max={10} min={0}/>
        </FieldSet>
      </Show>
      <Show when={mode() === WORKOUT_MODE.STATIC || mode() === WORKOUT_MODE.ECCENTRIC}>
        <FieldSet label="Reps in Reserve">
          <Slider name="rir" value={props.config.rir ?? 3} max={10} min={0}/>
        </FieldSet>
      </Show>
      <FieldSet label="Sets">
        <Slider name="sets" value={props.config.sets ?? 3} max={10} min={1}/>
      </FieldSet>
      <ExerciseSelect defaultValue={props.config.exercises} mode={mode()} />
      <RadioGroup label="Superset" checkedValue={props.config.superset}>
        {/* By Equipment, All, None */}
        <Radio name="superset" value="true">
          <span>Yes</span>
        </Radio>
        <Radio name="superset" value="false">
          <span>No</span>
        </Radio>
      </RadioGroup>
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
              <input type="checkbox" checked={props.value?.includes?.(key)} name="users" value={key} class="hidden peer"/>
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

// add a select for each exercise with an add button
function ExerciseSelect(props) {
  const [exercises, setExercises] = createSignal(props.defaultValue || []);

  return (
    <FieldSet label="Exercises">
      <div class="flex flex-col">
        <For each={exercises()}>
          {(exercise, i) => (
            <div class="flex flex-col my-2">
              <div class="flex">
                <Select name="exercise" class="mr-2">
                  <For each={EXERCISE_KEYS}>
                    {(key) => (
                      <option selected={key === exercise}>
                        {key}
                        <Show when={props.mode !== "assess"}>
                          {/* missing_e1rm ? "w/ assessment" : "@100lbs" */}
                        </Show>
                      </option>
                    )}
                  </For>
                </Select>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    setExercises([
                      ...exercises().slice(0, i()),
                      ...exercises().slice(i() + 1),
                    ]);
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </For>
      </div>
      <div class="flex">
        <Button
          class="mr-2"
          onClick={(e) => {
            e.preventDefault();
            setExercises(
              exercises().map(() => {
                return EXERCISE_KEYS[
                  Math.floor(Math.random() * EXERCISE_KEYS.length)
                ];
              })
            );
          }}
        >
          ⟳
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            setExercises([...exercises(), {}]);
          }}
        >
          +
        </Button>
      </div>
    </FieldSet>
  );
}
