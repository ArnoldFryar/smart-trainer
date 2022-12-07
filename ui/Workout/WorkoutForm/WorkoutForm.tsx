import { Button, Radio } from '../../_common/Elements/Elements.js';
export namespace WorkoutForm {
  export interface Props {
    onSubmit: (workoutOptions: any) => void;
  }
}

export function WorkoutForm(props) {
  const activate = async (e) => {
    e.preventDefault();
    props.onSubmit({ length: "mini" });
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
      <Button type="submit">{props.connected ? "Workout!" : "Connect"}</Button>
    </form>
  );
}
