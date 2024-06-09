/*
Separating axis theorem
Adapted the implementation from
https://dyn4j.org/2010/01/sat/
Thank you William Bittle
*/

import {
  dotProduct,
  invertVector,
  subtractVectors,
  sameDirection,
} from "./vector";

function project(obj, axis) {
  const vertices = obj.getCuboidCorners(obj);
  let min = dotProduct(axis, vertices[0]);
  let max = min;
  for (let i = 1; i < vertices.length; i++) {
    const p = dotProduct(axis, vertices[i]);
    if (p < min) {
      min = p;
    } else if (p > max) {
      max = p;
    }
  }
  const projection = [min, max];
  return projection;
}

function btwn(low, test, high) {
  return low <= test && test <= high;
}

export function projectionsOverlap(p1, p2) {
  const [p1min, p1max] = p1;
  const [p2min, p2max] = p2;

  return (
    btwn(p2min, p1min, p2max) ||
    btwn(p2min, p1max, p2max) ||
    btwn(p1min, p2min, p1max) ||
    btwn(p1min, p2max, p1max)
  );
}

export function getOverlap(p1, p2) {
  const [p1min, p1max] = p1;
  const [p2min, p2max] = p2;

  if (btwn(p2min, p1min, p2max) && btwn(p2min, p1max, p2max)) {
    return p1max - p1min;
  } else if (btwn(p1min, p2min, p1max) && btwn(p1min, p2max, p1max)) {
    return p2max - p2min;
  } else if (btwn(p2min, p1min, p2max)) {
    return p2max - p1min;
  } else if (btwn(p2min, p1max, p2max)) {
    return p1max - p2min;
  }
  return 0;
}

export function sat(obj1, obj2) {
  let overlap = 9999999999; // really large value;
  let smallest;
  const obj1Axes = obj1.getOuterPlaneNormals(obj1);
  const obj2Axes = obj2.getOuterPlaneNormals(obj2);

  let smallestObjIndex;

  // loop over the axes1
  for (let i = 0; i < obj1Axes.length; i++) {
    let axis = obj1Axes[i];
    // project both shapes onto the axis
    const p1 = project(obj1, axis);
    const p2 = project(obj2, axis);

    // do the projections overlap?
    if (!projectionsOverlap(p1, p2)) {
      // then we can guarantee that the shapes do not overlap
      return { hasOverlap: false };
    } else {
      // get the overlap
      const o = getOverlap(p1, p2);
      // check for minimum
      if (o < overlap) {
        // then set this one as the smallest
        overlap = o;
        smallest = axis;
        smallestObjIndex = 0;
      }
    }
  }
  // loop over the axes2
  for (let i = 0; i < obj2Axes.length; i++) {
    let axis = obj2Axes[i];
    // project both shapes onto the axis
    const p1 = project(obj1, axis);
    const p2 = project(obj2, axis);

    // do the projections overlap?
    if (!projectionsOverlap(p1, p2)) {
      // then we can guarantee that the shapes do not overlap
      return { hasOverlap: false };
    } else {
      // get the overlap
      const o = getOverlap(p1, p2);
      // check for minimum
      if (o < overlap) {
        // then set this one as the smallest
        overlap = o;
        smallest = axis;
        smallestObjIndex = 1;
      }
    }
  }

  // TODO: https://media.steampowered.com/apps/valve/2015/DirkGregorius_Contacts.pdf
  // We need to test the cross product between all edge combinations of A and B

  if (!sameDirection(smallest, subtractVectors(obj2.position, obj1.position))) {
    smallest = invertVector(smallest);
  }

  // minimum translation vector
  // if we get here then we know that every axis had overlap on it
  // so we can guarantee an intersection
  const mtv = {
    direction: smallest,
    overlapDist: overlap,
    hasOverlap: true,
    smallestObjIndex,
  };
  return mtv;
}
