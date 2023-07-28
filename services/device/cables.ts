export type Cable = {
  position: number,
  velocity: number,
  force: number
};

export type Sample = {
  time: number,
  left: Cable,
  right: Cable
};

export function parseSample(dataview?: DataView): Sample {
  if (!dataview?.byteLength) {
    return {
      left: { position: 0, velocity: 0, force: 0 },
      right: { position: 0, velocity: 0, force: 0 },
      time: 0,
    };
  }

  return {
    time: dataview.getUint32(0, true),
    left: {
      position: dataview.getInt16(4, true) / 10,
      velocity: dataview.getInt16(6, true),
      force: dataview.getInt16(8, true) / 100,
    },
    right: {
      position: dataview.getInt16(10, true) / 10,
      velocity: dataview.getInt16(12, true),
      force: dataview.getInt16(14, true) / 100,
    },
  };
}

export function parseCable(dataview: DataView): Cable {
  return {
    position: dataview.getFloat32(0, true),
    velocity: dataview.getFloat32(4, true),
    force: dataview.getFloat32(8, true),
  };
}

export function encodeSamples(samples: Sample[]) {
  const buffer = new ArrayBuffer(16 * samples.length);
  const dataView = new DataView(buffer);

  let byteOffset = 0;
  for (const { time, left, right } of samples) {
    dataView.setUint32(byteOffset, time);
    dataView.setInt16(byteOffset + 4, left.position * 10);
    dataView.setInt16(byteOffset + 6, left.velocity);
    dataView.setInt16(byteOffset + 8, left.force * 100);
    dataView.setInt16(byteOffset + 10, right.position * 10);
    dataView.setInt16(byteOffset + 12, right.velocity);
    dataView.setInt16(byteOffset + 14, right.force * 100);
    byteOffset += 16;
  }

  return buffer;
}

export function decodeSamples(buffer: ArrayBuffer) {
  const samples: Sample[] = [];
  for (let i = 0; i < buffer.byteLength; i += 16) {
    samples.push(parseSample(new DataView(buffer, i, 16)));
  }
  return samples;
}

// export function compressSamples(samples: Sample[]): string {
//   let compressedData = "";
//   let prevTime = 0;
//   let prevLeftForce = 0;
//   let prevRightForce = 0;
//   let prevLeftVelocity = 0;
//   let prevRightVelocity = 0;
//   let prevLeftPosition = 0;
//   let prevRightPosition = 0;
  
//   samples.forEach((sample) => {
//     const { time, left, right } = sample;
//     const timeDiff = time - prevTime;
//     const leftForceDiff = left.force - prevLeftForce;
//     const rightForceDiff = right.force - prevRightForce;
//     const leftVelocityDiff = left.velocity - prevLeftVelocity;
//     const rightVelocityDiff = right.velocity - prevRightVelocity;
//     const leftPositionDiff = left.position - prevLeftPosition;
//     const rightPositionDiff = right.position - prevRightPosition;

//     const data = [
//       leftVelocityDiff,
//       rightVelocityDiff,
//       leftPositionDiff*10,
//       rightPositionDiff*10,
//       leftForceDiff*100,
//       rightForceDiff*100,
//     ];

//     if (rightForceDiff === leftForceDiff) {
//       data.length--;
//       if (leftForceDiff === 0) {
//         data.length--;
//         if (rightPositionDiff === leftPositionDiff) {
//           data.length--;
//           if (leftPositionDiff === 0) {
//             data.length--;
//             if (rightVelocityDiff === leftVelocityDiff) {
//               data.length--;
//               if (leftVelocityDiff === 0) {
//                 data.length--;
//               }
//             }
//           }
//         }
//       }
//     }

//     compressedData += `${timeDiff.toString(36)}`;

//     data.forEach((value) => {
//       compressedData += `,${value === 0 ? "" : Math.floor(value).toString(36)}`;
//     });
    
//     compressedData += `|`;

//     prevTime = time;
//     prevLeftForce = left.force;
//     prevRightForce = right.force;
//     prevLeftVelocity = left.velocity;
//     prevRightVelocity = right.velocity;
//     prevLeftPosition = left.position;
//     prevRightPosition = right.position;
//   });
  
//   return compressedData.slice(0, -1); // Remove trailing delimiter
// }

// export function decompressSamples(compressedData: string): Sample[] {
//   const samples: Sample[] = [];

//   let prevTime = 0;
//   let prevLeftForce = 0;
//   let prevRightForce = 0;
//   let prevLeftVelocity = 0;
//   let prevRightVelocity = 0;
//   let prevLeftPosition = 0;
//   let prevRightPosition = 0;
//   const valueWithDefault = (value, defaultValue) => value === undefined || Number.isNaN(value) ? defaultValue : value;

//   compressedData.split("|").forEach((chunk) => {
//     const values = chunk.split(",").map((value) => parseInt(value, 36));
//     const time = prevTime + values[0];
//     const leftVelocity = prevLeftVelocity + valueWithDefault(values[1], 0);
//     const rightVelocity = prevRightVelocity + valueWithDefault(values[2], values[1]);
//     const leftPosition = prevLeftPosition + valueWithDefault(values[3], 0) / 10;
//     const rightPosition = prevRightPosition + valueWithDefault(values[4], values[3]) / 10;
//     const leftForce = prevLeftForce + valueWithDefault(values[5], 0) / 100;
//     const rightForce = prevRightForce + valueWithDefault(values[6], values[5]) / 100;

//     const sample = { time, left: { position: leftPosition, velocity: leftVelocity, force: leftForce }, right: { position: rightPosition, velocity: rightVelocity, force: rightForce } };
//     samples.push(sample);

//     prevTime = time;
//     prevLeftForce = leftForce;
//     prevRightForce = rightForce;
//     prevLeftVelocity = leftVelocity;
//     prevRightVelocity = rightVelocity;
//     prevLeftPosition = leftPosition;
//     prevRightPosition = rightPosition;
//   });

//   return samples;
// }

// function deepEqual(obj1: any, obj2: any): boolean {
//   if (obj1 === obj2) {
//     // Same object reference
//     return true;
//   } else if (typeof obj1 !== typeof obj2) {
//     // Different types
//     return false;
//   } else if (Array.isArray(obj1) !== Array.isArray(obj2)) {
//     // One is an array and the other is not
//     return false;
//   } else if (typeof obj1 === "object") {
//     // Compare object properties
//     const keys1 = Object.keys(obj1);
//     const keys2 = Object.keys(obj2);
//     if (keys1.length !== keys2.length) {
//       // Different number of properties
//       return false;
//     }
//     for (const key of keys1) {
//       if (!deepEqual(obj1[key], obj2[key])) {
//         // Property values are not equal
//         return false;
//       }
//     }
//     // All property values are equal
//     return true;
//   } else {
//     // Compare primitive values
    
//     return obj1 === obj2;
//   }
// }
