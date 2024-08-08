import { Show, createSignal } from 'solid-js';
import { SetConfigCache, WorkoutForm } from '../Workout/WorkoutForm/WorkoutForm.js';
import { WorkoutActive } from '../Workout/WorkoutActive/WorkoutActive.js';
import { Button } from '../_common/Elements/Elements.js';
import { createLocalSignal } from '../../services/util/signals.js';
import { WorkoutConfig } from '../../services/workout/index.js';
import { useNavigate } from '@solidjs/router';

export default function Workout(props: { onExit: () => void }) {
  const navigate = useNavigate();
  const [previousWorkoutConfig, setPreviousWorkoutConfig] = createLocalSignal("previous-workout", {} as WorkoutConfig);
  const [previousSetConfigs, setPreviousSetConfigs] = createLocalSignal("previous-sets", {} as SetConfigCache);
  const [workoutConfig, setWorkoutConfig] = createSignal(null);

  return (
    <>
      <Button class="absolute top-4 right-4" onClick={() => navigate("/")}>
        Exit
      </Button>
      <Show when={!workoutConfig()}>
        <WorkoutForm
          config={previousWorkoutConfig()}
          cache={previousSetConfigs()}
          connected={Trainer.connected()}
          onSubmit={async (config: WorkoutConfig) => {
            setPreviousWorkoutConfig(config);

            let previousSets = previousSetConfigs();
            [...config.sets].reverse().forEach((set) => {
              previousSets = {
                ...previousSets,
                [set.exercise]: {
                  ...previousSets[set.exercise],
                  [set.mode]: set
                }
              }
            });
            setPreviousSetConfigs(previousSets);

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
            navigate("/");
          }}
        />
      </Show>
    </>
  );
}