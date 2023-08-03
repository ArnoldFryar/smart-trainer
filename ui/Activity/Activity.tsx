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
  const groups = () => Object.entries((sets()??[]).reduce((groups, set) => {
    const date = new Date(set.time).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(set);
    return groups;
  }, {}));
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  return (
    <div class="flex flex-col p-4 h-full">
      <div class="grow text-sm overflow-y-auto">
        <For each={groups()}>{([date, sets]) => (
          <>
            <div class="inline-flex items-center justify-center w-full relative">
                <hr class="w-64 h-px my-8 border-0 bg-gray-700"/>
                <span class="absolute px-3 font-medium -translate-x-1/2 left-1/2 text-white bg-gray-900">
                  {date === today ? "Today" : date === yesterday ? "Yesterday" : date}
                </span>
            </div>
            <For each={sets}>{(set) => (
              <A href={`/set/${set._id}`} class="block m-2 p-4 bg-gray-800 rounded-sm relative">
                <time class="text-xs absolute right-4 text-gray-400">{(new Date(set.time)).toLocaleTimeString()}</time>
                <div class="font-medium">{set.exercise_id}</div>
                <div>
                  <span>{set.stats.reps} x {toLbs(set.stats.maxMinForce)}lbs</span>
                  <span class="text-gray-400"> ({WORKOUT_MODE_CONFIGS[set.mode].name})</span>
                </div>
              </A>
            )}</For>
          </>
        )}</For>
      </div>
      <Button onClick={() => navigate("/workout")}>Start Workout</Button>      
    </div>
  );
}

function toLbs(kg) {
  return (kg * 2.2).toFixed(1);
}