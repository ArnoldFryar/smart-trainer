import { Show, createSignal } from 'solid-js';
import Trainer from '../../services/device/index.js';
import { Button } from '../_common/Elements/Elements.js';
import { AppShell } from '../_common/AppShell/AppShell.jsx';
import { Workout } from '../Workout/Workout.jsx';
import { Manual } from '../Manual/Manual.jsx';

export function App() {
  const [workout, setWorkout] = createSignal(false);
  return (
    <>
      <Show when={!workout()} fallback={<Workout onExit={() => setWorkout(false)}/>}>
        <AppShell tabs={[{
          label: "Activity",
          view: <Button onClick={() => setWorkout(true)}>Start Workout</Button>
        }, {
          label: "Performance",
          view: <div>Performance</div>
        },  {
          label: "Manual",
          view: <Manual/>
        }, {
          label: "Learn",
          view: <div>Learn</div>
        }, {
          label: "Settings",
          view: <div>
            <h1>Settings</h1>
            <ConnectButton />
          </div>
        }]} />
      </Show>
      <Debug />
    </>
  );
}

function ConnectButton() {
  return (
    <Button
      class={`
      absolute top-4 right-4
        ${
          Trainer.connected()
            ? 'hover:bg-red-900'
            : 'hover:bg-gradient-to-br hover:from-primary-700 hover:to-primary-900 active:from-primary-900 active:to-primary-900'
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

function Debug() {
  return (
    <Show when={Trainer.connected()}>
      <div class="bg-black text-white opacity-20 absolute bottom-4 right-4 text-xs p-4 pointer-events-none">
        <div>Mode</div>
        <pre>{JSON.stringify(Trainer.mode(), null, 2)}</pre>
        <div>Sample</div>
        <pre>{JSON.stringify(Trainer.sample(), null, 2)}</pre>
        <div>Reps</div>
        <pre>{JSON.stringify(Trainer.reps(), null, 2)}</pre>
      </div>
    </Show>
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
