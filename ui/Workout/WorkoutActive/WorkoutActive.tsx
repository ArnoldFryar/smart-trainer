import { Show, For } from "solid-js";
import {
  Weight,
  RangeOfMotion,
} from "../WeightAndRangeOfMotion/WeightAndRangeOfMotion.js";
import { ExerciseDemonstration } from "../ExerciseDemonstration/ExerciseDemonstration.js";
import { Button } from "../../_common/Elements/Elements.js";
import { createWorkoutService } from "../../../services/workout/hook.js";
import { createWorkoutIterator } from "../../../services/workout/index.js";
import { calculateMeanVelocity } from "../../../services/workout/util.js";

export namespace WorkoutActive {
  export interface Props {
    config: {
      exercises: { main: string[]; accessory: string[] };
      length: "full" | "short" | "mini";
    };
    onComplete: () => void;
  }
}

export function WorkoutActive(props: WorkoutActive.Props) {
  const targetVelocity = 600;
  const stopVelocity = targetVelocity*0.75;
  const [sets, save] = createWorkoutIterator({
    ...props.config,
    targetVelocity,
    stopVelocity,
  });
  const [workoutState, actions] = createWorkoutService(sets, save);

  const exercise = () => workoutState.currentSet.exercise;

  const leftWeight = () => {
    const { left } = Trainer.sample();
    return left.position <= 0.5 && left.velocity === 0 ? 0 : left.force;
  };

  const rightWeight = () => {
    const { right } = Trainer.sample();
    return right.position <= 0.5 && right.velocity === 0 ? 0 : right.force;
  };

  const leftROM = () => Trainer.rangeOfMotion().left;
  const rightROM = () => Trainer.rangeOfMotion().right;

  const currentRep = () =>
    workoutState.state === "calibrating"
      ? -workoutState.calibrationRepsRemaining
      : workoutState.repCount;
  const meanVelocityPerRep = () => workoutState.repSamples.map(({ concentric }) => calculateMeanVelocity(concentric));

  return (
    <WorkoutActiveView
      state={workoutState.state}
      onComplete={props.onComplete}
      exercise={exercise()}
      actions={{ ...actions, complete: props.onComplete }}
      video=""
      unit={"lbs" /* TODO: get from user preferences */}
      leftWeight={leftWeight()}
      rightWeight={rightWeight()}
      targetWeight={100}
      currentRep={currentRep()}
      calibrationRepsRemaining={workoutState.calibrationRepsRemaining}
      leftROM={leftROM()}
      rightROM={rightROM()}
      targetVelocity={targetVelocity}
      stopVelocity={stopVelocity}
      meanVelocityPerRep={meanVelocityPerRep()}
      totalReps={10}
    />
  );
}

export namespace WorkoutActiveView {
  export interface Props {
    state: "calibrating" | "rest" | "workout" | "paused" | "complete";
    actions: {
      next: () => void;
      prev: () => void;
      pause: () => void;
      resume: () => void;
      complete: () => void;
    };
    onComplete: () => void;
    exercise: string;
    video: string;
    unit: "lbs" | "kg";
    leftWeight: number;
    rightWeight: number;
    targetWeight: number;
    leftROM: number;
    rightROM: number;
    currentRep: number;
    calibrationRepsRemaining: number;
    targetVelocity: number;
    stopVelocity: number;
    meanVelocityPerRep: number[];
    totalReps: number;
  }
}

export function WorkoutActiveView(props: WorkoutActiveView.Props) {
  const active = () =>
    props.state === "calibrating" ||
    props.state === "workout" ||
    props.state === "paused";

  return (
    <>
      <Show when={props.state === "rest"}>
        <div>Rest before next set</div>
      </Show>
      <Show when={props.state === "complete"}>
        <div>
          <div>Workout Complete</div>
          <Button onClick={props.onComplete}>Finish</Button>
        </div>
      </Show>
      <Show when={active()}>
        <WorkoutActiveContainer
          unit={props.unit}
          exercise={props.exercise}
          video=""
          leftWeight={props.leftWeight}
          rightWeight={props.rightWeight}
          targetWeight={props.targetWeight}
          currentRep={props.currentRep}
          leftROM={props.leftROM}
          rightROM={props.rightROM}
        >
          <Show when={props.state === "calibrating"}>
            <div>Calibrating...</div>
            <div>{props.calibrationRepsRemaining} reps remaining</div>
          </Show>
          <Show when={props.state === "workout"}>
            <Reps
              targetVelocity={props.targetVelocity}
              stopVelocity={props.stopVelocity}
              meanVelocityPerRep={props.meanVelocityPerRep}
              currentRep={props.currentRep}
              totalReps={props.totalReps}
            />
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

export namespace WorkoutActiveContainer {
  export interface Props {
    exercise: string;
    video: string;
    unit: "lbs" | "kg";
    leftWeight: number;
    rightWeight: number;
    targetWeight: number;
    leftROM: number;
    rightROM: number;
    currentRep: number;
    children: any;
  }
}

export function WorkoutActiveContainer(props: WorkoutActiveContainer.Props) {
  return (
    <div
      class="flex flex-col justify-between items-center p-12"
      style="height:100vh"
    >
      <div class="text-center">
        <div class="text-4xl font-light text-gray-200">{props.exercise}</div>
        <InfoButton />
        <StopButton />
      </div>
      <div
        class="relative w-96 h-96 flex justify-center items-center"
        style="margin-bottom:-2rem"
      >
        <Show when={props.currentRep >= 0}>
          <Weight
            weight={props.leftWeight + props.rightWeight}
            targetWeight={props.targetWeight * 2}
            unit={props.unit}
          />
        </Show>
        <Show when={props.currentRep < 0}>
          <ExerciseDemonstration video={props.video} />
        </Show>
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
    stopVelocity: number;
    meanVelocityPerRep: number[];
    currentRep: number;
    totalReps: number;
  }
}

const CURVE_THRESHOLD = 0.2;

export function Reps(props: Reps.Props) {
  const softMax = props.targetVelocity + props.stopVelocity;
  const k =
    Math.log(1 / CURVE_THRESHOLD - 1) /
    ((props.stopVelocity / softMax) * 2 - 1);
  const sCurve = (x: number) => 1 / (1 + Math.exp(k * ((x / softMax) * 2 - 1)));
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
        <div
          class={`absolute z-20 m-1 flex-1 border-t border-white/60`}
          style={`height: ${getValue(props.stopVelocity)}%; width:100%;`}
        />
        <div
          class={`absolute z-0 m-1 flex-1 border-t border-white`}
          style={`height: ${getValue(props.stopVelocity)}%; width:100%;`}
        />
      </div>
      <div class="text-right mt-8">
        <div class="">
          <span class="text-gray-100 text-7xl">{props.currentRep}</span>
          <span class="text-gray-400 text-5xl">/{props.totalReps}</span>
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
