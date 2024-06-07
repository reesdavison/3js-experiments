import {
  subtractVectors,
  invertVector,
  addVectors,
  dotProduct,
  magnitude,
  crossProduct,
  multiplyConst,
  normaliseVec,
  intersectLineAndPlane,
  squaredDistanceFromOrigin,
  multiplyVecMatrixVec,
  multiplyMatrixVec,
  multiplyMatrix,
  invertMatrix,
  sameDirection,
} from "./vector";
import { XYZPointToArray, getGravityForce } from "./helpers";

/*
Major help with the below from
https://caseymuratori.com/blog_0003
https://www.youtube.com/watch?v=Qupqu1xe7Io&t=2288s
*/

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

export function nearestSimplexFromLine(simplex, obj1Points, obj2Points) {
  if (simplex.length != 2) {
    throw new Error("Expected simplex to be a line.");
  }
  const b = simplex.at(0);
  const a = simplex.at(1); // latest added

  const ab = subtractVectors(b, a);
  const ao = invertVector(a);

  // const ob = b;
  // line simplex passes through origin.
  if (magnitude(ao) + magnitude(b) - magnitude(ab) <= 0.01) {
    // simplex.shift();
    return {
      nextDirection: ab,
      containsOrigin: true,
      contactPoint: addVectors(obj1Points[1], ao), // TODO check this
    };
  }

  if (sameDirection(ab, ao)) {
    // leave simplex as is, origin is closer to the line than point 'a'
    return {
      nextDirection: crossProduct(crossProduct(ab, ao), ab),
      containsOrigin: false,
    };
  } else {
    // remove 'b' from the simplex, origin is closer to 'a' than line 'ab'
    simplex.shift();
    obj1Points.shift();
    obj2Points.shift();
    return { nextDirection: ao, containsOrigin: false };
  }
}

export function getBarycentricWeightsOfOriginFromSimplex(simplex) {
  if (simplex.length !== 4) {
    throw new Error("expected tetrahedron");
  }

  const [[x1, y1, z1], [x2, y2, z2], [x3, y3, z3], [x4, y4, z4]] = simplex;
  const T = [
    [x1 - x4, x2 - x4, x3 - x4],
    [y1 - y4, y2 - y4, y3 - y4],
    [z1 - z4, z2 - z4, z3 - z4],
  ];
  const invT = invertMatrix(T);
  const [b1, b2, b3] = multiplyMatrixVec(
    invT,
    subtractVectors([0, 0, 0], [x4, y4, z4])
  );
  const b4 = 1 - b1 - b2 - b3;
  return [b1, b2, b3, b4];
}

export function getPointFromBarycentricWeights(baryWeights, points) {
  const [b1, b2, b3, b4] = baryWeights;
  const result = addVectors(
    multiplyConst(points[0], b1),
    multiplyConst(points[1], b2),
    multiplyConst(points[2], b3),
    multiplyConst(points[3], b4)
  );
  return result;
}

export function nearestSimplexFromTriangle(simplex, obj1Points, obj2Points) {
  if (simplex.length != 3) {
    throw new Error("Expected simplex to be a triangle.");
  }

  const c = simplex.at(0);
  const b = simplex.at(1);
  const a = simplex.at(2);

  const point1B = obj1Points.at(1);
  const point2B = obj2Points.at(1);

  const ab = subtractVectors(b, a);
  const ac = subtractVectors(c, a);
  const abc = crossProduct(ab, ac);

  const ao = invertVector(a);

  if (sameDirection(crossProduct(abc, ac), ao)) {
    if (sameDirection(ac, ao)) {
      simplex.splice(1, 1); // remove b from the simplex
      obj1Points.splice(1, 1);
      obj2Points.splice(1, 1);
      return crossProduct(crossProduct(ac, ao), ac);
    } else {
      if (sameDirection(ab, ao)) {
        simplex.splice(0, 1); // remove c from the simplex
        obj1Points.splice(0, 1);
        obj2Points.splice(0, 1);
        return crossProduct(crossProduct(ab, ao), ab);
      } else {
        // leave only a in the simplex
        simplex.shift();
        simplex.shift();
        obj1Points.shift();
        obj1Points.shift();
        obj2Points.shift();
        obj2Points.shift();
        return ao;
      }
    }
  } else {
    if (sameDirection(crossProduct(ab, abc), ao)) {
      if (sameDirection(ab, ao)) {
        simplex.splice(0, 1); // remove c from the simplex
        obj1Points.splice(0, 1);
        obj2Points.splice(0, 1);
        return crossProduct(crossProduct(ab, ao), ab);
      } else {
        // leave only a in the simplex
        simplex.shift();
        simplex.shift();
        obj1Points.shift();
        obj1Points.shift();
        obj2Points.shift();
        obj2Points.shift();
        return ao;
      }
    } else {
      if (sameDirection(abc, ao)) {
        return abc;
      } else {
        // permute the triangle abc->acb
        simplex.splice(1, 1);
        simplex.push(b);
        obj1Points.splice(1, 1);
        obj1Points.push(point1B);
        obj2Points.splice(1, 1);
        obj2Points.push(point2B);
        return invertVector(abc);
      }
    }
  }
}

