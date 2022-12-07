import { Show, For, createEffect } from 'solid-js';
import {
  Weight,
  RangeOfMotion,
} from '../WeightAndRangeOfMotion/WeightAndRangeOfMotion.js';
import { ExerciseDemonstration } from '../ExerciseDemonstration/ExerciseDemonstration.js';
import { Button } from '../../_common/Elements/Elements.js';
import { createWorkoutService } from '../../../services/workout/machine.js';

export namespace WorkoutActive {
  export interface Props {
    unit: 'lbs' | 'kg';
    onComplete: (data: any) => void;
  }
}

export function WorkoutActive(props: WorkoutActive.Props) {
  const [workoutState, send] = createWorkoutService({});

  createEffect(() => {
    console.log(workoutState().value, workoutState().context);
  })

  const currentState = () => workoutState().value;
  const exercise = () => workoutState().context.currentSet?.value.exercise;

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

  const currentRep = () => currentState() === "calibrate" ? -workoutState().context.calibrationRepsRemaining() : workoutState().context.repCount?.();
  const powerPerRep = () => workoutState().context.repSamples().map(({ concentric }) => 
    concentric.reduce((max, current) => 
      Math.max(
        max, 
        current.left.velocity * current.left.force + current.right.velocity * current.right.force
      ),
      0
    )
  );

  return (
    <>
      <WorkoutActiveView
        unit={props.unit}
        exercise={exercise()}
        video=""
        leftWeight={leftWeight()}
        rightWeight={rightWeight()}
        targetWeight={100}
        powerPerRep={powerPerRep()}
        currentRep={currentRep()}
        totalReps={10}
        leftROM={leftROM()}
        rightROM={rightROM()}
      />
    </>
  );
}

export namespace WorkoutActiveView {
  export interface Props {
    exercise: string;
    video: string;
    unit: 'lbs' | 'kg';
    leftWeight: number;
    rightWeight: number;
    targetWeight: number;
    leftROM: number;
    rightROM: number;
    powerPerRep: number[];
    currentRep: number;
    totalReps: number;
  }
}

export function WorkoutActiveView(props: WorkoutActiveView.Props) {
  return (
    <div
      class="flex flex-col justify-between items-center p-12"
      style="height:100vh"
    >
      <div class="text-center">
        <div class="text-4xl font-light text-gray-200">{props.exercise}</div>
        <InfoButton /><StopButton />
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
      <Reps
        targetPower={(props.leftWeight + props.rightWeight) * 100}
        powerPerRep={props.powerPerRep}
        currentRep={props.currentRep}
        totalReps={props.totalReps}
      />
    </div>
  );
}

namespace Reps {
  export interface Props {
    targetPower: number;
    powerPerRep: number[];
    currentRep: number;
    totalReps: number;
  }
}

function Reps(props: Reps.Props) {
  const maxPower = () => Math.max(props.targetPower, ...props.powerPerRep);
  return (
    <div class="flex flex-col justify-center items-center w-full">
      <div
        class="flex flex-row items-end justify-center items-end w-full"
        style="height:100px;"
      >
        <Show when={props.currentRep >= 0}>
          <For each={props.powerPerRep}>
            {(power: number, index) => (
              <div
                class={`m-1 flex-1 bg-primary-700 rounded -skew-x-6 bg-gradient-to-b from-primary-100 via-primary-300 to-primary-500 shadow-lg shadow-primary-500/30 border border-primary-400 ${
                  index() > props.currentRep ? 'opacity-25' : ''
                }`}
                style={`max-width:25%; height: ${(power / maxPower()) * 100}%`}
              />
            )}
          </For>
        </Show>
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
    </div>
  );
}

function StopButton() {
  return <Button class="my-2 mx-1" onClick={() => Trainer.stop()}>Stop</Button>;
}

function InfoButton() {
  return <Button class="my-2 mx-1" onClick={() => {}}>Info</Button>;
}
