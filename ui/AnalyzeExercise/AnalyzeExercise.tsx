import { A, useParams } from "@solidjs/router";
import { createResource, For } from "solid-js";
import { getAllRepMaxes, getEstimated1RepMax, getSetsForExercise } from "../../services/db/settings";
import SetHistory from "../Activity/SetHistory/SetHistory";

export default function AnalyzeSet() {
  const params = useParams();
  const exercise_id = () => params.exerciseId;
  const [sets] = createResource(() => getSetsForExercise("MICHAEL", exercise_id()));
  const [e1rmSet] = createResource(() => getEstimated1RepMax("MICHAEL", exercise_id()));
  const [repMaxSets] = createResource(() => getAllRepMaxes("MICHAEL", exercise_id()));

  return (
    <div class="flex flex-col p-4 h-full">
      <div class="mb-4">
        <div class="text-xl font-medium">{exercise_id()}</div>
      </div>
      <div class="flex justify-between mb-4">
        <Metric name="e1RM">
          <A href={`/set/${e1rmSet()?._id}`}>{toLbs(e1rmSet()?.e1rm)}<span class="text-gray-300">lbs</span></A>
        </Metric>
        <For each={repMaxSets()?.filter(Boolean)}>
          {(set) => {
            return (
              <Metric name={`${set?.bestEffort.reps}RM`}>
                <A href={`/set/${set?._id}`}>{toLbs(set?.bestEffort.weight)}<span class="text-gray-300">lbs</span></A>
              </Metric>
            )
          }}
        </For>
      </div>
      <SetHistory sets={sets()}/>
    </div>
  );
}

function Metric(props) {
  return (
    <div>
      <span class="text-xs block text-gray-400">{props.name}</span>
      <span>{props.children}</span>
    </div>
  )
}

function toLbs(kg) {
  return (kg * 2.2).toFixed(1);
}