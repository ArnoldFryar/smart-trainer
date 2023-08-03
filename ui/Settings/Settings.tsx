import { migrateWorkoutSetsv1 } from "../../services/db/migrations";
import { Button } from "../_common/Elements/Elements";

export default function Settings() {
  return <>
    <Button onClick={migrateWorkoutSetsv1}>Migrate Workout Sets v1</Button>
    <ConnectButton />
  </>
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