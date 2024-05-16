import * as THREE from "three";
import { cross, mul, sub } from "three/examples/jsm/nodes/Nodes.js";

export function createBox(
  scene,
  width = 1,
  height = 1,
  depth = 1,
  color = 0x0a0d4bff
) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({
    color: color,
    wireframe: true,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cube.position.y = -height / 2;
  return {
    cube: cube,
  };
}

export function createPlane(
  scene,
  width = 1,
  height = 1,
  position = [0, 0, 0],
  rotationAxis = [1, 0, 0],
  rotationRadians = 0
) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    color: 0xb7c9bc,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  plane.setRotationFromAxisAngle(
    new THREE.Vector3(...rotationAxis),
    rotationRadians
  );
  plane.position.x = 0;
  plane.position.y = 0;
  plane.position.z = 0;

  // tl, tr, br, bl
  const tl = new THREE.Vector3(-width / 2, height / 2, 0);
  const tr = new THREE.Vector3(width / 2, height / 2, 0);
  const br = new THREE.Vector3(width / 2, -height / 2, 0);
  const bl = new THREE.Vector3(-width / 2, -height / 2, 0);

  tl.applyAxisAngle();

  return {
    plane,
    normal: plane.normal,
  };
}

export function createHelperGrid(scene) {
  const size = 10;
  const divisions = 10;
  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);
}

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
    support: supportSphere,
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

