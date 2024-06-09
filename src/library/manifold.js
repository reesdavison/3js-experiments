/*
Adapted from the great tutorial in
https://dyn4j.org/2011/11/contact-points-using-clipping/
Thank you William Bittle
*/
import {
  invertVector,
  subtractVectors,
  dotProduct,
  multiplyConst,
  normaliseVec,
  addVectors,
} from "./vector";
import { getCornerIndicesForPlaneIndex } from "./box";

export function bestPlane(obj, normal) {
  const norms = obj.getOuterPlaneNormals(obj);

  let max = 0;
  let planeIndex;
  let bestNorm;

  for (let i = 0; i < norms.length; i++) {
    const projection = dotProduct(normal, norms[i]);
    if (projection > max) {
      max = projection;
      planeIndex = i;
      bestNorm = norms[i];
    }
  }
  return { planeIndex, bestNorm };
}

function clip(clippedPoints, n, o) {
  // clippedPoints is an array of vectors
  // n is the direction we're clipping in
  // o is the projection of the reference vertex on the clipping direction

  const numPoints = clippedPoints.length;

  const keepClippedPoints = [];
  const D = clippedPoints.map((v) => dotProduct(v, n) - o);

  // maintain clippedPoints anticlockwise point direction
  for (let i = 0; i < numPoints; i++) {
    // keep any points past the reference projection
    if (D[i] >= 0.0) {
      keepClippedPoints.push(clippedPoints[i]);
    }
    // find the intersection for the new point if it crosses reference projection.
    const j = (i + 1) % numPoints;
    if (D[i] * D[j] < 0.0) {
      const e = subtractVectors(clippedPoints[j], clippedPoints[i]);
      const u = D[i] / (D[i] - D[j]);
      const newPoint = addVectors(clippedPoints[i], multiplyConst(e, u));
      keepClippedPoints.push(newPoint);
    }
  }
  return keepClippedPoints;
}

export function getContactManifold(obj1, obj2, normal) {
  const { planeIndex: obj1BestPlaneIndex, bestNorm: obj1BestNorm } = bestPlane(
    obj1,
    normal
  );
  const { planeIndex: obj2BestPlaneIndex, bestNorm: obj2BestNorm } = bestPlane(
    obj2,
    invertVector(normal)
  );

  // reference and incident

  // the reference plane is the one which is most perpendicular to the separation norm
  // therefore the largest abs dot product of the plane, ie the plane norm most parallel
  // will be our reference
  let ref, inc;
  let refPlaneIndex, incPlaneIndex;
  let refNorm, incNorm;
  let flip = false;

  if (
    Math.abs(dotProduct(obj1BestNorm, normal)) >=
    Math.abs(dotProduct(obj2BestNorm, normal))
  ) {
    ref = obj1;
    inc = obj2;
    refPlaneIndex = obj1BestPlaneIndex;
    incPlaneIndex = obj2BestPlaneIndex;
    refNorm = obj1BestNorm;
    incNorm = obj2BestNorm;
  } else {
    ref = obj2;
    inc = obj1;
    refPlaneIndex = obj2BestPlaneIndex;
    incPlaneIndex = obj1BestPlaneIndex;
    refNorm = obj2BestNorm;
    incNorm = obj1BestNorm;
    // we need to set a flag indicating that the reference
    // and incident edge were flipped so that when we do the final
    // clip operation, we use the right edge normal
    flip = true;
  }

  const refVertices = ref.getCuboidCorners(ref);
  // these are returned anticlockwise
  const refIndices = getCornerIndicesForPlaneIndex(refPlaneIndex);
  const refPlaneVx = refIndices.map((index) => refVertices[index]);
  const refV1 = normaliseVec(subtractVectors(refPlaneVx[2], refPlaneVx[1]));
  const refV2 = normaliseVec(subtractVectors(refPlaneVx[0], refPlaneVx[1]));

  const incVertices = inc.getCuboidCorners(inc);
  // these are returned anticlockwise
  const incIndices = getCornerIndicesForPlaneIndex(incPlaneIndex);
  const incPlaneVx = incIndices.map((index) => incVertices[index]);

  // all incident points are included at first
  let clippedPoints = [...incPlaneVx];

  // clip the incident edge by the first
  // vertex of the reference edge
  const o1 = dotProduct(refV1, refPlaneVx[1]);
  clippedPoints = clip(clippedPoints, refV1, o1);
  if (clippedPoints.length < 2) return; // TODO check this

  // clip whats left of the incident edge by the
  // second vertex of the reference edge
  // but we need to clip in the opposite direction
  // so we flip the direction and offset
  const o2 = dotProduct(refV1, refPlaneVx[2]);
  clippedPoints = clip(clippedPoints, invertVector(refV1), -o2);
  if (clippedPoints.length < 2) return;

  // repeat for refV2 ie the second edge we're looking at
  const o3 = dotProduct(refV2, refPlaneVx[1]);
  clippedPoints = clip(clippedPoints, refV2, o3);
  if (clippedPoints.length < 2) return;

  const o4 = dotProduct(refV2, refPlaneVx[0]);
  clippedPoints = clip(clippedPoints, invertVector(refV2), -o4);
  if (clippedPoints.length < 2) return;

  let invRefNorm = invertVector(refNorm);

  if (flip) {
    invRefNorm = invertVector(invRefNorm);
  }

  const refMax1 = refPlaneVx[0];

  const max = dotProduct(invRefNorm, refMax1);
  // This commented out code is because I thought max1 and max2 should always
  // be roughly the same, and couldnt work out why it wouldn't be so wanted to check
  // const refMax2 = refPlaneVx[1];
  // const max2 = dotProduct(invRefNorm, refMax2);
  // if (max != max2) {
  //   throw new Error("I dont understand");
  // }

  // const newClippedPoints = [];
  clippedPoints = clippedPoints.filter(
    (cp) => dotProduct(invRefNorm, cp) - max >= 0.0
  );

  return clippedPoints;
}
