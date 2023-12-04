import { useParams } from "@solidjs/router";
import { getSet, getSetSamples } from "../../services/db/settings";
import { For, Match, Switch, createResource, createSignal, onMount } from "solid-js";
import { Phase, getSetMetrics } from "../../services/workout/util";
import { Line, Bar } from 'solid-chartjs'
import { Chart, Tooltip, Legend, Colors } from 'chart.js'
import { userHue } from "../../services/user/colors";
import { WORKOUT_MODE_CONFIGS } from "../../services/workout/modes";

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
      <div class="mb-4">
        <div class="text-xl font-medium">{set()?.exercise_id}</div>
        <span class="text-gray-200">{(new Date(set()?.time)).toDateString()} <span class="text-gray-400">{(new Date(set()?.time)).toLocaleTimeString()}</span></span>
      </div>
      <div class="flex justify-between mb-4">
        <Metric name="Mode">
          {WORKOUT_MODE_CONFIGS[set()?.mode]?.name}
        </Metric>
        <Metric name="Best Effort">
          {metrics().repMaxes.best} <span class="text-gray-300">x</span> {toLbs(metrics().repMaxes[metrics().repMaxes.best])}<span class="text-gray-300">lbs</span>
        </Metric>
        <Metric name="e1RM">
          {toLbs(metrics().e1rm)}<span class="text-gray-300">lbs</span>
        </Metric>
        <Metric name="Total Reps">
          {metrics().concentric.samples.length}
        </Metric>
        <Metric name="Duration">
          {toSeconds(samples()?.[samples()?.length - 1].time - samples()?.[0].time)}<span class="text-gray-300">s</span>
        </Metric>
      </div>
      <div class="flex-grow bg-gray-800 p-4 rounded mb-4">
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
            height={400} />
            <div class="grid grid-cols-3 mt-4">
              <Metric name="Max ROM">
                {toIn(metrics().rom.maxDistance)}<span class="text-gray-300">in</span>
              </Metric>
              <Metric name="Min ROM">
                {toIn(metrics().rom.minDistance)}<span class="text-gray-300">in</span>
              </Metric>
              <Metric name="Avg ROM">
                {toIn(metrics().rom.meanDistance)}<span class="text-gray-300">in</span>
              </Metric>
            </div>
          </Match>
          <Match when={currentTab() === "Weight"}>
            <Bar data={getDatasets(metrics(), sample => sample.force.min * 2.2)} options={chartOptions} width={500} height={400} />
            <div class="grid grid-cols-4 mt-4">
              <Metric name="Max Rep Weight">
                {toLbs(metrics().concentric.maxMinForce)}<span class="text-gray-300">lbs</span>
              </Metric>
              <Metric name="Min Rep Weight">
                {toLbs(metrics().concentric.minForce)}<span class="text-gray-300">lbs</span>
              </Metric>
              <Metric name="Avg Weight">
                {toLbs(metrics().concentric.meanForce)}<span class="text-gray-300">lbs</span>
              </Metric>
              <Metric name="Peak Weight">
                {toLbs(metrics().concentric.maxForce)}<span class="text-gray-300">lbs</span>
              </Metric>
            </div>
          </Match>
          <Match when={currentTab() === "Velocity"}>
            <Bar data={getDatasets(metrics(), sample => sample.velocity.mean)} options={chartOptions} width={500} height={400} />
            <div class="grid grid-cols-4 mt-4">
              <Metric name="Avg Velocity">
                {toMeters(metrics().concentric.meanVelocity)}<span class="text-gray-300">m/s</span>
              </Metric>
              <Metric name="Peak Velocity">
                {toMeters(metrics().concentric.maxVelocity)}<span class="text-gray-300">m/s</span>
              </Metric>
              <Metric name="Velocity Loss">
                {toMeters(metrics().concentric.velocityLoss)}<span class="text-gray-300">m/s</span>
              </Metric>
            </div>
          </Match>
          <Match when={currentTab() === "Power"}>
            <Bar data={getDatasets(metrics(), sample => sample.velocity.mean / 1000 * sample.force.mean * 9.81)} options={chartOptions} width={500} height={400} />
            <div class="grid grid-cols-4 mt-4">
              <Metric name="Avg Power">
                {metrics().concentric.meanPower?.toFixed(1)}<span class="text-gray-300">W</span>
              </Metric>
              <Metric name="Peak Power">
                {metrics().concentric.maxPower?.toFixed(1)}<span class="text-gray-300">W</span>
              </Metric>
              <Metric name="Total Work">
                {toKJ(metrics().concentric.work)}<span class="text-gray-300">kJ</span>
              </Metric>
            </div>
          </Match>
        </Switch>
      </div>

      <details>
        <summary class="mb-4">Raw Metrics</summary>
        <pre class="text-xs">{JSON.stringify({ 
          ...metrics(), 
          concentric: { ...metrics().concentric, samples: undefined }, 
          eccentric: { ...metrics().eccentric, samples: undefined }
        }, null, 2)}</pre>
      </details>
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
  return <ul class="flex text-sm font-medium text-center text-gray-400 content-stretch mb-4">
    <For each={props.tabs}>{(tab: string) => (
      <li class="flex flex-1 mx-1">
          <a onClick={() => props.onChange(tab)} class={`cursor-pointer flex-1 gap-1 px-4 py-3 rounded border ${props.selected === tab ? "text-white bg-primary-900 active border-primary-500" : "bg-gray-700 border-gray-700 hover:bg-gray-800 hover:text-white"}`}>{tab}</a>
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

function toIn(cm) {
  return (cm / 2.54).toFixed(1);
}

function toMeters(mm) {
  return (mm / 1000).toFixed(2);
}

function toKJ(j) {
  return (j / 1000).toFixed(1);
}