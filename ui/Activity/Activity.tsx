import { For, createResource } from 'solid-js';
import { Button } from '../_common/Elements/Elements.js';
import { getSets, getSetSamples } from '../../services/db/settings.js';
import { useNavigate } from '@solidjs/router';
import SetHistory from './SetHistory/SetHistory.jsx';
import { getWeekKey, groupSetsByDate, groupSetsByWeek } from '../../services/workout/util.js';
import { StreakAndMileStones } from './StreakAndMileStones/StreakAndMileStones.jsx';

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
  const weekStreak = () => {
    let time = Date.now();
    let weeks = 0;
    const setsByWeek = groupSetsByWeek(sets());
    while (true) {
      if (!setsByWeek[getWeekKey(time)]) {
        // we don't count the current week against you if you haven't worked out yet
        if (getWeekKey(time) !== getWeekKey(Date.now())) break;
      } else {
        weeks++;
      }
      time -= 1000 * 60 * 60 * 24 * 7;
    }
    return weeks;
  }
  const kgsLifted = () => sets()?.reduce((total, set) => total + ((set.bestEffort.reps*set.bestEffort.weight) || 0), 0);
  const activeDays = () => Object.keys(groupSetsByDate(sets())).length;
  const lastSetTime = () => sets()?.[0]?.time;
  return (
    <div class="flex flex-col p-4 h-full">
      <div class="grow text-sm overflow-y-auto">
        <StreakAndMileStones weeks={weekStreak()} weight={kgsLifted()*2.2} days={activeDays()} since={lastSetTime()}/>
        <div class="inline-flex items-center justify-center w-full relative">
            <hr class="w-64 h-px my-8 border-0 bg-gray-700"/>
            <span class="absolute px-3 font-medium -translate-x-1/2 left-1/2 text-white bg-gray-900">
              Last 7 days
            </span>
        </div>
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