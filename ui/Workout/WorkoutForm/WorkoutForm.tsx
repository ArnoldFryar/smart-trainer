import { For } from 'solid-js';
import { Button, Input } from '../../_common/Elements/Elements.js';

type Exercise = {
  name: string;
  reps: number;
  weight: number;
};

export namespace WorkoutForm {
  export interface Props {
    onSubmit: (exercises: Exercise[]) => void;
    exercises: Exercise[];
  }
}

export function WorkoutForm(props) {
  const activate = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const names = formData.getAll('name');
    const reps = formData.getAll('reps');
    const weights = formData.getAll('weight');
    const exercises = [];

    for (let i = 0; i < names.length; i++) {
      exercises.push({
        name: names[i],
        reps: parseInt(reps[i] as string, 10),
        weight: parseInt(weights[i] as string, 10),
      });
    }

    props.onSubmit(exercises);
  };
  return (
    <form onSubmit={activate}>
      <For each={props.exercises}>
        {(exercise, index) => (
          <ExerciseFieldset name={`exercise[${index()}]`} value={exercise} />
        )}
      </For>
      <Button type="submit">Workout!</Button>
    </form>
  );
}

namespace ExerciseFieldset {
  export interface Props {
    name: string;
    value: Exercise;
  }
}

function ExerciseFieldset(props) {
  return (
    <fieldset class="flex">
      <Field
        label="Exercise"
        name="name"
        type="text"
        value={props.value.name}
      />
      <Field
        label="Reps"
        name="reps"
        type="number"
        min="1"
        max="255"
        value={props.value.reps}
      />
      <Field
        label="Weight (kg)"
        name="weight"
        type="number"
        min="5"
        max="100"
        value={props.value.weight}
      />
    </fieldset>
  );
}

function Field(props) {
  return (
    <div class="m-2">
      <label class="block text-xs">{props.label}</label>
      <Input {...props} />
    </div>
  );
}
