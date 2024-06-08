import * as THREE from "three";

import {
  rotateVectorArray,
  addVectors,
  subtractVectors,
  crossProduct,
  normaliseVec,
  dotProduct,
  angleAxisToQuarternion,
  quaternionToAngleAxis,
  invertMatrix,
  rotationMatrixFromAxisAngle,
  multiplyMatrix,
  transpose3x3Matrix,
  multiplyConst,
  magnitude,
} from "./vector";
import { zeroMatrix } from "./constants";

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

export function getCornerIndicesForPlaneIndex(planeIndex) {
  // return anticlockwise
  const planeIndices = [
    [1, 0, 3, 6],
    [6, 7, 4, 1],
    [3, 0, 2, 5],
    [4, 7, 5, 2],
    [6, 3, 5, 7],
    [1, 4, 2, 0],
  ];
  return planeIndices[planeIndex];
}

export function getInverseInertiaMatrix(
  width = 1,
  height = 1,
  depth = 1,
  mass = 1
) {
  const C = mass / 12;
  const inertiaMatrix = [
    [C * height ** 2 + depth ** 2, 0, 0],
    [0, C * width ** 2 + depth ** 2, 0],
    [0, 0, C * width ** 2 + height ** 2],
  ];
  return invertMatrix(inertiaMatrix);
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

  const corners = obj.getCuboidCorners(obj);

  // We could use a heap for this but we'd need our own implementation
  // Max size 8 so unlikely to be a huge gain from the effort
  const sortedDP = corners
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
  const result = sortedDP.slice(0, k).map((res) => corners[res.index]);
  return result;
}

export function createBox(
  width = 1,
  height = 1,
  depth = 0.1,
  position = [0, 0, 0],
  velocity = [0, 0, 0],
  initPosRotationAxis = [1, 0, 0],
  initPosRotationRadians = 0,
  mass = 1,
  fixed = false,
  angularVelocity = 1,
  rotationAxis = normaliseVec([1, 1, 1])
) {
  const size = Math.max(width, height, depth);

  function getBounds(obj) {
    return {
      x: obj.position[0],
      y: obj.position[1],
      z: obj.position[2],
      size: size,
    };
  }

  // function updateCuboidCorners(obj, rotationAxis, rotationRadians) {
  //   return getCuboidCorners(
  //     width,
  //     height,
  //     depth,
  //     obj.position,
  //     rotationAxis,
  //     rotationRadians
  //   );
  // }

  function getRotation(obj) {
    const angularRotationMag = magnitude(obj.angularRotation);
    const quaternion = angleAxisToQuarternion(
      normaliseVec(obj.angularRotation),
      angularRotationMag
    );
    // quaternion = hamiltonianProduct(quaternion, rotationQuaternion);
    return quaternionToAngleAxis(quaternion);
  }

  function getInverseInertia(obj) {
    if (obj.fixed) {
      return zeroMatrix;
    }
    const IInv = getInverseInertiaMatrix(width, height, depth, mass);
    const { angle: totalAngle, axis: totalAxis } = getRotation(obj);
    const R = rotationMatrixFromAxisAngle(totalAxis, totalAngle);
    return multiplyMatrix(multiplyMatrix(transpose3x3Matrix(R), IInv), R);
  }

  function getOuterPlaneNormals(obj) {
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
    const corners = obj.getCuboidCorners(obj);
    // const { angle, axis } = getRotation(obj);

    // 0->1 = subtract(1, 0)
    let top = normaliseVec(
      crossProduct(
        subtractVectors(corners[3], corners[0]),
        subtractVectors(corners[1], corners[0])
      )
    );
    let left = normaliseVec(
      crossProduct(
        subtractVectors(corners[1], corners[4]),
        subtractVectors(corners[7], corners[4])
      )
    );
    let right = normaliseVec(
      crossProduct(
        subtractVectors(corners[5], corners[2]),
        subtractVectors(corners[0], corners[2])
      )
    );
    let bottom = normaliseVec(
      crossProduct(
        subtractVectors(corners[4], corners[2]),
        subtractVectors(corners[5], corners[2])
      )
    );
    let back = normaliseVec(
      crossProduct(
        subtractVectors(corners[7], corners[5]),
        subtractVectors(corners[3], corners[5])
      )
    );
    let forward = normaliseVec(
      crossProduct(
        subtractVectors(corners[0], corners[2]),
        subtractVectors(corners[4], corners[2])
      )
    );

    return [top, left, right, bottom, back, forward];
  }

  function getConnectedVerticesIndex(index) {
    // return anticlockwise
    switch (index) {
      case 0:
        return [3, 1, 2];
      case 1:
        return [6, 4, 0];
      case 2:
        return [5, 0, 4];
      case 3:
        return [6, 0, 5];
      case 4:
        return [7, 2, 1];
      case 5:
        return [3, 2, 7];
      case 6:
        return [3, 7, 1];
      case 7:
        return [4, 6, 5];
    }
  }

  function getCuboidCorners(obj) {
    const { width, height, depth, position } = obj;

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
    const { angle, axis } = getRotation(obj);
    corners = rotateVectorArray(corners, axis, angle);
    corners = corners.map((vec) => addVectors(vec, position));
    return corners;
  }

  return {
    shape: "box",
    width,
    height,
    depth,
    position,
    velocity,
    support: supportCuboid,
    mass,
    fixed,
    angularVelocity: multiplyConst(rotationAxis, angularVelocity),
    angularRotation: multiplyConst(initPosRotationAxis, initPosRotationRadians),
    getInverseInertia,
    getCuboidCorners,
    getBounds,
    getCornerIndicesForPlane,
    getOuterPlaneNormals,
    getConnectedVerticesIndex,
    getRotation,
    centerForce: [0, 0, 0],
  };
}

