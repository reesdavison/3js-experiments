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
