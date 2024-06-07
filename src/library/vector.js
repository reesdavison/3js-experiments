export function addVectors(...vectors) {
  return vectors.reduce(
    (prev, vec) => [prev[0] + vec[0], prev[1] + vec[1], prev[2] + vec[2]],
    [0, 0, 0]
  );
}

export function subtractVectors(vec1, vec2) {
  return [vec1[0] - vec2[0], vec1[1] - vec2[1], vec1[2] - vec2[2]];
}

export function invertVector(vec) {
  return [-vec[0], -vec[1], -vec[2]];
}

export function dotProduct(vec1, vec2) {
  return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
}

export function intersectLineAndPlane(
  linePoint,
  planePoint,
  lineDirection,
  planeDirection
) {
  const normLineDirection = normaliseVec(lineDirection);
  const normPlaneDirection = normaliseVec(planeDirection);
  const valD =
    dotProduct(subtractVectors(planePoint, linePoint), normPlaneDirection) /
    dotProduct(normLineDirection, normPlaneDirection);
  const pointOfCollision = addVectors(
    linePoint,
    multiplyConst(normLineDirection, valD)
  );
  return pointOfCollision;
}

export function vecToString(vec) {
  return vec.toString();
}

export function stringToVec(str) {
  return str.split(",").map((val) => Number(val));
}

/* 
Hamiltonian product of quaternions
Derivation requires liberal use of RH rule
*/
export function hamiltonianProduct(vec1, vec2) {
  if (vec1.length !== 4 || vec2.length !== 4) {
    throw new Error("Expecting 4 dimensional vectors");
  }
  return [
    vec1[0] * vec2[0] -
      vec1[1] * vec2[1] -
      vec1[2] * vec2[2] -
      vec1[3] * vec2[3],
    vec1[0] * vec2[1] +
      vec1[1] * vec2[0] +
      vec1[2] * vec2[3] -
      vec1[3] * vec2[2],
    vec1[0] * vec2[2] -
      vec1[1] * vec2[3] +
      vec1[2] * vec2[0] +
      vec1[3] * vec2[1],
    vec1[0] * vec2[3] +
      vec1[1] * vec2[2] -
      vec1[2] * vec2[1] +
      vec1[3] * vec2[0],
  ];
}

/*
Rotate a vector by a quarternion.
*/
export function rotateVector(vec, qtrn) {
  // https://math.stackexchange.com/questions/40164/how-do-you-rotate-a-vector-by-a-unit-quaternion
  const newVec = [0, ...vec];
  const inverseQuarternion = [qtrn[0], -qtrn[1], -qtrn[2], -qtrn[3]];
  const result = hamiltonianProduct(
    hamiltonianProduct(qtrn, newVec),
    inverseQuarternion
  );
  return [result[1], result[2], result[3]];
}

/*
In our version of quaternion the scalar value is first ie
q = a + bi + cj + dk
q = [a, b, c, d]
*/
export function angleAxisToQuarternion(axis, radians) {
  const normAxis = normaliseVec(axis);
  const quarternion = [
    Math.cos(radians / 2),
    Math.sin(radians / 2) * normAxis[0],
    Math.sin(radians / 2) * normAxis[1],
    Math.sin(radians / 2) * normAxis[2],
  ];
  return quarternion;
}

export function quaternionToAngleAxis(quaternion) {
  const theta = Math.acos(quaternion[0]) * 2;
  if (theta == 0) {
    return { angle: 0, axis: [1, 0, 0] };
  }
  const ax = quaternion[1] / Math.sin(theta / 2);
  const ay = quaternion[2] / Math.sin(theta / 2);
  const az = quaternion[3] / Math.sin(theta / 2);
  return { angle: theta, axis: [ax, ay, az] };
}

export function rotateVectorAngleAxis(vec, axis, radians) {
  const quarternion = angleAxisToQuarternion(axis, radians);
  return rotateVector(vec, quarternion);
}

export function rotateVectorArray(arrayOfVec, axis, radians) {
  return arrayOfVec.map((vec) => rotateVectorAngleAxis(vec, axis, radians));
}

export function crossProduct(vec1, vec2) {
  /*
  a x b = | i  j  k  |
          | a1 a2 a3 |
          | b1 b2 b3 |

  Found using the determinant of the above matrix
  Represents the normal to the plane represented by 2 vectors
  */
  const a1 = vec1[0];
  const a2 = vec1[1];
  const a3 = vec1[2];

  const b1 = vec2[0];
  const b2 = vec2[1];
  const b3 = vec2[2];

  return [a2 * b3 - a3 * b2, a3 * b1 - a1 * b3, a1 * b2 - a2 * b1];
}

