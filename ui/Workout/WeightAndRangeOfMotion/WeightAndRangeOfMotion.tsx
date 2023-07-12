export namespace WeightAndRangeOfMotion {
  export interface Props {
    unit: 'lbs' | 'kg';
    weight: number;
    targetWeight: number;
    leftROM: number;
    rightROM: number;
  }
}

export function WeightAndRangeOfMotion(props: WeightAndRangeOfMotion.Props) {
  return (
    <div
      class="relative w-96 h-96 flex justify-center items-center"
      style="margin-bottom:-2rem"
    >
      <RangeOfMotion
        class="absolute w-96 h-96"
        leftROM={props.leftROM}
        rightROM={props.rightROM}
      />
      <Weight
        weight={props.weight}
        targetWeight={props.targetWeight}
        unit={props.unit}
      />
    </div>
  );
}

export namespace Weight {
  export interface Props {
    unit: 'lbs' | 'kg';
    weight: number;
    targetWeight: number;
  }
}

export function Weight(props: Weight.Props) {
  const weight = () => props.weight * (props.unit === 'lbs' ? 2.2 : 1);
  const factor = () => props.targetWeight ? 0.75 + Math.pow(props.weight / props.targetWeight, 1/2) / 4 : 1;
  return (
    <div
      class="text-right"
      style={`opacity:${factor()}; transform: scale(${factor()})`}
    >
      <div class="text-9xl font-medium leading-none">
        {weight().toFixed(0)}
        <span class="text-gray-400 text-7xl">
          {(weight() % 1).toFixed(1).slice(1)}
        </span>
      </div>
      <span
        class="block text-sm font-bold tracking-wider text-gray-500 mx-1"
        style="margin-top:-0.5em;"
      >
        TOTAL {props.unit.toUpperCase()}
      </span>
    </div>
  );
}

export namespace RangeOfMotion {
  export interface Props {
    class: string;
    leftROM: number;
    rightROM: number;
  }
}

export function RangeOfMotion(props: RangeOfMotion.Props) {
  return (
    <svg class={props.class} viewBox={viewBox}>
      <filter id="f2" x="0" y="0" width="200%" height="200%">
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="7" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
      </filter>
      <Circle stroke='hsl(var(--gray-700))' direction={1} percent={1} />
      <Circle stroke='hsl(var(--gray-700))' direction={-1} percent={1} />
      <Circle
        stroke={props.leftROM >= 0 ? 'hsl(var(--primary-800))' : 'hsl(var(--secondary-900))'}
        direction={1}
        percent={props.leftROM}
        filter="url(#f2)"
      />
      <Circle
        stroke={props.rightROM >= 0 ? 'hsl(var(--primary-800))' : 'hsl(var(--secondary-900))'}
        direction={-1}
        percent={props.rightROM}
        filter="url(#f2)"
      />
      <Circle
        stroke={props.leftROM >= 0 ? 'hsl(var(--primary-400))' : 'hsl(var(--secondary-600))'}
        direction={1}
        percent={props.leftROM}
      />
      <Circle
        stroke={props.rightROM >= 0 ? 'hsl(var(--primary-400))' : 'hsl(var(--secondary-600))'}
        direction={-1}
        percent={props.rightROM}
      />
    </svg>
  );
}

const sqSize = 500;
const strokeWidth = 12;
const radius = (sqSize - strokeWidth) / 2;
const dashArray = radius * Math.PI * 2;
const viewBox = `-10 -10 ${sqSize + 20} ${sqSize + 20}`;

function Circle(props) {
  const angle = () => (props.direction === 1 ? 123 : 58);
  const dashOffset = () =>
    props.direction *
    (dashArray - dashArray * ((props.percent * 100 || 1) / 250));

  return (
    <circle
      cx={sqSize / 2}
      cy={sqSize / 2}
      r={radius}
      stroke-width={`${strokeWidth}px`}
      stroke-linecap="round"
      transform={` rotate(${angle()} ${sqSize / 2} ${sqSize / 2}) `}
      fill="none"
      stroke={props.stroke}
      stroke-dashoffset={dashOffset()}
      filter={props.filter}
      style={{
        'stroke-dasharray': dashArray,
      }}
    />
  );
}
