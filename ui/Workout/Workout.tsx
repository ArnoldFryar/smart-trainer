import { Show, createSignal } from 'solid-js';
import { WorkoutForm } from '../Workout/WorkoutForm/WorkoutForm.js';
import { WorkoutActive } from '../Workout/WorkoutActive/WorkoutActive.js';
import { Button } from '../_common/Elements/Elements.js';
import { createLocalSignal } from '../../services/util/signals.js';
import { WorkoutConfig } from '../../services/workout/index.js';

export function Workout(props: { onExit: () => void }) {
  const [previousWorkoutConfig, setPreviousWorkoutConfig] = createLocalSignal("previous-workout", {} as WorkoutConfig);
  const [workoutConfig, setWorkoutConfig] = createSignal(null);

  return (
    <>
      <Button class="absolute top-4 right-4" onClick={() => props.onExit()}>
        Exit
      </Button>
      <Show when={!workoutConfig()}>
        <WorkoutForm
          config={previousWorkoutConfig()}
          connected={Trainer.connected()}
          onSubmit={async (config) => {
            setPreviousWorkoutConfig(config);

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