import * as THREE from "three";

export function getGravityForce(obj, g = 9.80665) {
  if (!obj.mass) {
    throw new Error("Expect object to have mass");
  }
  return [0, -obj.mass * g, 0];
}

export function createHelperGrid(scene) {
  const size = 10;
  const divisions = 10;
  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);
}

export function setupCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.translateY(1);
  camera.translateZ(5);
  return camera;
}

export function createArrow(newDir, newOrigin, scene) {
  const dir = new THREE.Vector3(...newDir);
  dir.normalize();
  const origin = new THREE.Vector3(...newOrigin);
  const length = 2;
  const hex = 0x00635d;
  const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
  scene.add(arrowHelper);
  return arrowHelper;
}

export function updateArrow(arrowObj, direction, position) {
  arrowObj.position.x = position[0];
  arrowObj.position.y = position[1];
  arrowObj.position.z = position[2];
  arrowObj.setDirection(new THREE.Vector3(...direction).normalize());
  arrowObj.setLength(2);
}

/*
Min and max are inclusive
*/
export function getRandomInt(min, max) {
  const range = max - min;
  return Math.floor(Math.random() * range + min);
}

export function getRandomFloat(min, max) {
  const range = max - min;
  return Math.random() * range + min;
}

export function sum(array) {
  if (typeof array[0] === "number") {
    return array.reduce((partialSum, cur) => partialSum + cur, 0);
  } else if (typeof array[0] === "boolean") {
    return array.reduce(
      (partialSum, cur) => (cur ? partialSum + 1 : partialSum),
      0
    );
  }
  throw new Error("Unexpected type of array");
}

/*
Bit mask is just a javascript Number here, 
but we're just treating it as bits.

In case you're wondering:
Javascript stores numbers as 64 bits floating point numbers, but all bitwise operations are performed on 32 bits binary numbers.
Before a bitwise operation is performed, Javascript converts numbers to 32 bits signed integers.
After the bitwise operation is performed, the result is converted back to 64 bits Javascript numbers.
*/
export function setBitMaskPos(bitmask, pos) {
  return bitmask | (1 << pos);
}

export function testBitMaskPos(bitmask, pos) {
  return (bitmask & (1 << pos)) !== 0;
}

/*
point conversion functions
*/
export function arrayPointToXYZ(arrayPoint) {
  return { x: arrayPoint[0], y: arrayPoint[1], z: arrayPoint[2] };
}

export function XYZPointToArray(xyzPointObject) {
  return [xyzPointObject.x, xyzPointObject.y, xyzPointObject.z];
}
