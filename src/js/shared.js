import * as THREE from "three";

export function createSphere(
  scene,
  initPosition = [0, 0, 0],
  initVelocity = [0, 0, 0],
  mass = 1,
  color = 0xaf748d,
  radius = 0.25,
  restitution = 1.0
) {
  const geometrySphere = new THREE.SphereGeometry(radius);
  const materialSphere = new THREE.MeshPhongMaterial({
    color: color,
  });
  const sphere = new THREE.Mesh(geometrySphere, materialSphere);
  scene.add(sphere);
  return {
    sphere: sphere,
    mass: mass,
    position: initPosition,
    velocity: initVelocity,
    radius: radius,
    restitution: restitution,
  };
}

export function addForces(...forces) {
  return forces.reduce(
    (prev, force) => [
      prev[0] + force[0],
      prev[1] + force[1],
      prev[2] + force[2],
    ],
    [0, 0, 0]
  );
}

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

/*
sphere: Object { radius, position: [x, y, z]}
direction: Array [x, y, z]
result should be vec_p + r * vec_d
*/
export function supportSphere(sphere, direction) {
  const normDirection = normaliseVec(direction);
  return [
    sphere.position[0] + sphere.radius * normDirection[0],
    sphere.position[1] + sphere.radius * normDirection[1],
    sphere.position[2] + sphere.radius * normDirection[2],
  ];
}

export function vecToString(vec) {
  return vec.toString();
}

export function stringToVec(str) {
  return str.split(",").map((val) => Number(val));
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

export function sameSide(v1, v2, v3, v4, p) {
  const normal = crossProduct(subtractVectors(v2, v1), subtractVectors(v3, v1));
  const dotV4 = dotProduct(normal, subtractVectors(v4, v1));
  const dotP = dotProduct(normal, subtractVectors(p, v1));
  return Math.sign(dotV4) == Math.sign(dotP);
}

// For each plane of the tetrahedron,
// check if the point is on the same side as the remaining vertex
// Algorithm found here
// https://stackoverflow.com/questions/25179693/how-to-check-whether-the-point-is-in-the-tetrahedron-or-not
export function pointInTetrahedron(v1, v2, v3, v4, p) {
  return (
    sameSide(v1, v2, v3, v4, p) &&
    sameSide(v2, v3, v4, v1, p) &&
    sameSide(v3, v4, v1, v2, p) &&
    sameSide(v4, v1, v2, v3, p)
  );
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

export function eliminateFurthestPoint(simplex) {
  let largestDist = -1;
  let eliminateKey = undefined;
  Array.from(simplex).forEach((key) => {
    const vec = stringToVec(key);
    const sqd = squaredDistanceFromOrigin(vec);
    if (sqd > largestDist) {
      largestDist = sqd;
      eliminateKey = key;
    }
  });
  simplex.delete(eliminateKey);
}

export function directionToOrigin(simplex) {
  if (simplex.size != 2) {
    throw new Error("Expected simplex to be a line.");
  }
  const origin = [0, 0, 0];
  const iter = simplex.keys();
  const vec1 = stringToVec(iter.next().value);
  const vec2 = stringToVec(iter.next().value);
  const norm12 = normaliseVec(subtractVectors(vec1, vec2));
  const oa = subtractVectors(origin, vec1);
  const projectionOnLine = dotProduct(norm12, oa);
  const closestPointOnLine = addVectors(
    vec1,
    multiplyConst(norm12, projectionOnLine)
  );
  const direction = subtractVectors(origin, closestPointOnLine);
  return normaliseVec(direction);
}

export function normalToOrigin(simplex) {
  if (simplex.size != 3) {
    throw new Error("Expected simplex to be a plane.");
  }
  const iter = simplex.keys();
  const vec1 = stringToVec(iter.next().value);
  const vec2 = stringToVec(iter.next().value);
  const vec3 = stringToVec(iter.next().value);

  const a = subtractVectors(vec2, vec1);
  const b = subtractVectors(vec3, vec1);
  const normal = crossProduct(a, b);
  const direction =
    dotProduct(normal, vec1) < 0 ? normal : invertVector(normal);
  return normaliseVec(direction);
}

export function nearestSimplex(simplex) {
  const origin = [0, 0, 0];
  let containsOrigin;
  let nextDirection;

  if (simplex.size == 2) {
    containsOrigin = false;
    nextDirection = directionToOrigin(simplex);
  } else if (simplex.size == 3 || simplex.size == 4) {
    if (simplex.size == 4) {
      const iter = simplex.keys();
      containsOrigin = pointInTetrahedron(
        stringToVec(iter.next().value),
        stringToVec(iter.next().value),
        stringToVec(iter.next().value),
        stringToVec(iter.next().value),
        origin
      );
      eliminateFurthestPoint(simplex);
    } else {
      containsOrigin = false;
    }
    nextDirection = normalToOrigin(simplex);
  } else {
    throw new Error(
      `simplex musty be of size 2, 3 or 4 but has size ${
        simplex.size
      }, ${simplex.keys()}`
    );
  }

  return {
    simplex,
    nextDirection,
    containsOrigin,
  };
}

export function gjkIntersectionSpheres(obj1, obj2, initDirection = [1, 0, 0]) {
  let A = subtractVectors(
    supportSphere(obj1, initDirection),
    supportSphere(obj2, invertVector(initDirection))
  );
  const simplex = new Set([vecToString(A)]);
  let nextDirection = subtractVectors([0, 0, 0], A);
  let containsOrigin = false;

  let count = 0;
  while (count < 10) {
    A = subtractVectors(
      supportSphere(obj1, nextDirection),
      supportSphere(obj2, invertVector(nextDirection))
    );

    if (dotProduct(A, nextDirection) < 0) {
      return false;
    }
    simplex.add(vecToString(A));
    ({ nextDirection, containsOrigin } = nearestSimplex(simplex));
    if (containsOrigin) return true;

    count++;
  }
  return false;
}
