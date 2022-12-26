import { Show, createSignal, createResource } from 'solid-js';
import { WorkoutForm } from '../Workout/WorkoutForm/WorkoutForm.js';
import { WorkoutActive } from '../Workout/WorkoutActive/WorkoutActive.js';
import { selectExercises } from '../../services/workout/index.js';
import { Button } from '../_common/Elements/Elements.js';

export function Workout(props: { onExit: () => void }) {
  const [workoutConfig, setWorkoutConfig] = createSignal(null);
  const [exercises] = createResource(() => selectExercises());

  return (
    <>
      <Button class="absolute top-4 right-4" onClick={() => props.onExit()}>
        Exit
      </Button>
      <Show when={!workoutConfig()}>
        <WorkoutForm
          connected={Trainer.connected()}
          exercises={exercises()}
          onSubmit={async (config) => {
            if (!Trainer.connected()) {
              await Trainer.connect();
            }
            setWorkoutConfig(config);
          }}
        />
      </Show>
      <Show when={workoutConfig()}>
        <WorkoutActive
          config={workoutConfig()}
          onComplete={() => {
            props.onExit();
          }}
        />
      </Show>
    </>
  );
}