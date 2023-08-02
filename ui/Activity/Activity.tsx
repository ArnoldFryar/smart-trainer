import { For, createResource } from 'solid-js';
import { Button } from '../_common/Elements/Elements.js';
import { getSets } from '../../services/db/settings.js';
import { WORKOUT_MODE_CONFIGS } from '../../services/workout/modes.js';
import { A, useNavigate } from '@solidjs/router';

export default function Activity() {
  const navigate = useNavigate();
  const [sets] = createResource(() => {
    return getSets("MICHAEL");
  });
  return (
    <div class="flex flex-col p-4 h-full">
      <div class="grow text-sm overflow-y-auto">
        <For each={sets()}>{(set) => (
          <A href={`/set/${set._id}`} class="block m-2 p-4 bg-gray-800 rounded-sm relative">
            <time class="text-xs absolute right-4 text-gray-400">{(new Date(set.time)).toLocaleString()}</time>
            <div class="font-medium">{set.exercise_id}</div>
            <div>
              <span>{set.stats.reps} x {toLbs(set.stats.maxMinForce)}lbs</span>
              <span class="text-gray-400"> ({WORKOUT_MODE_CONFIGS[set.mode].name})</span>
            </div>
          </A>
        )}</For>
      </div>
      <Button onClick={() => navigate("/workout")}>Start Workout</Button>      
    </div>
  );
}

function toLbs(kg) {
  return (kg * 2.2).toFixed(1);
}