import * as THREE from "three";

import {
  normaliseVec,
  angleAxisToQuarternion,
  quaternionToAngleAxis,
  invertMatrix,
  rotationMatrixFromAxisAngle,
  multiplyMatrix,
  transpose3x3Matrix,
  multiplyConst,
  magnitude,
  multiplyVecMatrixVec,
  squaredDistanceFromOrigin,
} from "./vector";

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

function getInertiaMatrix(radius = 1, mass = 1) {
  const term = (2 / 5) * mass * radius ** 2;
  const inertiaMatrix = [
    [term, 0, 0],
    [0, term, 0],
    [0, 0, term],
  ];
  return inertiaMatrix;
}

function getInverseInertiaMatrix(radius = 1, mass = 1) {
  return invertMatrix(getInertiaMatrix(radius, mass));
}

export function createSphere(
  initPosition = [0, 0, 0],
  initVelocity = [0, 0, 0],
  mass = 1,
  radius = 0.25,
  restitution = 1.0,
  fixed = false,
  angularVelocity = 1,
  rotationAxis = normaliseVec([1, 1, 1])
) {
  function getBounds(obj) {
    return {
      x: obj.position[0],
      y: obj.position[1],
      z: obj.position[2],
      size: obj.radius,
    };
  }

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
    const IInv = getInverseInertiaMatrix(radius, mass);
    return IInv;
    // const { angle: totalAngle, axis: totalAxis } = getRotation(obj);
    // const R = rotationMatrixFromAxisAngle(totalAxis, totalAngle);
    // return multiplyMatrix(multiplyMatrix(transpose3x3Matrix(R), IInv), R);
  }

  function getNormalisedMassKineticEnergy(obj) {
    // set mass to 1
    const I = getInertiaMatrix(obj.radius, 1);
    // const { angle: totalAngle, axis: totalAxis } = getRotation(obj);
    // const R = rotationMatrixFromAxisAngle(totalAxis, totalAngle);
    // const rotatedI = multiplyMatrix(
    //   multiplyMatrix(transpose3x3Matrix(R), I),
    //   R
    // );

    const w = obj.angularVelocity;
    const rotationalE = 0.5 * multiplyVecMatrixVec(w, I, w);

    // ignore mass in this equation
    const translationalE = 0.5 * squaredDistanceFromOrigin(obj.velocity);
    return rotationalE + translationalE;
  }

  function getDampeningParameters() {
    const energyHighThresh = 10;
    const energyLowThresh = 0.07;
    const energyZeroThresh = 0.02;
    const highDampener = 0.99;
    const lowDampener = 0.9;

    return {
      energyHighThresh,
      energyLowThresh,
      energyZeroThresh,
      highDampener,
      lowDampener,
    };
  }

  return {
    shape: "sphere",
    mass: mass,
    position: initPosition,
    velocity: initVelocity,
    radius: radius,
    restitution: restitution,
    support: supportSphere,
    fixed,
    getBounds,
    angularVelocity: multiplyConst(rotationAxis, angularVelocity),
    angularRotation: [0, 0, 0],
    getInverseInertia,
    getRotation,
    getNormalisedMassKineticEnergy,
    centerForce: [0, 0, 0],
    getDampeningParameters,
  };
}

export function createTHREESphere(
  scene,
  color = 0xaf748d,
  initPosition = [0, 0, 0],
  initVelocity = [0, 0, 0],
  mass = 1,
  radius = 0.25,
  restitution = 1.0,
  fixed = false,
  angularVelocity = 0,
  rotationAxis = normaliseVec([1, 1, 1])
) {
  const geometrySphere = new THREE.SphereGeometry(radius);
  const texture = new THREE.TextureLoader().load(
    "https://i.imgur.com/EW7s2zy.jpeg"
  );
  // const texture = new THREE.TextureLoader().load("./ball-tex.jpg");
  const materialSphere = new THREE.MeshPhongMaterial({
    // color: color,
    // wireframe: true,
    map: texture,
  });

  const sphere = new THREE.Mesh(geometrySphere, materialSphere);
  scene.add(sphere);

  function updateTHREE(obj) {
    obj.sphere.position.x = obj.position[0];
    obj.sphere.position.y = obj.position[1];
    obj.sphere.position.z = obj.position[2];

    const { angle: totalAngle, axis: totalAxis } = obj.getRotation(obj);

    obj.sphere.setRotationFromAxisAngle(
      new THREE.Vector3(...totalAxis),
      totalAngle
    );
  }

  const obj = {
    sphere,
    updateTHREE,
    ...createSphere(
      initPosition,
      initVelocity,
      mass,
      radius,
      restitution,
      fixed,
      angularVelocity,
      rotationAxis
    ),
  };
  return obj;
}
