import { onCleanup, createSignal, Switch, Match } from "solid-js";
import { NumberWithUnit } from "../Elements/Elements";

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;

export function Timer(props) {
  const [timeSince, setTimeSince] = createSignal(getTimeSince(props.since));
  const daysSince = () => Math.floor(timeSince() / day);
  const hoursSince = () => Math.floor((timeSince() % day) / hour);
  const minutesSince = () => Math.floor((timeSince() % hour) / minute);
  const secondsSince = () => Math.floor((timeSince() % minute) / second);
  const resolution = daysSince() ? hour : hoursSince() ? minute : second;

  let timeout;
  function updateTime() {
    const timeUntilNextUpdate = getTimeSince(props.since) % resolution;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const newTimeSince = getTimeSince(props.since);
      if (Math.floor(newTimeSince / resolution) !== Math.floor(timeSince() / resolution)) {
        setTimeSince(newTimeSince);
      }
      updateTime();
    }, timeUntilNextUpdate || 0)
  }
  updateTime();

  onCleanup(() => {
    clearTimeout(timeout)
  });

  return (
    <Switch>
      <Match when={daysSince()}>
        <NumberWithUnit value={daysSince()} unit="d"/>{" "}
        <NumberWithUnit value={hoursSince()} unit="h"/>
      </Match>
      <Match when={hoursSince()}>
        <NumberWithUnit value={hoursSince()} unit="h"/>{" "}
        <NumberWithUnit value={minutesSince()} unit="m"/>
      </Match>
      <Match when={minutesSince()}>
        <NumberWithUnit value={minutesSince()} unit="m"/>{" "}
        <NumberWithUnit value={secondsSince()} unit="s"/>
      </Match>
      <Match when={true}>
        <NumberWithUnit value={secondsSince()} unit="s"/>
      </Match>
    </Switch>
  );
}

function getTimeSince(time) {
  return Math.max(Date.now() - time, 0);
}