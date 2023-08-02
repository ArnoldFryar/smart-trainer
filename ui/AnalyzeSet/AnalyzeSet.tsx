import { useParams } from "@solidjs/router";
import { getSet, getSetSamples } from "../../services/db/settings";
import { createResource } from "solid-js";
import { getSetMetrics } from "../../services/workout/util";

export default function AnalyzeSet() {
  const params = useParams();
  const [set] = createResource(() => {
    return getSet(params.setId);
  });
  const [samples] = createResource(async () => {
    return getSetSamples(params.setId);
  });
  const metrics = () => getSetMetrics(samples() || [], set()?.range || { top:0, bottom:0 });
  return (
    <div class="flex flex-col p-4 h-full">
      <div class="text-lg font-bold mb-4">{set()?.exercise_id} {(new Date(set()?.time)).toLocaleString()}</div>
      <div class="flex justify-between">
        <div class="mb-4"><span class="text-xs block text-gray-300">Best Effort:</span> {metrics().repMaxes.best} x {toLbs(metrics().repMaxes[metrics().repMaxes.best])}lbs</div>
        <div class="mb-4"><span class="text-xs block text-gray-300">E1RM:</span> {toLbs(metrics().repMaxes.e1rm)}lbs</div>
        <div class="mb-4"><span class="text-xs block text-gray-300">Heaviest Rep:</span> {toLbs(metrics().concentric.maxMinForce)}lbs</div>
        <div class="mb-4"><span class="text-xs block text-gray-300">Reps:</span> {metrics().concentric.samples.length}</div>
        <div class="mb-4"><span class="text-xs block text-gray-300">Time:</span> {toSeconds(samples()?.[samples()?.length - 1].time - samples()?.[0].time)}s</div>
      </div>
      <div class="flex-grow bg-gray-800 p-4 rounded text-xs">
        <pre>{JSON.stringify({ 
          ...metrics(), 
          concentric: { ...metrics().concentric, samples: undefined }, 
          eccentric: { ...metrics().eccentric, samples: undefined }
        }, null, 2)}</pre>
      </div>
    </div>
  );
}

function toLbs(kg) {
  return (kg * 2.2).toFixed(1);
}

function toSeconds(ms) {
  return (ms / 1000).toFixed(1);
}