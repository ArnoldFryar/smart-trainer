import { Show, createSignal, createResource } from 'solid-js';
import { WorkoutForm } from '../Workout/WorkoutForm/WorkoutForm.js';
import { WorkoutActive } from '../Workout/WorkoutActive/WorkoutActive.js';
import { selectExercises } from '../../services/workout/index.js';
import { Button } from '../_common/Elements/Elements.js';

export function Workout(props: { onExit: () => void }) {
  const [workoutActive, setWorkoutActive] = createSignal(false);
  const [exercises] = createResource(() => selectExercises());

  return (
    <>
      <Button class="absolute top-4 right-4" onClick={() => props.onExit()}>
        Exit
      </Button>
      <Show when={!workoutActive()}>
        <WorkoutForm
          connected={Trainer.connected()}
          exercises={exercises()}
          onSubmit={async () => {
            if (!Trainer.connected()) {
              await Trainer.connect();
            }
            setWorkoutActive(Trainer.connected());
          }}
        />
      </Show>
      <Show when={workoutActive()}>
        <WorkoutActive
          unit="lbs"
          onComplete={() => {
            props.onExit();
          }}
        />
      </Show>
    </>
  );
}