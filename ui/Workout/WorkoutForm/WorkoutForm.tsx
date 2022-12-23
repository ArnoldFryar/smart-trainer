import { Button, Radio } from '../../_common/Elements/Elements.js';
export namespace WorkoutForm {
  export interface Props {
    exercies: { main: string[], accessory: string[] },
    connected: boolean,
    onSubmit: (workoutOptions: any) => void;
  }
}

export function WorkoutForm(props) {
  const activate = async (e) => {
    e.preventDefault();
    props.onSubmit({ length: "mini", exercises: props.exercises });
  };
  return (
    <form onSubmit={activate}>
      <Radio name="length" value="mini">
          <span>Mini</span>
          <span>(About 5 minutes)</span>
      </Radio>
      <Radio name="length" value="short">
          <span>Short</span>
          <span>(About 20 minutes)</span>
      </Radio>
      <Radio name="length" value="full">
          <span>Full</span>
          <span>(About 40 minutes)</span>
      </Radio>
      {/* TODO: Add options for customizing exercises */}
      <pre>{JSON.stringify(props.exercises, null, 2)}</pre>
      <Button type="submit">{props.connected ? "Workout!" : "Connect"}</Button>
    </form>
  );
}
