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