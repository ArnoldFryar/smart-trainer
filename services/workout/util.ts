import { Sample } from "../device/cables";

function removeOutliers(values: number[], numStdDev: number): number[] {
  // Calculate the mean and standard deviation of the values
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);

  // Remove values that are more than numStdDev standard deviations away from the mean
  return values.filter(x => Math.abs(x - mean) <= numStdDev * stdDev);
}

export function calculateMeanVelocity(samples: Sample[] = []): number {
  // Calculate the mean velocity of the samples
  const velocities = samples.map(s => Math.max(s.left.velocity, s.right.velocity));
  const filteredVelocities = removeOutliers(velocities.filter(v => v > 0), 4);
  return filteredVelocities.length ? filteredVelocities.reduce((a, b) => a + b, 0) / filteredVelocities.length : 0;
}

const phasesForSample: WeakMap<Sample, Phase[]> = new WeakMap();

type Metrics = {
  min: number,
  max: number,
  mean: number,
  median: number,
}

export type Phase = {
  phase: "concentric" | "eccentric" | "top" | "bottom",
  samples: Sample[]
  position: {
    left: Metrics,
    right: Metrics
  },
  force: Metrics,
  velocity: Metrics,
}

type Range = {
  top: number,
  bottom: number
}

export function splitSamplesByPhase(samples: Sample[], { top, bottom }: Range): Phase[] {
  let phases: Phase[]; 
  let foundIndex = -1;
  const lastIndex = samples.length - 1;

  if (lastIndex < 0) return [];

  // cache since we basically recompute this whole thing as samples come in from the device
  for (let i = lastIndex; i >= 0; i--) {
    const sample = samples[i]
    const cachedReps = phasesForSample.get(sample);
    if (cachedReps) {
      phases = cachedReps;
      if (i === lastIndex) return phases;
      phasesForSample.delete(sample);
      foundIndex = i;
      break;
    }
  }

  phases ??= [];

  const rangeOfMotion = top - bottom;
  let currentPhase = phases[phases.length - 1] ?? {
    phase: getRelevantCable(samples[0]).velocity > 0 ? "concentric" : "eccentric",
    samples: []
  };

  for (let i = foundIndex + 1; i < samples.length; i++) {
    const sample = samples[i];
    const cable = getRelevantCable(sample);
    const relativePosition = (cable.position - bottom) / rangeOfMotion;

    if (currentPhase.phase ===  "concentric") {
      if (cable.velocity > 0) {
        currentPhase.samples.push(sample);
      } else if (relativePosition < 0.1) {
        const prevRep = phases[phases.length - 2]
        if (prevRep?.phase === "bottom") {
          prevRep.samples.push(...currentPhase.samples);
          phases.length = phases.length - 1;
          currentPhase = prevRep;
        } else {
          currentPhase.phase = "bottom";
        }
        currentPhase.samples.push(sample);
      } else if (relativePosition > 0.9) {
        phases.push(currentPhase = {
          phase: "eccentric",
          samples: [sample]
        } as Phase);
      } else {
        const initialCable = getRelevantCable(currentPhase.samples[0]);
        const initialRelativePosition = (initialCable.position - bottom) / rangeOfMotion;
        if (Math.abs(relativePosition - initialRelativePosition) > 0.75) {
          phases.push(currentPhase = {
            phase: "eccentric",
            samples: [sample]
          } as Phase);
        } else {
          currentPhase.samples.push(sample);
        }
      }
    } else if (currentPhase.phase ===  "eccentric") {
      if (cable.velocity < 0) {
        // moving down, continue
        currentPhase.samples.push(sample);
      } else if (relativePosition > 0.9) {
        // at the top moving up? probably bouncing/adjusting
        const prevRep = phases[phases.length - 2]
        if (prevRep?.phase === "top") {
          prevRep.samples.push(...currentPhase.samples);
          phases.length = phases.length - 1;
          currentPhase = prevRep;
        } else {
          currentPhase.phase = "top";
        }
        currentPhase.samples.push(sample);
      } else if (relativePosition < 0.1) {
        // at the bottom moving up? starting concentric phase
        phases.push(currentPhase = {
          phase: "concentric",
          samples: [sample]
        } as Phase);
      } else {
        const initialCable = getRelevantCable(currentPhase.samples[0]);
        const initialRelativePosition = (initialCable.position - bottom) / rangeOfMotion;
        if (Math.abs(relativePosition - initialRelativePosition) > 0.75) {
          // moving up after completing most of a rep
          // starting concentric even though shorting the range of motion
          phases.push(currentPhase = {
            phase: "concentric",
            samples: [sample]
          } as Phase);
        } else {
          // you haven't completed enough of a rep to count, continue
          currentPhase.samples.push(sample);
        }
      }
    } else if (currentPhase.phase === "bottom") {
      if (cable.velocity < 0) {
        currentPhase.samples.push(sample);
      } else {
        phases.push(currentPhase = {
          phase: "concentric",
          samples: [sample]
        } as Phase);
      }
    } else if (currentPhase.phase === "top") {
      if (cable.velocity > 0) {
        currentPhase.samples.push(sample);
      } else {
        phases.push(currentPhase = {
          phase: "eccentric",
          samples: [sample]
        } as Phase);
      }
    }

    const forces = currentPhase.samples.map(s => s.left.force + s.right.force);
    const velocities = currentPhase.samples.map(s => Math.abs(s.left.velocity) > Math.abs(s.right.velocity) ? s.left.velocity : s.right.velocity);
    const leftPositions = currentPhase.samples.map(s => s.left.position);
    const rightPositions = currentPhase.samples.map(s => s.left.position);

    currentPhase.position = {
      left: getMetrics(leftPositions),
      right: getMetrics(rightPositions)
    };

    currentPhase.force = getMetrics(forces);
    currentPhase.velocity = getMetrics(velocities);
  }

  phasesForSample.set(samples[lastIndex], phases);
  return phases;
}

