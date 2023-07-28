import { For, createResource } from 'solid-js';
import { Button } from '../_common/Elements/Elements.js';
import { getSets } from '../../services/db/settings.js';
import { WORKOUT_MODE_CONFIGS } from '../../services/workout/modes.js';

export function Activity(props: { startWorkout: () => void }) {
  const [sets] = createResource(() => {
    return getSets("MICHAEL");
  });
  return (
    <div class="flex flex-col p-4 h-full">
      <div class="grow text-sm overflow-y-auto">
        <For each={sets()}>{(set) => (
          <div class="m-2 p-4 bg-gray-800 rounded-sm relative">
            <time class="text-xs absolute right-4 text-gray-400">{(new Date(set.time)).toLocaleString()}</time>
            <div class="font-medium">{set.exercise_id}</div>
            <div>
              <span>{set.stats.reps} x {(set.stats.maxMinForce * 2.2).toFixed(1)}lbs</span>
              <span class="text-gray-400"> ({WORKOUT_MODE_CONFIGS[set.mode].name})</span>
            </div>
          </div>
        )}</For>
      </div>
      <Button onClick={props.startWorkout}>Start Workout</Button>      
    </div>
  );
}