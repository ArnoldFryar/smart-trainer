import { useParams } from "@solidjs/router";
import { getSet, getSetSamples } from "../../services/db/settings";
import { For, Match, Switch, createResource, createSignal, onMount } from "solid-js";
import { Phase, getSetMetrics } from "../../services/workout/util";
import { Line, Bar } from 'solid-chartjs'
import { Chart, Tooltip, Legend, Colors } from 'chart.js'
import { userHue } from "../../services/user/colors";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  interaction: {
    mode: 'index'
  },
  plugins: {
    legend: {
      position: 'bottom',
    },
  }
}

export default function AnalyzeSet() {
  const params = useParams();
  const [currentTab, setCurrentTab] = createSignal("Weight");
  const [set] = createResource(() => {
    return getSet(params.setId);
  });
  const [samples] = createResource(async () => {
    return getSetSamples(params.setId);
  });
  const metrics = () => getSetMetrics(samples() || [], set()?.range || { top:0, bottom:0 });

  onMount(() => {
    Chart.register(Tooltip, Legend, Colors)
  })

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
        <Tabs tabs={["ROM", "Weight", "Velocity", "Power"]} selected={currentTab()} onChange={setCurrentTab} />
        <Switch>
          <Match when={currentTab() === "ROM"}>
            <Line 
            data={{
              labels: samples()?.map(() => ""),
              datasets: [
                {
                  label: 'Left',
                  data: samples()?.map((sample) => sample.left.position),
                  borderColor: `hsl(${userHue}, 80%, 40%)`,
                  backgroundColor: `hsl(${userHue}, 80%, 40%)`,
                  borderWidth: 2,
                  cubicInterpolationMode: 'monotone',
                  pointStyle: false,
                  yAxisID: 'y',
                },
                {
                  label: 'Right',
                  data: samples()?.map((sample) => sample.right.position),
                  borderColor: `hsl(${userHue}, 70%, 70%)`,
                  backgroundColor: `hsl(${userHue}, 70%, 70%)`,
                  borderWidth: 2,
                  cubicInterpolationMode: 'monotone',
                  pointStyle: false,
                  yAxisID: 'y',
                },
              ],
            }} 
            options={chartOptions} 
            width={500} 
            height={250} />
          </Match>
          <Match when={currentTab() === "Weight"}>
            <Bar data={getDatasets(metrics(), sample => sample.force.min * 2.2)} options={chartOptions} width={500} height={250} />
          </Match>
          <Match when={currentTab() === "Velocity"}>
            <Bar data={getDatasets(metrics(), sample => sample.velocity.mean)} options={chartOptions} width={500} height={250} />
          </Match>
          <Match when={currentTab() === "Power"}>
            <Bar data={getDatasets(metrics(), sample => sample.velocity.mean * sample.force.mean)} options={chartOptions} width={500} height={250} />
          </Match>
        </Switch>
        <pre>{JSON.stringify({ 
          ...metrics(), 
          concentric: { ...metrics().concentric, samples: undefined }, 
          eccentric: { ...metrics().eccentric, samples: undefined }
        }, null, 2)}</pre>
      </div>
    </div>
  );
}

function getDatasets(metrics: ReturnType<typeof getSetMetrics>, fn: (sample: Phase) => number) {
  return {
    labels: metrics.concentric.samples.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Combined',
        data: metrics.concentric.samples.map(fn),
        borderColor: `hsl(${userHue}, 80%, 40%)`,
        backgroundColor: `hsl(${userHue}, 80%, 40%)`,
        borderWidth: 2,
        cubicInterpolationMode: 'monotone',
        pointStyle: false,
        yAxisID: 'y',
      }
    ],
  }
}

function Tabs(props) {
  return <ul class="flex flex-wrap text-sm font-medium text-center text-gray-400">
    <For each={props.tabs}>{(tab: string) => (
      <li class="mr-2">
          <a onClick={() => props.onChange(tab)} class={`cursor-pointer inline-block px-4 py-3 rounded border ${props.selected === tab ? "text-white bg-primary-900 active border-primary-500" : "bg-gray-700 border-gray-700 hover:bg-gray-800 hover:text-white"}`}>{tab}</a>
      </li>
    )}</For>
  </ul>
}

function toLbs(kg) {
  return (kg * 2.2).toFixed(1);
}

function toSeconds(ms) {
  return (ms / 1000).toFixed(1);
}