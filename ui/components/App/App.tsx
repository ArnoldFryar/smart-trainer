import { Show, createSignal } from 'solid-js';
import Trainer from '../../../device/index.js';
import { WorkoutForm } from '../WorkoutForm/WorkoutForm.js';
import { WorkoutActive } from '../WorkoutActive/WorkoutActive.js';
import { Button } from '../Elements/Elements.js';
import { createLocalSignal } from '../../../util/signals.js';

export function App() {
  return (
    <>
      <ConnectButton />
      <Show when={Trainer.connected()}>
        <Workout />
        <Debug />
      </Show>
    </>
  );
}

export function AppContainer() {
  
}

function ConnectButton() {
  return (
    <Button
      class={`
      absolute top-4 right-4
        ${
          Trainer.connected()
            ? 'hover:bg-red-900'
            : 'hover:bg-gradient-to-br hover:from-sky-700 hover:to-sky-900 active:from-sky-900 active:to-sky-900'
        }`}
      onClick={() => {
        Trainer.connected() ? Trainer.disconnect() : Trainer.connect();
      }}
    >
      {() =>
        Trainer.connected() === undefined
          ? 'Connecting...'
          : Trainer.connected()
          ? 'Disconnect'
          : 'Connect'
      }
    </Button>
  );
}

function Workout() {
  const [workoutActive, setWorkoutActive] = createSignal(false);
  const [exercises, setExercises] = createLocalSignal('exercises', [
    {
      name: 'Bench Press',
      reps: 8,
      weight: 30,
    },
  ]);

  return (
    <>
      <Show when={!workoutActive()}>
        <WorkoutForm
          exercises={exercises()}
          onSubmit={(exercises) => {
            setExercises(exercises);
            setWorkoutActive(true);
          }}
        />
      </Show>
      <Show when={workoutActive()}>
        <WorkoutActive
          exercise={exercises()[0].name}
          weight={exercises()[0].weight}
          warmupReps={3}
          workingReps={exercises()[0].reps}
          unit="lbs"
          increment={0}
          preset={'ISOKINETIC'}
          onComplete={() => {
            setWorkoutActive(false);
          }}
        />
      </Show>
    </>
  );
}

function Debug() {
  return (
    <div class="bg-black text-white opacity-20 absolute bottom-4 right-4 text-xs p-4 pointer-events-none">
      <div>Mode</div>
      <pre>{JSON.stringify(Trainer.mode(), null, 2)}</pre>
      <div>Sample</div>
      <pre>{JSON.stringify(Trainer.sample(), null, 2)}</pre>
      <div>Reps</div>
      <pre>{JSON.stringify(Trainer.reps(), null, 2)}</pre>
    </div>
  );
}

// function WorkoutActive() {
//   const leftWeight = () => {
//     const { left } = Trainer.sample();
//     return left.position <= 0.5 && left.velocity === 0 ? 0 : left.force;
//   };
//   const rightWeight = () => {
//     const { right } = Trainer.sample();
//     return right.position <= 0.5 && right.velocity === 0 ? 0 : right.force;
//   };

//   const power = () => {
//     const { left, right } = Trainer.sample();
//     const leftPower = left.velocity * left.force;
//     const rightPower = right.velocity * right.force;
//     return leftPower + rightPower;
//   };

//   const [repMaxPower, setRepMaxPower] = createSignal(0);
//   createRenderEffect(() => {
//     setRepMaxPower(
//       Math.max(
//         untrack(() => repMaxPower()),
//         power()
//       )
//     );
//   });

//   const rep = createMemo(() => Math.max(0, Trainer.reps().up - 1));
//   const leftROM = () =>
//     (Trainer.sample().left.position - Trainer.reps().rangeBottom) /
//     (Trainer.reps().rangeTop - Trainer.reps().rangeBottom);
//   const rightROM = () =>
//     (Trainer.sample().right.position - Trainer.reps().rangeBottom) /
//     (Trainer.reps().rangeTop - Trainer.reps().rangeBottom);

//   const [repPowers, setRepPowers] = createSignal([]);

//   createEffect(() => {
//     if (rep()) {
//       setRepPowers(untrack(() => repPowers().concat(repMaxPower())));
//       setRepMaxPower(0);
//     }
//   });

//   const allRepPowers = () => repPowers().concat(repMaxPower());

//   return (
//     <>
//       <WorkoutActiveView
//         unit="lbs"
//         leftWeight={leftWeight()}
//         rightWeight={rightWeight()}
//         powerPerRep={allRepPowers()}
//         currentRep={rep()}
//         totalReps={5}
//         leftROM={leftROM()}
//         rightROM={rightROM()}
//       />
//     </>
//   );
// }
