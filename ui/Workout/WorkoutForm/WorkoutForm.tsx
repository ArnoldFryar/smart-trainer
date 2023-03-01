import { Exercise } from '../../../services/workout/exercises.js';
import { Button, Radio, RadioGroup } from '../../_common/Elements/Elements.js';
export namespace WorkoutForm {
  export interface Props {
    exercies: { main: Exercise[], accessory: Exercise[] },
    connected: boolean,
    onSubmit: (workoutOptions: any) => void;
  }
}

export function WorkoutForm(props) {
  const activate = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    props.onSubmit({ 
      length: data.get("length"),
      superset: data.get("superset") === "true",
      users: parseInt(data.get("users") as string),
      exercises: props.exercises
    });
  };
  return (
    <form onSubmit={activate} class="p-4">
      <RadioGroup label="Workout Length">
        <Radio name="length" value="mini" checked>
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
      <RadioGroup label="Superset">
        <Radio name="superset" value="true" checked>
            <span>Yes</span>
        </Radio>
        <Radio name="superset" value="false">
            <span>No</span>
        </Radio>
      </RadioGroup>
      <RadioGroup label="Group Size">
        <Radio name="users" value="1" checked>
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
      {/* TODO: Add options for customizing exercises */}
      <pre>{JSON.stringify(props.exercises, null, 2)}</pre>
      <Button type="submit">{props.connected ? "Workout!" : "Connect"}</Button>
    </form>
  );
}
