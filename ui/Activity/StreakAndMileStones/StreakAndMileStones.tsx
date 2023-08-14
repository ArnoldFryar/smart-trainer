export function StreakAndMileStones(props) {
  return (
    <>
    <div class="text-xl font-medium">
      Keep it up <span class="underline underline-offset-2 decoration-primary-600 font-light">Michael</span>
    </div>
    <div class="flex">
      <div class="flex-1 text-center p-4">
        <div class="text-xl font-light">{formatNumber(props.weeks)}</div>
        <div class="text-xs text-gray-300">week streak</div>
      </div>
      <div class="flex-1 text-center p-4">
        <div class="text-xl font-light">{formatNumber(props.weight)}</div>
        <div class="text-xs text-gray-300">lbs lifted</div>
      </div>
      <div class="flex-1 text-center p-4">
        <div class="text-xl font-light">{formatNumber(props.days)}</div>
        <div class="text-xs text-gray-300">days lifted</div>
      </div>
    </div>
    <div class="py-4 text-xl font-medium">
      Past Week
    </div>
    </>
  )
}

function formatNumber(number) {
  if (number < 100_000) {
    return Math.floor(number).toFixed(0);
  } else if (number < 10_000_000) {
    const num = Math.floor(number / 1000).toFixed(0);
    return `${num}k`;
  } else {
    let suffix = "m";
    
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

    const num = (Math.floor(number * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
    return `${num}${suffix}`;
  }
}