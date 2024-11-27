import { Show, For } from "solid-js";
import {
  Weight,
  RangeOfMotion,
} from "../WeightAndRangeOfMotion/WeightAndRangeOfMotion.js";
import { Button, AutoButton } from "../../_common/Elements/Elements.js";
import { createWorkoutService } from "../../../services/workout/hook.js";
import {
  createWorkoutIterator,
  SetConfig,
  WorkoutConfig,
} from "../../../services/workout/index.js";
import { getSetMetrics } from "../../../services/workout/util.js";
import { wakeLock } from "../../../services/util/wake-lock.js";
import { Timer } from "../../_common/Timer/Timer.jsx";
import { WorkoutSet } from "../../../services/db/settings.js";

export namespace WorkoutActive {
  export interface Props {
    config: WorkoutConfig;
    onComplete: () => void;
  }
}

export function WorkoutActive(props: WorkoutActive.Props) {
  const [sets, save] = createWorkoutIterator(props.config);
  const [workoutState, actions] = createWorkoutService(sets, save);

  const leftWeight = () => Trainer.sample().left.force;
  const rightWeight = () => Trainer.sample().right.force;

  const leftROM = () => Trainer.rangeOfMotion().left;
  const rightROM = () => Trainer.rangeOfMotion().right;

  const currentRep = () =>
    workoutState.state === "calibrating"
      ? -workoutState.calibrationRepsRemaining
      : workoutState.repCount;
  const meanVelocityPerRep = () => workoutState.currentSetPhases.filter(p => p.phase === "concentric").map(p => p.velocity.mean);

  wakeLock();

  return (
    <Show when={workoutState.currentSet}>
      <WorkoutActiveView
        state={workoutState.state}
        set={workoutState.currentSet}
        onComplete={props.onComplete}
        prevSet={workoutState.prevSet}
        actions={{ ...actions, complete: props.onComplete }}
        totalSets={sets.length}
        currentSetIndex={workoutState.currentSetIndex}
        video=""
        unit={"lbs" /* TODO: get from user preferences */}
        leftWeight={leftWeight()}
        rightWeight={rightWeight()}
        targetWeight={0}
        currentRep={currentRep()}
        calibrationRepsRemaining={workoutState.calibrationRepsRemaining}
        leftROM={leftROM()}
        rightROM={rightROM()}
        meanVelocityPerRep={meanVelocityPerRep()}
        setMetrics={workoutState.currentSetMetrics}
      />
    </Show>
  );
}

export namespace WorkoutActiveView {
  export interface Props {
    state: "calibrating" | "rest" | "workout" | "paused" | "complete";
    set: SetConfig;
    prevSet?: WorkoutSet;
    actions: {
      next: () => void;
      prev: () => void;
      pause: () => void;
      resume: () => void;
      complete: () => void;
    };
    totalSets: number;
    currentSetIndex: number;
    onComplete: () => void;
    video: string;
    unit: "lbs" | "kg";
    leftWeight: number;
    rightWeight: number;
    targetWeight: number;
    leftROM: number;
    rightROM: number;
    currentRep: number;
    calibrationRepsRemaining: number;
    meanVelocityPerRep: number[];
    setMetrics: ReturnType<typeof getSetMetrics>;
  }
}

