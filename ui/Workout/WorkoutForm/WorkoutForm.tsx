import { createSignal, For } from "solid-js";
import { Exercise, EXERCISES } from "../../../services/workout/exercises.js";
import {
  Button,
  FieldSet,
  Radio,
  RadioGroup,
} from "../../_common/Elements/Elements.js";
export namespace WorkoutForm {
  export interface Props {
    config: {
      length: "full" | "short" | "mini";
      users: number;
      superset: boolean;
      exercises: Array<keyof Exercise>;
    };
    connected: boolean;
    onSubmit: (workoutOptions: any) => void;
  }
}

const EXERCISE_KEYS = Object.keys(EXERCISES);

export function WorkoutForm(props) {
  const activate = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    props.onSubmit({
      length: data.get("length"),
      superset: data.get("superset") === "true",
      users: parseInt(data.get("users") as string),
      exercises: data.getAll("exercise"),
    });
  };
  return (
    <form onSubmit={activate} class="p-4">
      <RadioGroup label="Workout Length" checkedValue={props.config.length}>
        <Radio name="length" value="mini">
          <span>Mini</span>
          <span class="text-xs opacity-80 block">About 5 minutes</span>
        </Radio>
        <Radio name="length" value="short">
          <span>Short</span>
          <span class="text-xs opacity-80 block">About 20 minutes</span>
        </Radio>
        <Radio name="length" value="full">
          <span>Full</span>
          <span class="text-xs opacity-80 block">About 40 minutes</span>
        </Radio>
      </RadioGroup>
      <RadioGroup label="Superset" checkedValue={props.config.superset}>
        {/* By Equipment, All, None */}
        <Radio name="superset" value="true">
          <span>Yes</span>
        </Radio>
        <Radio name="superset" value="false">
          <span>No</span>
        </Radio>
      </RadioGroup>
      <RadioGroup label="Group Size" checkedValue={props.config.users}>
        <Radio name="users" value="1">
          <span>1</span>
          <span class="text-xs opacity-80 block">Just You</span>
        </Radio>
        <Radio name="users" value="2">
          <span>2</span>
          <span class="text-xs opacity-80 block">Pair</span>
        </Radio>
        <Radio name="users" value="3">
          <span>3</span>
          <span class="text-xs opacity-80 block">Trio</span>
        </Radio>
      </RadioGroup>
      <ExerciseSelect defaultValue={props.config.exercises} />
      <Button type="submit">{props.connected ? "Workout!" : "Connect"}</Button>
    </form>
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
            <div class="flex my-2">
              <select
                name="exercise"
                class="rounded p-2 mr-2 bg-gray-800 shadow-md border border-gray-200 text-gray-200"
              >
                <For each={EXERCISE_KEYS}>
                  {(key) => <option selected={key === exercise}>{key}</option>}
                </For>
              </select>
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
