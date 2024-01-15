import { For } from 'solid-js';
import { A } from '@solidjs/router';
import { groupSetsByDate } from '../../../services/workout/util';

export default function SetHistory(props) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  return (
    <For each={Object.entries(groupSetsByDate(props.sets))}>{([date, sets]) => (
      <>
        <div class="inline-flex items-center justify-center w-full relative">
            <hr class="w-64 h-px my-8 border-0 bg-gray-700"/>
            <span class="absolute px-3 font-medium -translate-x-1/2 left-1/2 text-white bg-gray-900">
              {date === today ? "Today" : date === yesterday ? "Yesterday" : date}
            </span>
        </div>
        <For each={sets}>{(set) => (
          <A href={`/set/${set._id}`} class="block m-2 p-4 bg-gray-800 rounded relative">
            <span class="text-sm absolute right-4">{set.bestEffort?.reps} <span class="text-gray-300">x</span> {toLbs(set.bestEffort?.weight)}<span class="text-gray-300">lbs</span></span>
            <div class="font-medium">{set.exercise_id}</div>
          </A>
        )}</For>
      </>
    )}</For>
  );
}

function toLbs(kg) {
  return (kg * 2.2).toFixed(1);
}