export function WorkoutActiveView(props: WorkoutActiveView.Props) {
  const active = () =>
    props.state === "calibrating" ||
    props.state === "workout" ||
    props.state === "paused";

  const singleCable = () => props.set.exercise.type === "SINGLE_CABLE" || props.set.exercise.type === "ALTERNATE";
  const activeSide = () => props.leftROM > props.rightROM ? "LEFT" : "RIGHT";
  const leftActive = () => !singleCable() || activeSide() === "LEFT";
  const rightActive = () => !singleCable() || activeSide() === "RIGHT";

  return (
    <>
      <Show when={props.state === "rest"}>
        <SetSummary set={props.set} next={props.actions.next} setMetrics={props.setMetrics} />
      </Show>
      <Show when={props.state === "complete"}>
        <div class="flex flex-col p-4 h-full">
          <div class="text-gray-400 uppercase text-center flex-none">Workout Complete</div>
          <pre class="grow text-sm overflow-y-auto">
            {JSON.stringify(props.setMetrics ?? {}, null, 2)}
            <div>TODO: Total Joules*, Total Time, Heaviest Weight, #PRs, #Sets</div>
          </pre>
          <Button onClick={props.onComplete} class="flex-none">Finish Workout</Button>          
        </div>
      </Show>
      <Show when={active()}>
        <WorkoutActiveContainer
          unit={props.unit}
          exercise={props.set.exercise.id}
          side={props.set.side}
          video=""
          leftWeight={leftActive() ? props.leftWeight : 0}
          rightWeight={rightActive() ? props.rightWeight : 0}
          targetWeight={props.set.modeConfig.weight}
          currentRep={props.currentRep}
          leftROM={leftActive() ? props.leftROM : null}
          rightROM={rightActive() ? props.rightROM : null}
          currentSetIndex={props.currentSetIndex}
          totalSets={props.totalSets}
        >
          <Show when={props.state === "calibrating"}>
            <div>Calibrating...</div>
            <div class="flex w-full">
              <div class="flex-1 text-center py-2">
                <div class="text-xl font-light">{props.calibrationRepsRemaining}</div>
                <div class="text-xs text-gray-300">ROM Reps</div>
              </div>
              <div class="flex-1 text-center py-2">
                <div class="text-xl font-light"><Timer since={props.prevSet?.time} /></div>
                <div class="text-xs text-gray-300">Rest</div>
              </div>
            </div>
            <div class="flex w-full mt-4">
              <Button onClick={props.actions?.prev} class={`flex-1 ${props.currentSetIndex === 0 ? "opacity-50" : ""}`} disabled={props.currentSetIndex === 0}>Back</Button>
              <Button onClick={props.actions?.next} class={`flex-1 ${props.currentSetIndex === props.totalSets - 1 ? "opacity-50" : ""}`}  disabled={props.currentSetIndex === props.totalSets - 1}>Skip</Button>
            </div>
          </Show>
          <Show when={props.state === "workout"}>
            <Reps
              targetVelocity={props.set.modeConfig.spotterVelocity}
              meanVelocityPerRep={props.meanVelocityPerRep}
              currentRep={props.currentRep}
              totalReps={props.set.limitConfig.reps}
              />
            <div class="flex w-full mt-4">
              <Button onClick={props.actions?.reset} class="flex-1">Reset</Button>
            </div>
            {/* <Show when={props.set.limit === "ASSESSMENT" || props.set.limit === "SPOTTER"}>
              <Reps
                targetVelocity={props.targetVelocity}
                stopVelocity={props.targetVelocity}
                meanVelocityPerRep={props.meanVelocityPerRep}
                currentRep={props.currentRep}
                totalReps={props.totalReps}
              />
            </Show>
            <Show when={props.set.limit === "VELOCITY_LOSS"}>
              {() => {
                const stopVelocity = () =>
                  Math.max(...props.meanVelocityPerRep) *
                  (props.set.limitConfig as any).velocityThreshold;
                return (
                  <Reps
                    targetVelocity={props.targetVelocity}
                    stopVelocity={stopVelocity()}
                    meanVelocityPerRep={props.meanVelocityPerRep}
                    currentRep={props.currentRep}
                    totalReps={props.totalReps}
                  />
                );
              }}
            </Show> */}
          </Show>
          <Show when={props.state === "paused"}>
            <div>Paused</div>
            <button onClick={props.actions.resume}>Resume</button>
          </Show>
        </WorkoutActiveContainer>
      </Show>
    </>
  );
}

export namespace SetSummary {
  export interface Props {
    set: SetConfig;
    next: () => void;
    setMetrics: ReturnType<typeof getSetMetrics>;
  }
}

export function SetSummary(props: SetSummary.Props) {
  return (
    <div class="flex flex-col p-4 h-full">
      <div class="text-gray-400 uppercase text-center flex-none">Set Complete</div>
      {/* Best Effort () */}
      {/* + Rep PRs () */}
      {/* Total Reps */}
      {/* Avg Weight */}
      {/* Heaviest Rep () */}
      {/* e1rm () */}
      {/* Total Joules () */}
      {/* Total Time */}
      {/* Gold: #ffcc00, Silver: #aabbcc, Bronze: #dd9966 */}
      <pre class="grow text-sm overflow-y-auto">
        {JSON.stringify(props.setMetrics ?? {}, null, 2)}
      </pre>
      <AutoButton timeout={props.set.rest ?? 10000} onClick={props.next} class="flex-none">Next Set</AutoButton>          
    </div>
  );
}