function getMetrics(data: number[]): Metrics {
  return {
    min: Math.min(...data),
    max: Math.max(...data),
    mean: data.reduce((a, b) => a + b, 0) / data.length,
    median: data.sort((a, b) => a - b)[Math.floor(data.length / 2)],
  }
}

export function getRelevantCable(sample: Sample) {
  return Math.abs(sample.left.velocity) > Math.abs(sample.right.velocity) ? sample.left : sample.right;
  // if (whichCable === "both") {
  //   return {
  //     position: (sample.left.position + sample.right.position) / 2,
  //     velocity: (sample.left.velocity + sample.right.velocity) / 2,
  //     force: (sample.left.force + sample.right.force) / 2,
  //   };
  // }
  // return sample[whichCable];
}

export function getSetMetrics(samples: Sample[], range: Range) {
  const phases = splitSamplesByPhase(samples, range);
  const concentric = phases.filter(p => p.phase === "concentric");
  const eccentric = phases.filter(p => p.phase === "eccentric");
  const top = phases.filter(p => p.phase === "top");
  const bottom = phases.filter(p => p.phase === "bottom");
  const working = concentric.concat(eccentric);

  return {
    concentric: {
      maxForce: Math.max(...concentric.map(p => p.force.max)),
      meanForce: concentric.reduce((a, b) => a + b.force.mean, 0) / concentric.length,
      maxMinForce: Math.max(...concentric.map(p => p.force.min)),
      maxVelocity: Math.max(...concentric.map(p => p.velocity.max)),
      meanVelocity: concentric.reduce((a, b) => a + b.velocity.mean, 0) / concentric.length,
      maxPower: Math.max(...concentric.map(p => p.velocity.max / 1000 * p.force.max * 9.81)),
      meanPower: concentric.reduce((a, b) => a + b.velocity.mean / 1000 * b.force.mean * 9.81, 0) / concentric.length,
      velocityLoss: Math.max(...concentric.map(p => p.velocity.mean)) - concentric[concentric.length - 1]?.velocity.mean,
      work: concentric.reduce((a, b) => a + b.velocity.mean / 1000 * b.force.mean * 9.81 * (b.samples[b.samples.length-1].time - b.samples[0].time) / 1000, 0),
      repsMaxes: getRepMaxes(concentric, concentric),
      samples: concentric
    },
    eccentric: {
      maxForce: Math.max(...eccentric.map(p => p.force.max)),
      meanForce: eccentric.reduce((a, b) => a + b.force.mean, 0) / eccentric.length,
      maxMinForce: Math.max(...eccentric.map(p => p.force.min)),
      meanVelocity: eccentric.reduce((a, b) => a + b.velocity.mean, 0) / eccentric.length,
      minMeanVelocity: Math.min(...eccentric.map(p => p.velocity.mean)),
      repMaxes: getRepMaxes(eccentric, eccentric),
      samples: eccentric
    },
    rom: {
      maxPauseTop: Math.max(...top.map(p => p.samples[p.samples.length - 1].time - p.samples[0].time)),
      meanPauseTop: top.reduce((a, b) => a + (b.samples[b.samples.length - 1].time - b.samples[0].time), 0) / top.length,
      minPauseTop: Math.min(...top.map(p => p.samples[p.samples.length - 1].time - p.samples[0].time)),
      maxPauseBottom: Math.max(...bottom.map(p => p.samples[p.samples.length - 1].time - p.samples[0].time)),
      meanPauseBottom: bottom.reduce((a, b) => a + (b.samples[b.samples.length - 1].time - b.samples[0].time), 0) / bottom.length,
      minPauseBottom: Math.min(...bottom.map(p => p.samples[p.samples.length - 1].time - p.samples[0].time)),
      maxDistance: Math.max(...working.map(p => p.position.left.max - p.position.left.min)),
      meanDistance: working.reduce((a, b) => a + (b.position.left.max - b.position.left.min), 0) / working.length,
      minDistance: Math.min(...working.map(p => p.position.left.max - p.position.left.min)),
      // balance 
    },
    repMaxes: getRepMaxes(concentric, eccentric),
    e1rm: getEstimated1RepMax(concentric)
  }
}

