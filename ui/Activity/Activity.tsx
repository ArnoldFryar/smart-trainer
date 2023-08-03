import { For, createResource } from 'solid-js';
import { Button } from '../_common/Elements/Elements.js';
import { getSets } from '../../services/db/settings.js';
import { A, useNavigate } from '@solidjs/router';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Activity() {
  const navigate = useNavigate();
  const [sets] = createResource(() => {
    return getSets("MICHAEL");
  });
  const groups = () => (sets()??[]).reduce((groups, set) => {
    const date = new Date(set.time).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(set);
    return groups;
  }, {});
  const pastWeek = () => {
    const today = new Date();
    const pastWeek = [];
    const setsByDate = groups();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      pastWeek.push({
        label: i === 0 ? "Today" : DAYS[date.getDay()],
        setCount: setsByDate[date.toDateString()]?.length ?? 0,
      });
    }
    return pastWeek.reverse();
  }
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  return (
    <div class="flex flex-col p-4 h-full">
      <div class="grow text-sm overflow-y-auto">
        <div class="flex justify-between content-between">
          <For each={pastWeek()}>
            {({ label, setCount }) => (
              <div>
                <div class={`flex items-center justify-center rounded-full w-12 h-12 relative text-lg ${setCount ? "bg-primary-800 text-white" : "bg-gray-800 text-gray-400"}`}>
                  <span class={`absolute px-3 font-medium -translate-x-1/2 left-1/2`}>
                    {setCount}
                  </span>
                </div>
                <div class="w-12 text-center text-xs mt-2">
                  {label}
                </div>
              </div>
            )}
          </For>
        </div>
        <For each={Object.entries(groups())}>{([date, sets]) => (
          <>
            <div class="inline-flex items-center justify-center w-full relative">
                <hr class="w-64 h-px my-8 border-0 bg-gray-700"/>
                <span class="absolute px-3 font-medium -translate-x-1/2 left-1/2 text-white bg-gray-900">
                  {date === today ? "Today" : date === yesterday ? "Yesterday" : date}
                </span>
            </div>
            <For each={sets}>{(set) => (
              <A href={`/set/${set._id}`} class="block m-2 p-4 bg-gray-800 rounded relative">
                <span class="text-sm absolute right-4">{set.stats.reps} <span class="text-gray-300">x</span> {toLbs(set.stats.maxMinForce)}<span class="text-gray-300">lbs</span></span>
                <div class="font-medium">{set.exercise_id}</div>
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