export function createTHREEBox(
  scene,
  color = 0xb7c9bc,
  width = 1,
  height = 1,
  depth = 0.1,
  position = [0, 0, 0],
  velocity = [0, 0, 0],
  initPosRotationAxis = [1, 0, 0],
  initPosRotationRadians = 0,
  mass = 1,
  fixed = false,
  angularVelocity = 0,
  rotationAxis = normaliseVec([1, 1, 1])
) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({
    color,
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  plane.setRotationFromAxisAngle(
    new THREE.Vector3(...initPosRotationAxis),
    initPosRotationRadians
  );
  plane.position.x = position[0];
  plane.position.y = position[1];
  plane.position.z = position[2];

  function updateTHREE(obj) {
    obj.plane.position.x = obj.position[0];
    obj.plane.position.y = obj.position[1];
    obj.plane.position.z = obj.position[2];

    const { angle: totalAngle, axis: totalAxis } = obj.getRotation(obj);

    obj.plane.setRotationFromAxisAngle(
      new THREE.Vector3(...totalAxis),
      totalAngle
    );

    const corners = obj.getCuboidCorners(obj);
    obj.helperCorners.forEach((sphere, i) => {
      sphere.position.x = corners[i][0];
      sphere.position.y = corners[i][1];
      sphere.position.z = corners[i][2];
    });
  }

  const obj = {
    plane,
    updateTHREE,
    ...createBox(
      width,
      height,
      depth,
      position,
      velocity,
      initPosRotationAxis,
      initPosRotationRadians,
      mass,
      fixed,
      angularVelocity,
      rotationAxis
    ),
  };

  const corners = obj.getCuboidCorners(obj);
  const helperCorners = [];
  corners.forEach((vec) => {
    const geometrySphere = new THREE.SphereGeometry(0.03);
    const materialSphere = new THREE.MeshPhongMaterial({
      color: 0xdc143c,
    });
    const sphere = new THREE.Mesh(geometrySphere, materialSphere);
    scene.add(sphere);
    sphere.position.x = vec[0];
    sphere.position.y = vec[1];
    sphere.position.z = vec[2];
    helperCorners.push(sphere);
  });
  obj.helperCorners = helperCorners;

  return obj;
}
