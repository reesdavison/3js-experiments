import * as THREE from "three";

import { normaliseVec } from "./vector";

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

export function createSphere(
  scene,
  initPosition = [0, 0, 0],
  initVelocity = [0, 0, 0],
  mass = 1,
  color = 0xaf748d,
  radius = 0.25,
  restitution = 1.0,
  fixed = false
) {
  const geometrySphere = new THREE.SphereGeometry(radius);
  const materialSphere = new THREE.MeshPhongMaterial({
    color: color,
  });
  const sphere = new THREE.Mesh(geometrySphere, materialSphere);
  scene.add(sphere);

  function updatePosition(obj) {
    obj.sphere.position.x = obj.position[0];
    obj.sphere.position.y = obj.position[1];
    obj.sphere.position.z = obj.position[2];
  }

  function getBounds(obj) {
    return {
      x: obj.position[0],
      y: obj.position[1],
      z: obj.position[2],
      size: obj.radius,
    };
  }

  return {
    sphere: sphere,
    mass: mass,
    position: initPosition,
    velocity: initVelocity,
    radius: radius,
    restitution: restitution,
    support: supportSphere,
    fixed,
    updatePosition,
    getBounds,
  };
}