export namespace WorkoutActiveContainer {
  export interface Props {
    exercise: string;
    side: "LEFT" | "RIGHT" | null;
    video: string;
    unit: "lbs" | "kg";
    leftWeight: number;
    rightWeight: number;
    targetWeight: number;
    leftROM: number;
    rightROM: number;
    currentRep: number;
    children: any;
    currentSetIndex: number;
    totalSets: number;
  }
}

export function WorkoutActiveContainer(props: WorkoutActiveContainer.Props) {
  return (
    <div
      class="flex flex-col justify-between items-center p-12"
      style="height:100vh"
    >
      <div class="text-center">
        <div class="text-4xl font-light text-gray-200">{props.exercise}{props.side ? ` (${props.side})` : ""}</div>
        <div>{props.currentSetIndex + 1}/{props.totalSets}</div>
      </div>
      <div
        class="relative w-96 h-96 flex justify-center items-center"
        style="margin-bottom:-2rem"
      >
        <Weight
            weight={props.currentRep < 0 ? props.targetWeight * 2 : props.leftWeight + props.rightWeight}
            targetWeight={props.targetWeight * 2}
            unit={props.unit}
          />
        <RangeOfMotion
          class="absolute w-96 h-96"
          leftROM={props.leftROM}
          rightROM={props.rightROM}
        />
      </div>
      <div class="flex flex-col justify-center items-center w-full">
        {props.children}
      </div>
    </div>
  );
}

namespace Reps {
  export interface Props {
    targetVelocity: number;
    meanVelocityPerRep: number[];
    currentRep: number;
    totalReps: number;
  }
}

// const CURVE_THRESHOLD = 0.2;

export function Reps(props: Reps.Props) {
  // const softMax = props.targetVelocity + props.stopVelocity;
  // const k =
  //   Math.log(1 / CURVE_THRESHOLD - 1) /
  //   ((props.stopVelocity / softMax) * 2 - 1);
  const sCurve = (x: number) => x; // 1 / (1 + Math.exp(k * ((x / softMax) * 2 - 1)));
  const maxValue = () =>
    sCurve(Math.max(props.targetVelocity, ...props.meanVelocityPerRep));
  const getValue = (x: number) => (sCurve(x) / maxValue()) * 100;

  return (
    <>
      <div
        class="flex flex-row items-end justify-center items-end w-full relative"
        style="height:100px;"
      >
        <Show when={props.currentRep >= 0}>
          <For each={props.meanVelocityPerRep}>
            {(velocity: number, index) => (
              <>
                <div
                  class={`z-10 flex-initial w-12 bg-primary-400 rounded-sm -skew-x-6 bg-gradient-to-b from-primary-400 to-primary-500 shadow-lg shadow-primary-900/50 ${
                    index() > props.currentRep ? "opacity-25" : ""
                  }`}
                  style={`height: ${getValue(velocity)}%`}
                />
                <div class={`z-10 flex-initial w-6`} />
              </>
            )}
          </For>
        </Show>
        <div
          class={`absolute z-20 m-1 flex-1 border-t border-white/30`}
          style={`height: ${getValue(props.targetVelocity)}%; width:100%;`}
        />
        {/* <div
          class={`absolute z-20 m-1 flex-1 border-t border-white/60`}
          style={`height: ${getValue(props.stopVelocity)}%; width:100%;`}
        />
        <div
          class={`absolute z-0 m-1 flex-1 border-t border-white`}
          style={`height: ${getValue(props.stopVelocity)}%; width:100%;`}
        /> */}
      </div>
      <div class="text-right mt-8">
        <div class="">
          <span class="text-gray-100 text-7xl">{props.currentRep}</span>
          <span class="text-gray-400 text-5xl">/{props.totalReps || "?"}</span>
        </div>
        <span class="text-sm font-bold tracking-wider text-gray-500 mx-1">
          REPS
        </span>
      </div>
    </>
  );
}

function StopButton() {
  return (
    <Button class="my-2 mx-1" onClick={() => Trainer.stop()}>
      Stop
    </Button>
  );
}

function InfoButton() {
  return (
    <Button class="my-2 mx-1" onClick={() => {}}>
      Info
    </Button>
  );
}