/*
vec1 to vec2 represents the line
return value norm12 is vector from vec2 to vec1
*/
export function closestPointOnLineToPoint(vec1, vec2, point) {
  const norm12 = normaliseVec(subtractVectors(vec1, vec2));
  const oa = subtractVectors(point, vec1);
  const projectionOnLine = dotProduct(norm12, oa);
  return {
    norm12,
    closestPointOnLine: addVectors(
      vec1,
      multiplyConst(norm12, projectionOnLine)
    ),
  };
}

export function squaredDistanceFromOrigin(vec) {
  return vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2;
}

export function magnitude(vec) {
  return Math.sqrt(squaredDistanceFromOrigin(vec));
}

export function normaliseVec(vec) {
  const mag = magnitude(vec);
  return [vec[0] / mag, vec[1] / mag, vec[2] / mag];
}

export function multiplyConst(vec, constant) {
  return [vec[0] * constant, vec[1] * constant, vec[2] * constant];
}

export function invertMatrix(m) {
  // Taken from https://stackoverflow.com/questions/63981471/how-do-i-solve-inverse-of-3x3-matrices-without-using-a-library
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const x = e * i - h * f,
    y = f * g - d * i,
    z = d * h - g * e,
    det = a * x + b * y + c * z;
  return det != 0
    ? [
        [x, c * h - b * i, b * f - c * e],
        [y, a * i - c * g, d * c - a * f],
        [z, g * b - a * h, a * e - d * b],
      ].map((r) => r.map((v) => (v /= det)))
    : null;
}

export function multiplyMatrix(m1, m2) {
  const [[a1, b1, c1], [d1, e1, f1], [g1, h1, i1]] = m1;
  const [[a2, b2, c2], [d2, e2, f2], [g2, h2, i2]] = m2;

  return [
    [
      a1 * a2 + b1 * d2 + c1 * g2,
      a1 * b2 + b1 * e2 + c1 * h2,
      a1 * c2 + b1 * f2 + c1 * i2,
    ],
    [
      d1 * a2 + e1 * d2 + f1 * g2,
      d1 * b2 + e1 * e2 + f1 * h2,
      d1 * c2 + e1 * f2 + f1 * i2,
    ],
    [
      g1 * a2 + h1 * d2 + i1 * g2,
      g1 * b2 + h1 * e2 + i1 * h2,
      g1 * c2 + h1 * f2 + i1 * i2,
    ],
  ];
}

export function multiplyVecMatrixVec(v1, m, v2) {
  const [a1, b1, c1] = v1;
  const [[a2, b2, c2], [d2, e2, f2], [g2, h2, i2]] = m;
  const [a3, b3, c3] = v2;

  const scalar =
    (a1 * a2 + b1 * d2 + c1 * g2) * a3 +
    (a1 * b2 + b1 * e2 + c1 * h2) * b3 +
    (a1 * c2 + b1 * f2 + c1 * i2) * c3;
  return scalar;
}

// export function multiplyVecTMatrix(v, m) {
//   const [a1, b1, c1] = v;
//   const [[a2, b2, c2], [d2, e2, f2], [g2, h2, i2]] = m;

//   const scalar =
//     a2 * a3 +
//     b2 * b3 +
//     c2 * c3 +
//     d2 * a3 +
//     e2 * b3 +
//     f2 * c3 +
//     g2 * a3 +
//     h2 * b3 +
//     i2 * c3;
//   return scalar;
// }

export function multiplyMatrixVec(m, v) {
  const [[a1, b1, c1], [d1, e1, f1], [g1, h1, i1]] = m;
  const [a2, b2, c2] = v;
  const vector = [
    a1 * a2 + b1 * b2 + c1 * c2,
    d1 * a2 + e1 * b2 + f1 * c2,
    g1 * a2 + h1 * b2 + i1 * c2,
  ];
  return vector;
}

export function transpose3x3Matrix(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  return [
    [a, d, g],
    [b, e, h],
    [c, f, i],
  ];
}

export function rotationMatrixFromAxisAngle(axis, angle) {
  const [ux, uy, uz] = normaliseVec(axis);
  const cosTheta = Math.cos(angle);
  const C = 1 - cosTheta;
  const sinTheta = Math.sin(angle);
  const m = [
    [
      ux * ux * C + cosTheta,
      ux * uy * C - uz * sinTheta,
      ux * uz * C + uy * sinTheta,
    ],
    [
      ux * uy * C + uz * sinTheta,
      uy * uy * C + cosTheta,
      uy * uz * C - ux * sinTheta,
    ],
    [
      uz * ux * C - uy * sinTheta,
      uz * uy * C + ux * sinTheta,
      uz * uz * C + cosTheta,
    ],
  ];
  return m;
}

export function sameDirection(vec1, vec2) {
  return dotProduct(vec1, vec2) > 0;
}
