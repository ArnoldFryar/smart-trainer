import { NumberWithUnit } from "../../_common/Elements/Elements";
import { Timer } from "../../_common/Timer/Timer";

export function StreakAndMileStones(props) {
  return (
    <>
    <div class="text-xl font-medium">
      Keep it up <span class="underline underline-offset-2 decoration-primary-600 font-light">Michael</span>
    </div>
    <div class="flex">
      <div class="flex-1 text-center p-4">
        <div class="text-xl font-light">
          <FormatNumber number={props.weeks}/>
        </div>
        <div class="text-xs text-gray-300">week streak</div>
      </div>
      <div class="flex-1 text-center p-4">
        <div class="text-xl font-light">
          <FormatNumber number={props.weight}/>
        </div>
        <div class="text-xs text-gray-300">lbs lifted</div>
      </div>
      <div class="flex-1 text-center p-4">
        <div class="text-xl font-light">
          <FormatNumber number={props.days}/>
        </div>
        <div class="text-xs text-gray-300">days lifted</div>
      </div>
      <div class="flex-1 text-center p-4">
        <div class="text-xl font-light">
          <Timer since={props.since}/>
        </div>
        <div class="text-xs text-gray-300">rest</div>
      </div>
    </div>
    </>
  )
}

function FormatNumber(props) {
  const compute = (number) => {
    let num="", suffix="";
    if (number < 100_000) {
      num = Math.floor(number).toFixed(0);
    } else if (number < 10_000_000) {
      num = Math.floor(number / 1000).toFixed(0);
      suffix = "k"
    } else {
      suffix = "m";
      
      number /= 1_000_000;
      
      if (number >= 10_000) {
        number /= 1_000;
        suffix = "b";
      }

      let decimals = 0;
      
      if (number < 100) {
        decimals = 2;
      } else if (number < 1000) {
        decimals = 1;
      }

      num = (Math.floor(number * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
    }
    return [num, suffix];
  }

  return (
    <NumberWithUnit value={compute(props.number)[0]} unit={compute(props.number)[1]}/>
  )
}