export function nearestSimplex(simplex, obj1Points, obj2Points) {
  const origin = [0, 0, 0];
  let containsOrigin = false;
  let nextDirection;
  let contactPoint;

  if (simplex.length == 2) {
    ({ nextDirection, containsOrigin, contactPoint } = nearestSimplexFromLine(
      simplex,
      obj1Points,
      obj2Points
    ));
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
      if (containsOrigin) {
        const baryWeights = getBarycentricWeightsOfOriginFromSimplex(simplex);
        const obj1Closest = getPointFromBarycentricWeights(
          baryWeights,
          obj1Points
        );
        const obj2Closest = getPointFromBarycentricWeights(
          baryWeights,
          obj2Points
        );
        if (magnitude(subtractVectors(obj1Closest, obj2Closest)) > 0.1) {
          console.log("Contact points should be the same");
        }
        // console.log("Simplex", simplex);
        // console.log("bary weights", baryWeights);
        // console.log("obj1Points", obj1Points);
        // console.log("obj2Points", obj2Points);
        // console.log("closest", obj1Closest, obj2Closest);
        return {
          contactPoint: obj1Closest,
          simplex,
          containsOrigin,
        };
      }
      simplex.shift();
      obj1Points.shift();
      obj2Points.shift();
    }

    nextDirection = nearestSimplexFromTriangle(simplex, obj1Points, obj2Points);
  } else {
    throw new Error(
      `simplex musty be of size 2, 3 or 4 but has size ${simplex.length}, ${simplex}`
    );
  }

  return {
    simplex,
    nextDirection: normaliseVec(nextDirection),
    containsOrigin,
    contactPoint,
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

function isClose(val1, val2, absTol) {
  if (val2 - absTol <= val1 && val1 <= val2 + absTol) {
    return true;
  }
  return false;
}

function getClosestPointCuboid(obj, contactPoint) {
  const objOuterNormals = obj.getOuterPlaneNormals(obj);
  const corners = obj.getCuboidCorners(obj);

  const outDirection = subtractVectors(contactPoint, obj.position);

  //sorted planes
  const sp = Object.entries(objOuterNormals)
    .map(([key, norm], index) => {
      const planePointIndices = obj.getCornerIndicesForPlane(key);
      const intersection = intersectLineAndPlane(
        contactPoint,
        corners[planePointIndices[0]],
        outDirection,
        norm
      );
      const size = squaredDistanceFromOrigin(
        subtractVectors(obj.position, intersection)
      );
      const isSameDirection = sameDirection(outDirection, norm);
      return {
        size: size,
        isSameDirection,
        intersection,
        index,
        planeDirectionStr: key,
        norm: norm,
      };
    })
    .filter((val) => val.isSameDirection)
    .toSorted((a, b) => a.size - b.size); // ascending

  // in these cases its ambiguous which surface to move forwards with
  if (isClose(sp[0].size, sp[1].size) && isClose(sp[0].size, sp[2].size)) {
    // contactPoint is at a corner
  } else if (isClose(sp[0].size, sp[1].size)) {
    // contactPoint is on a line
  }

  const norm = normaliseVec(sp[0].norm);

  const planePointIndices = obj.getCornerIndicesForPlane(
    sp[0].planeDirectionStr
  );
  const [i1, i2, i3, i4] = planePointIndices;

  const planePoint = corners[i1];

  const closest = intersectLineAndPlane(
    contactPoint,
    planePoint,
    outDirection,
    norm
  );

  const surfaceCenterPoint = multiplyConst(
    addVectors(corners[i1], corners[i2], corners[i3], corners[i4]),
    0.25
  );

  // corners are returned anticlockwise
  const surfaceArea =
    magnitude(subtractVectors(corners[2], corners[1])) *
    magnitude(subtractVectors(corners[3], corners[2]));

  // deal with corners touching here
  // deal with lines touching here
  // const mostAccurateNorm = normaliseVec(subtractVectors())

  return { norm, closest, surfaceCenterPoint, surfaceArea };
}

export function refineContactPoint(obj1, obj2) {
  // const obj1OuterNormals = obj1.getOuterPlaneNormals(obj1);
  // const obj1Corners = obj1.getCuboidCorners(obj1);
  // const obj1OutDirection = subtractVectors(initContactPoint, obj1.position);
}

export function getCuboidCuboidCollisionDetails(obj1, obj2, contactPoint) {
  let {
    closest: obj1Closest,
    norm: obj1Norm,
    surfaceCenterPoint: obj1SurfaceCenterPoint,
    surfaceArea: obj1SurfaceArea,
  } = getClosestPointCuboid(obj1, contactPoint);
  let {
    closest: obj2Closest,
    norm: obj2Norm,
    surfaceCenterPoint: obj2SurfaceCenterPoint,
    surfaceArea: obj2SurfaceArea,
  } = getClosestPointCuboid(obj2, contactPoint);

  let newContactPoint;
  if (dotProduct(obj1Norm, obj2Norm) < -0.8) {
    // ie the planes are almost parallel
    // we need to refine the contact point, as otherwise
    // we introduce moments about the center
    // Use the center point of the smallest cuboid
    newContactPoint =
      obj1SurfaceArea <= obj2SurfaceArea
        ? obj1SurfaceCenterPoint
        : obj2SurfaceCenterPoint;

    ({
      closest: obj1Closest,
      norm: obj1Norm,
      surfaceCenterPoint: obj1SurfaceCenterPoint,
      surfaceArea: obj1SurfaceArea,
    } = getClosestPointCuboid(obj1, newContactPoint));
    ({
      closest: obj2Closest,
      norm: obj2Norm,
      surfaceCenterPoint: obj2SurfaceCenterPoint,
      surfaceArea: obj2SurfaceArea,
    } = getClosestPointCuboid(obj2, newContactPoint));
  }

  return {
    normal:
      obj1SurfaceArea <= obj2SurfaceArea ? invertVector(obj2Norm) : obj1Norm,
    obj1Norm, //multiplyConst(addVectors(obj1Norm, invertVector(obj2Norm)), 0.5),
    obj2Norm,
    obj1Closest,
    obj2Closest,
    contactPoint: newContactPoint || contactPoint,
  };
}

/*
We make the assumption in this code that collision occurs at a plane
Not on lines or corners
*/
export function getSphereCuboidCollisionDetails(obj1, obj2) {
  const sphere = obj1.shape === "sphere" ? obj1 : obj2;
  const cuboid = obj1.shape === "box" ? obj1 : obj2;

  const obj1IsCuboid = obj1 === cuboid;

  const cuboidToSphereDirection = subtractVectors(
    sphere.position,
    cuboid.position
  );

  const outerNormals = cuboid.getOuterPlaneNormals(cuboid);

  const sortedDotPlanes = Object.entries(outerNormals)
    .map(([key, norm], index) => {
      return {
        dp: dotProduct(cuboidToSphereDirection, norm),
        index,
        planeDirectionStr: key,
        norm: norm,
      };
    })
    .toSorted((a, b) => b.dp - a.dp); // descending

  const moreAccurateNorm = normaliseVec(sortedDotPlanes[0].norm);
  const planePointIndex = cuboid.getCornerIndicesForPlane(
    sortedDotPlanes[0].planeDirectionStr
  )[0];
  const corners = cuboid.getCuboidCorners(cuboid);
  const planePoint = corners[planePointIndex];

  const sphereDirection = invertVector(moreAccurateNorm);

  const cuboidClosest = intersectLineAndPlane(
    sphere.position,
    planePoint,
    sphereDirection,
    moreAccurateNorm
  );
  const sphereClosest = sphere.support(sphere, sphereDirection);

  return {
    normal: obj1IsCuboid ? moreAccurateNorm : sphereDirection,
    obj1Closest: obj1IsCuboid ? cuboidClosest : sphereClosest,
    obj2Closest: obj1IsCuboid ? sphereClosest : cuboidClosest,
  };
}

/*
Mostly used as a test function to help
*/
export function basicCollisionSphereTest(obj1, obj2) {
  const b1 = obj1.getBounds(obj1);
  const b2 = obj2.getBounds(obj2);
  const distanceBetweenCentersSquared = squaredDistanceFromOrigin(
    subtractVectors(XYZPointToArray(b1), XYZPointToArray(b2))
  );
  return {
    collide: distanceBetweenCentersSquared <= (b1.size + b2.size) ** 2,
    obj1,
    obj2,
  };
}

export function gjkIntersection(
  obj1,
  obj2,
  initDirection = [0.57735, 0.57735, 0.57735]
) {
  let p1 = obj1.support(obj1, initDirection);
  let p2 = obj2.support(obj2, invertVector(initDirection));
  let A = subtractVectors(p1, p2);
  const simplex = [A];
  const obj1Points = [p1];
  const obj2Points = [p2];

  let nextDirection = subtractVectors([0, 0, 0], A);
  let containsOrigin = false;
  let contactPoint;
  let obj1Closest;
  let obj2Closest;
  let normal;
  let obj1Norm, obj2Norm;

  let count = 0;
  while (count < 15) {
    p1 = obj1.support(obj1, nextDirection);
    p2 = obj2.support(obj2, invertVector(nextDirection));
    A = subtractVectors(p1, p2);

    if (dotProduct(A, nextDirection) < 0) {
      return { collide: false };
    }
    obj1Points.push(p1);
    obj2Points.push(p2);
    simplex.push(A);
    ({ nextDirection, containsOrigin, contactPoint } = nearestSimplex(
      simplex,
      obj1Points,
      obj2Points
    ));
    if (containsOrigin) {
      if (obj1.shape === "sphere" && obj2.shape === "sphere") {
        ({ normal, obj1Closest, obj2Closest } = getSphereCollisionDetails(
          obj1,
          obj2
        ));
      } else if (obj1.shape === "sphere" || obj2.shape === "sphere") {
        ({ normal, obj1Closest, obj2Closest } = getSphereCuboidCollisionDetails(
          obj1,
          obj2
        ));
      } else {
        ({
          obj1Norm,
          obj2Norm,
          obj1Closest,
          obj2Closest,
          normal,
          contactPoint,
        } = getCuboidCuboidCollisionDetails(obj1, obj2, contactPoint));
      }
      const obj1ContactArm = subtractVectors(contactPoint, obj1.position);
      const obj2ContactArm = subtractVectors(contactPoint, obj2.position);

      return {
        collide: true,
        normal,
        obj1Closest,
        obj2Closest,
        obj1,
        obj2,
        obj1ContactArm,
        obj2ContactArm,
        obj1Norm,
        obj2Norm,
      };
    }

    count++;
  }
  return { collide: false };
}

export function resolvePosition(collision) {
  /*
  We resolve using inverse mass weighting
  where d = d1+d2 where d is the distance between the closest 
  points ob the objects.

  d1 = d * (1/m1) / ((1/m1) + (1/m2))
     = d * m2 / (m1+m2)

  Need to take care of m1, m2 labels
  */
  const { normal, obj1, obj2, obj1Closest, obj2Closest } = collision;

  const d = magnitude(subtractVectors(obj1Closest, obj2Closest));
  // if (d > 0.3) {
  //   debugger;
  // }

  const totalMass = obj1.mass + obj2.mass;
  const obj1Frac = obj2.mass / totalMass;
  const obj2Frac = obj1.mass / totalMass;
  const d1 = d * obj1Frac;
  const d2 = d * obj2Frac;

  if (!obj1.fixed) {
    // && d1 > 0.01) {
    obj1.position = subtractVectors(obj1.position, multiplyConst(normal, d1));
  }
  if (!obj2.fixed) {
    // && d2 > 0.01) {
    obj2.position = addVectors(obj2.position, multiplyConst(normal, d2));
  }
}

export function resolveVelocity(collision) {
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
  const { normal, obj1, obj2 } = collision;
  const mass_term = (obj1.mass * obj2.mass) / (obj1.mass + obj2.mass);
  const Cr = 1.0; // (for now)
  const impulse = -Math.abs(
    mass_term *
      -(Cr + 1) *
      dotProduct(subtractVectors(obj1.velocity, obj2.velocity), normal)
  );

  // const mag_v1_before = magnitude(obj1.velocity);
  // const mag_v1_after = magnitude(v1_after);
  // const mag_v2_before = magnitude(obj2.velocity);
  // const mag_v2_after = magnitude(v2_after);
  // console.log(
  //   `V1 before:${mag_v1_before},after:${mag_v1_after}, V2 before:${mag_v2_before},after:${mag_v2_after}`
  // );

  let v1_diff = [0, 0, 0];
  let v2_diff = [0, 0, 0];
  if (!obj1.fixed) {
    v1_diff = multiplyConst(normal, impulse / obj2.mass);
  }
  if (!obj2.fixed) {
    v2_diff = multiplyConst(normal, impulse / obj2.mass);
  }

  const v1_after = addVectors(obj1.velocity, v1_diff);
  const v2_after = subtractVectors(obj2.velocity, v2_diff);

  obj1.velocity = v1_after;
  obj2.velocity = v2_after;
}

export function resolveForces(collision) {
  // dont deal with moments for now
  const {
    normal,
    obj1,
    obj2,
    obj1ContactArm,
    obj2ContactArm,
    obj1Closest,
    obj2Closest,
  } = collision;

  // gravity already applied externally

  // obj1.centerForce = [0, 0, 0];
  // obj2.centerForce = [0, 0, 0];
}

export function resolveVelocityWithRotations(collision) {
  /*
  This is extends the above derivation with usage from
  https://arc.net/l/quote/mudyryjs
  A big thanks to Amir Vaxman - https://avaxman.github.io/
  for the great lecture notes.
  */
  let { normal, obj1, obj2, obj1ContactArm, obj2ContactArm } = collision;

  const frictionTangent = crossProduct(
    crossProduct(normal, subtractVectors(obj1.velocity, obj2.velocity)),
    normal
  );
  const staticFriction = 0.001;
  const kineticFriction = 0.5;
  const frictionComponent = multiplyConst(frictionTangent, staticFriction);
  // normal = addVectors(normal, frictionComponent); // this is a hack but avoids a rewrite

  const massD = 1 / obj1.mass + 1 / obj2.mass;
  const crossArmNormal1 = crossProduct(obj1ContactArm, normal);
  const inertiaTerm1 = multiplyVecMatrixVec(
    crossArmNormal1,
    obj1.getInverseInertia(obj1),
    crossArmNormal1
  );
  const crossArmNormal2 = crossProduct(obj2ContactArm, normal);
  const inertiaTerm2 = multiplyVecMatrixVec(
    crossArmNormal2,
    obj2.getInverseInertia(obj2),
    crossArmNormal2
  );
  const denominator = massD + inertiaTerm1 + inertiaTerm2;

  const Cr = 0.7; // (for now)
  const impulse = -Math.abs(
    -((Cr + 1) / denominator) *
      dotProduct(subtractVectors(obj1.velocity, obj2.velocity), normal)
  );

  const withFriction = addVectors(normal, frictionComponent);

  let v1_diff = [0, 0, 0];
  let v2_diff = [0, 0, 0];
  let w1_diff = [0, 0, 0];
  let w2_diff = [0, 0, 0];
  if (!obj1.fixed) {
    v1_diff = multiplyConst(withFriction, impulse / obj2.mass);
    w1_diff = multiplyMatrixVec(
      obj1.getInverseInertia(obj1),
      crossProduct(obj1ContactArm, multiplyConst(withFriction, impulse))
    );
  }
  if (!obj2.fixed) {
    v2_diff = multiplyConst(withFriction, impulse / obj2.mass);
    w2_diff = multiplyMatrixVec(
      obj2.getInverseInertia(obj2),
      crossProduct(obj2ContactArm, multiplyConst(withFriction, impulse))
    );
  }

  const v1_after = addVectors(obj1.velocity, v1_diff);
  const v2_after = subtractVectors(obj2.velocity, v2_diff);

  const w1_after = addVectors(obj1.angularVelocity, w1_diff);
  const w2_after = subtractVectors(obj2.angularVelocity, w2_diff);

  obj1.velocity = v1_after;
  obj2.velocity = v2_after;

  obj1.angularVelocity = w1_after;
  obj2.angularVelocity = w2_after;
}

export function resolveCollision(collision) {
  const {
    collide,
    normal,
    obj1Closest,
    obj2Closest,
    obj1,
    obj2,
    obj1ContactArm,
    obj2ContactArm,
  } = collision;

  if (collide) {
    // first resolve positions, and update objects
    resolveForces(collision);
    resolvePosition(collision);
    if (obj1.shape === "box" && obj2.shape === "box") {
      resolveVelocityWithRotations(collision);
    } else {
      resolveVelocity(collision);
    }
  }
}