export function supportCuboid(cuboid, direction) {
  const normDirection = normaliseVec(direction);
  const dotProducts = cuboid.corners.map((point) =>
    dotProduct(point, normDirection)
  );

  const planeCorners = cuboid.corners.filter(
    (point, index) => dotProducts[index] > 0
  );

  const a = planeCorners[0];
  const b = planeCorners[1];
  const c = planeCorners[2];
  const d = planeCorners[3];

  const ab = subtractVectors(b, a);
  const ac = subtractVectors(c, a);

  // this assumes ab and ac are perpendicular
  if (
    Math.abs(Math.acos(dotProduct(ab, ac) / (magnitude(ab) * magnitude(ac)))) >
    5
  ) {
    console.log("ERROR lines not perpendicular");
  }

  const abc = normaliseVec(crossProduct(ab, ac));

  const origin = [0, 0, 0];
  const valD =
    dotProduct(subtractVectors(a, origin), abc) /
    dotProduct(normDirection, abc);
  const pointOfCollision = addVectors(
    origin,
    multiplyConst(normDirection, valD)
  );
  return pointOfCollision;
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

export function sameSideLine(v1, v2, p) {
  return (p[0] - v2[0]) * (v1[1] - v2[1]) - (v1[0] - v2[0]) * (v0[1] - v2[1]);
}

export function pointInTriangle(v1, v2, v3, p) {}

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

// export function eliminateFurthestPoint(simplex) {
//   let largestDist = -1;
//   let eliminateKey = undefined;
//   let eliminateVec = undefined;
//   simplex.forEach((vec) => {
//     const sqd = squaredDistanceFromOrigin(vec);
//     if (sqd > largestDist) {
//       largestDist = sqd;
//       eliminateKey = key;
//       eliminateVec = vec;
//     }
//   });
//   return eliminateVec;
// }

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

export function directionToOrigin(simplex) {
  if (simplex.size != 2) {
    throw new Error("Expected simplex to be a line.");
  }
  const origin = [0, 0, 0];
  const iter = simplex.keys();
  const vec1 = stringToVec(iter.next().value);
  const vec2 = stringToVec(iter.next().value);
  const { closestPointOnLine, norm12 } = closestPointOnLineToPoint(
    vec1,
    vec2,
    origin
  );
  const containsOrigin = magnitude(closestPointOnLine) < 0.01;

  // closest point on line method degenerates when line goes through the point
  // if it does norm12 is already the correct direction to the origin
  // otherwise [0,0,0] - [0,0,0] == [0,0,0] and normalising causes division by zero
  const direction = containsOrigin
    ? norm12
    : subtractVectors(origin, closestPointOnLine);

  return {
    direction: normaliseVec(direction),
    containsOrigin,
  };
}

/*
Major help with the below from
https://caseymuratori.com/blog_0003
https://www.youtube.com/watch?v=Qupqu1xe7Io&t=2288s
*/
export function sameDirection(vec1, vec2) {
  return dotProduct(vec1, vec2) > 0;
}

export function nearestSimplexFromLine(simplex) {
  if (simplex.length != 2) {
    throw new Error("Expected simplex to be a line.");
  }
  const b = simplex.at(0);
  const a = simplex.at(1); // latest added

  const ab = subtractVectors(b, a);
  const ao = invertVector(a);

  if (sameDirection(ab, ao)) {
    // leave simplex as is, origin is closer to the line than point 'a'
    return crossProduct(crossProduct(ab, ao), ab);
  } else {
    // remove 'b' from the simplex, origin is closer to 'a' than line 'ab'
    simplex.shift();
    return ao;
  }
}

export function nearestSimplexFromTriangle(simplex) {
  if (simplex.length != 3) {
    throw new Error("Expected simplex to be a triangle.");
  }

  const c = simplex.at(0);
  const b = simplex.at(1);
  const a = simplex.at(2);

  const ab = subtractVectors(b, a);
  const ac = subtractVectors(c, a);
  const abc = crossProduct(ab, ac);

  const ao = invertVector(a);

  if (sameDirection(crossProduct(abc, ac), ao)) {
    if (sameDirection(ac, ao)) {
      simplex.splice(1, 1); // remove b from the simplex
      return crossProduct(crossProduct(ac, ao), ac);
    } else {
      if (sameDirection(ab, ao)) {
        simplex.splice(0, 1); // remove c from the simplex
        return crossProduct(crossProduct(ab, ao), ab);
      } else {
        // leave only a in the simplex
        simplex.shift();
        simplex.shift();
        return ao;
      }
    }
  } else {
    if (sameDirection(crossProduct(ab, abc), ao)) {
      if (sameDirection(ab, ao)) {
        simplex.splice(0, 1); // remove c from the simplex
        return crossProduct(crossProduct(ab, ao), ab);
      } else {
        // leave only a in the simplex
        simplex.shift();
        simplex.shift();
        return ao;
      }
    } else {
      if (sameDirection(abc, ao)) {
        return abc;
      } else {
        // permute the triangle abc->acb
        simplex.splice(1, 1);
        simplex.push(b);
        return invertVector(abc);
      }
    }
  }
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
  let containsOrigin = false;
  let nextDirection;

  if (simplex.length == 2) {
    nextDirection = nearestSimplexFromLine(simplex);
  } else if (simplex.length == 3 || simplex.length == 4) {
    if (simplex.length == 4) {
      containsOrigin = pointInTetrahedron(
        simplex[0],
        simplex[1],
        simplex[2],
        simplex[3],
        origin
      );
      // remove last added point furthest away from origin
      simplex.shift();
    }

    nextDirection = nearestSimplexFromTriangle(simplex);
  } else {
    throw new Error(
      `simplex musty be of size 2, 3 or 4 but has size ${simplex.length}, ${simplex}`
    );
  }

  return {
    simplex,
    nextDirection: normaliseVec(nextDirection),
    containsOrigin,
  };
}

export function getSphereCollisionDetails(obj1, obj2) {
  // assuming spheres for now
  const a = obj1.position;
  const b = obj2.position;
  const ab = subtractVectors(b, a);
  const normal = normaliseVec(ab);
  const obj1Closest = addVectors(a, multiplyConst(normal, obj1.radius));
  const obj2Closest = subtractVectors(b, multiplyConst(normal, obj2.radius));
  return { normal, obj1Closest, obj2Closest };
}

export function gjkIntersectionSpheres(
  obj1,
  obj2,
  initDirection = [0.57735, 0.57735, 0.57735]
) {
  let A = subtractVectors(
    supportSphere(obj1, initDirection),
    supportSphere(obj2, invertVector(initDirection))
  );
  // const simplex = new Set([vecToString(A)]);
  const simplex = [A];
  let nextDirection = subtractVectors([0, 0, 0], A);
  let containsOrigin = false;

  let count = 0;
  while (count < 10) {
    A = subtractVectors(
      supportSphere(obj1, nextDirection),
      supportSphere(obj2, invertVector(nextDirection))
    );

    if (dotProduct(A, nextDirection) < 0) {
      return { collide: false };
    }
    simplex.push(A);
    ({ nextDirection, containsOrigin } = nearestSimplex(simplex));
    if (containsOrigin) {
      // const obj1Closest = supportSphere(obj1, nextDirection);
      // const obj2Closest = supportSphere(obj2, invertVector(nextDirection));
      // const normal = normaliseVec(subtractVectors(obj1Closest, obj2Closest));
      const { normal, obj1Closest, obj2Closest } = getSphereCollisionDetails(
        obj1,
        obj2
      );
      return {
        collide: true,
        normal,
        obj1Closest,
        obj2Closest,
      };
    }

    count++;
  }
  return { collide: false };
}

export function resolvePosition(collision, obj1, obj2) {
  /*
  We resolve using inverse mass weighting
  where d = d1+d2 where d is the distance between the closest 
  points ob the objects.

  d1 = d * (1/m1) / ((1/m1) + (1/m2))
     = d * m2 / (m1+m2)

  Need to take care of m1, m2 labels
  */
  const { normal, obj1Closest, obj2Closest } = collision;
  const d = magnitude(subtractVectors(obj1Closest, obj2Closest));
  const totalMass = obj1.mass + obj2.mass;
  const obj1Frac = obj2.mass / totalMass;
  const obj2Frac = obj1.mass / totalMass;
  const d1 = d * obj1Frac;
  const d2 = d * obj2Frac;

  obj1.position = subtractVectors(obj1.position, multiplyConst(normal, d1));
  obj2.position = addVectors(obj2.position, multiplyConst(normal, d2));
}

export function resolveVelocity(collision, obj1, obj2) {
  /*
    if we ignore rotation in the current equations

    . means dot product
    v* means vector

    m1*v1_after = m1*v1_before + impulse * v_collision_norm
    m2*v2_after = m2*v2_before - impulse * v_collision_norm

    coefficient of restitution (Cr): is a property of materials
    Cr =  - (v1_after - v2_after) . v_collision_norm
         -------------------------------------------
         (v1_before - v2_before) . v_collision_norm

    solving these equations for impulse, and plugging in 
    v1_after, v2_after into the Cr equation

    we also need to use the dot product identity

    v_a.v_b = |v_a||v_b|cos(theta)
    v_collision_norm . v_collision_norm == 1 
    
    since magnitude is 1 and angle between is 0deg. 
    gives us

    impulse = 1/((1/m1) + (1/m2)) * -(Cr + 1) (v1_before - v2_before).v_collision_norm

    1/((1/m1) + (1/m2)) == m1m2 / m1 + m2
    */
  const { normal } = collision;
  const mass_term = (obj1.mass * obj2.mass) / (obj1.mass + obj2.mass);
  const Cr = 1; // (for now)
  const impulse = -Math.abs(
    mass_term *
      -(Cr + 1) *
      dotProduct(subtractVectors(obj1.velocity, obj2.velocity), normal)
  );

  const v1_diff = multiplyConst(normal, impulse / obj1.mass);
  const v1_after = addVectors(obj1.velocity, v1_diff);
  const v2_diff = multiplyConst(normal, impulse / obj2.mass);
  const v2_after = subtractVectors(obj2.velocity, v2_diff);

  obj1.velocity = v1_after;
  obj2.velocity = v2_after;
}

export function resolveCollision(collision, obj1, obj2) {
  const { collide, normal, obj1Closest, obj2Closest } = collision;
  if (collide) {
    // first resolve positions, and update objects
    resolvePosition(collision, obj1, obj2);
    resolveVelocity(collision, obj1, obj2);
  }
}
