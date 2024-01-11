import PouchDB from "pouchdb";
import { createSignal } from "solid-js";
import { migrateWorkoutSetsv1 } from "../../services/db/migrations";
import { createLocalSignal } from "../../services/util/signals";
import { Button, FieldSet, Input } from "../_common/Elements/Elements";

export default function Settings() {
  const [verifying, setVerifying] = createSignal(false);
  const [couchdb, setCouchdb] = createLocalSignal("couchdb-url", "");
  const handleCouchDBChange = async (e) => {
    setVerifying(true)
    try {
      const value = e.target.value;
      const db = new PouchDB(value, { skip_setup:true });
      const info = await db.info();
      if (info) {
        setCouchdb(value);
      }
    } catch {}
    setVerifying(false);
  }
  return <>
    <Button onClick={migrateWorkoutSetsv1}>Migrate Workout Sets v1</Button>
    <FieldSet label="CouchDB Sync URL" subtext={verifying() ? "Verifying..." : ""}>
      <Input value={couchdb()} onChange={handleCouchDBChange}/>
    </FieldSet>
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