import * as THREE from "three";

import {
  rotateVectorArray,
  addVectors,
  subtractVectors,
  crossProduct,
  normaliseVec,
  dotProduct,
} from "./vector";

export function getCuboidCorners(
  width = 1,
  height = 1,
  depth = 1,
  position = [0, 0, 0],
  rotationAxis = [1, 0, 0],
  rotationRadians = 0
) {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;

  /*
      .6------3
    .' |    .'|
   1---+--0'  |
   |   |  |   |
   |  .7--+---5
   |.'    | .'  
   4------2'
  */
  let corners = [
    [w, h, d], // 0
    [-w, h, d], // 1
    [w, -h, d], // 2
    [w, h, -d], // 3
    [-w, -h, d], // 4
    [w, -h, -d], // 5
    [-w, h, -d], // 6
    [-w, -h, -d], // 7
  ];
  corners = rotateVectorArray(corners, rotationAxis, rotationRadians);
  corners = corners.map((vec) => addVectors(vec, position));
  return corners;
}

export function getOuterPlaneNormals(corners) {
  /*
  Assume dealing with this cube

      .6------3
    .' |    .'|
   1---+--0'  |
   |   |  |   |
   |  .7--+---5
   |.'    | .'  
   4------2'
  */

  // 0->1 = subtract(1, 0)
  const top = crossProduct(
    subtractVectors(corners[3], corners[0]),
    subtractVectors(corners[1], corners[0])
  );
  const left = crossProduct(
    subtractVectors(corners[1], corners[4]),
    subtractVectors(corners[7], corners[4])
  );
  const right = crossProduct(
    subtractVectors(corners[5], corners[2]),
    subtractVectors(corners[0], corners[2])
  );
  const bottom = crossProduct(
    subtractVectors(corners[4], corners[2]),
    subtractVectors(corners[5], corners[2])
  );
  const back = crossProduct(
    subtractVectors(corners[7], corners[5]),
    subtractVectors(corners[3], corners[5])
  );
  const forward = crossProduct(
    subtractVectors(corners[0], corners[2]),
    subtractVectors(corners[4], corners[2])
  );

  return {
    top,
    left,
    right,
    bottom,
    back,
    forward,
  };
}

export function getCornerIndicesForPlane(plane) {
  // return anticlockwise
  switch (plane) {
    case "top":
      return [1, 0, 3, 6];
    case "left":
      return [6, 7, 4, 1];
    case "right":
      return [3, 0, 2, 5];
    case "bottom":
      return [4, 7, 5, 2];
    case "back":
      return [6, 3, 5, 7];
    case "forward":
      return [1, 4, 2, 0];
  }
}

function updatePosition(obj) {
  obj.plane.position.x = obj.position[0];
  obj.plane.position.y = obj.position[1];
  obj.plane.position.z = obj.position[2];
}

export function supportCuboid(obj, direction) {
  return supportCuboidTopK(obj, direction, 1)[0];
}

/*
A support function takes a direction vector and returns the point on the shape farthest along that direction.
This one returns the N closest.
*/
export function supportCuboidTopK(obj, direction, k) {
  const normDirection = normaliseVec(direction);

  // all needs to be calculated relative to center of cuboid
  const center = obj.position;

  // We could use a heap for this but we'd need our own implementation
  // Max size 8 so unlikely to be a huge gain from the effort
  const sortedDP = obj.corners
    .map((vec, index) => {
      const toCornerVector = subtractVectors(vec, center);
      const dp = dotProduct(toCornerVector, normDirection);
      return {
        dp,
        index,
      };
    })
    .sort((a, b) => b.dp - a.dp);
  // we need to use the vector from the origin not the center
  const result = sortedDP.slice(0, k).map((res) => obj.corners[res.index]);
  return result;
}

export function createBox(
  scene,
  width = 1,
  height = 1,
  position = [0, 0, 0],
  velocity = [0, 0, 0],
  rotationAxis = [1, 0, 0],
  rotationRadians = 0,
  thickness = 0.1,
  mass = 1,
  color = 0xb7c9bc,
  fixed = false
) {
  const geometry = new THREE.BoxGeometry(width, height, thickness);
  const material = new THREE.MeshPhongMaterial({
    color,
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  plane.setRotationFromAxisAngle(
    new THREE.Vector3(...rotationAxis),
    rotationRadians
  );
  plane.position.x = position[0];
  plane.position.y = position[1];
  plane.position.z = position[2];

  return {
    plane,
    corners: getCuboidCorners(
      width,
      height,
      thickness,
      position,
      rotationAxis,
      rotationRadians
    ),
    support: supportCuboid,
    position,
    velocity,
    mass,
    fixed,
    updatePosition,
    getOuterPlaneNormals,
    getCornerIndicesForPlane,
  };
}