function getEstimated1RepMax(concentric: Phase[]) {
  const maxMinForce = Math.max(...concentric.map(p => p.force.min));
  const consideredReps = concentric.slice(0, concentric.findIndex(r => r.force.min === maxMinForce) + 1);
  const weightedReps = consideredReps.reduce((count, r) => count + Math.pow(r.force.min / maxMinForce, 2), 0);
  const estimated1rm = maxMinForce * (36 / (37 - weightedReps));
  // const estimated1rm_alt = maxMinForce + consideredReps.reduce((force, r) => force + r.force.mean / 30, 0);

  return estimated1rm;
}

function getRepMaxes(concentric: Phase[], eccentric: Phase[]): Record<number | "e1rm" | "best", number> {
  let start = 0;
  let end = concentric.length - 1;
  const repMaxes = {
    e1rm: 0,
    best: 0,
  };

  while (start < end) {
    const lowestForce = Math.min(...concentric.slice(start, end).map(p => p.force.min), ...eccentric.slice(start, end).map(p => p.force.min));
    const reps = end - start + 1;
    const e1rm = lowestForce * (36 / (37 - reps));
    repMaxes[reps] = lowestForce;
    if (e1rm > repMaxes.e1rm) {
      repMaxes.e1rm = e1rm;
      repMaxes.best = reps;
    }
    if (Math.min(concentric[start].force.min, eccentric[start].force.min) < Math.min(concentric[end].force.min, eccentric[end].force.min)) {
      start++;
    } else {
      end--;
    }
  }

  return repMaxes;
}