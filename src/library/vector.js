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
