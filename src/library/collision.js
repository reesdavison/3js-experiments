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
} from "./vector";

/*
Major help with the below from
https://caseymuratori.com/blog_0003
https://www.youtube.com/watch?v=Qupqu1xe7Io&t=2288s
*/
export function sameDirection(vec1, vec2) {
  return dotProduct(vec1, vec2) > 0;
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

export function nearestSimplexFromLine(simplex) {
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
    return { nextDirection: ab, containsOrigin: true };
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
    return { nextDirection: ao, containsOrigin: false };
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

export function nearestSimplex(simplex) {
  const origin = [0, 0, 0];
  let containsOrigin = false;
  let nextDirection;

  if (simplex.length == 2) {
    ({ nextDirection, containsOrigin } = nearestSimplexFromLine(simplex));
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

export function getSphereCuboidCollisionDetails(obj1, obj2) {
  const sphere = obj1.radius ? obj1 : obj2;
  const cuboid = obj1.corners ? obj1 : obj2;

  const obj1IsCuboid = obj1 === cuboid;

  const cuboidToSphereDirection = subtractVectors(
    sphere.position,
    cuboid.position
  );

  const outerNormals = cuboid.getOuterPlaneNormals(cuboid.corners);

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
  const planePoint = cuboid.corners[planePointIndex];

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

export function gjkIntersection(
  obj1,
  obj2,
  initDirection = [0.57735, 0.57735, 0.57735]
) {
  let A = subtractVectors(
    obj1.support(obj1, initDirection),
    obj2.support(obj2, invertVector(initDirection))
  );
  const simplex = [A];
  let nextDirection = subtractVectors([0, 0, 0], A);
  let containsOrigin = false;

  let count = 0;
  while (count < 10) {
    A = subtractVectors(
      obj1.support(obj1, nextDirection),
      obj2.support(obj2, invertVector(nextDirection))
    );

    if (dotProduct(A, nextDirection) < 0) {
      return { collide: false };
    }
    simplex.push(A);
    ({ nextDirection, containsOrigin } = nearestSimplex(simplex));
    if (containsOrigin) {
      let obj1Closest, obj2Closest, normal;
      if (obj1.sphere && obj2.sphere) {
        ({ normal, obj1Closest, obj2Closest } = getSphereCollisionDetails(
          obj1,
          obj2
        ));
      } else {
        ({ normal, obj1Closest, obj2Closest } = getSphereCuboidCollisionDetails(
          obj1,
          obj2
        ));
      }
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
