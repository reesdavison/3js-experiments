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
  const length = 1;
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
