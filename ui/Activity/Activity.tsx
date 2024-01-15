import { For, createResource } from 'solid-js';
import { Button } from '../_common/Elements/Elements.js';
import { getSets } from '../../services/db/settings.js';
import { A, useNavigate } from '@solidjs/router';
import SetHistory from './SetHistory/SetHistory.jsx';
import { groupSetsByDate } from '../../services/workout/util.js';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Activity() {
  const navigate = useNavigate();
  const [sets] = createResource(() => {
    return getSets("MICHAEL");
  });
  const pastWeek = () => {
    const today = new Date();
    const pastWeek = [];
    const setsByDate = groupSetsByDate(sets());
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      pastWeek.push({
        label: i === 0 ? "Today" : DAYS[date.getDay()],
        setCount: setsByDate[date.toDateString()]?.length ?? 0,
      });
    }
    return pastWeek.reverse();
  }
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
        <SetHistory sets={sets()}/>
      </div>
      <Button onClick={() => navigate("/workout")}>Start Workout</Button>      
    </div>
  );
}