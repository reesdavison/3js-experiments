import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { G } from "../library/constants";
import { setupCamera } from "../library/helpers";
import { eulerStep } from "../library/simulate";
import { createArrow, updateArrow } from "../library/helpers";
import { TIME_STEP } from "../library/constants";
import { addVectors } from "../library/vector";
import { createSphere } from "../library/sphere";

// 3js setup + camera + light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbdbcc);

const camera = setupCamera();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 10); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
scene.add(directionalLight);

camera.position.z = 5;

function getForce(obj1, obj2) {
  let u_ab0 = obj2.position[0] - obj1.position[0];
  let u_ab1 = obj2.position[1] - obj1.position[1];
  let u_ab2 = obj2.position[2] - obj2.position[2];
  const r_squared = u_ab0 ** 2 + u_ab1 ** 2 + u_ab2 ** 2;
  const u_norm = Math.sqrt(r_squared);
  u_ab0 = u_ab0 / u_norm;
  u_ab1 = u_ab1 / u_norm;
  u_ab2 = u_ab2 / u_norm;

  const force_mag = (G * obj1.mass * obj2.mass) / r_squared;

  return [force_mag * u_ab0, force_mag * u_ab1, force_mag * u_ab2];
}

const sphere1 = createSphere(scene, [0, 0, 0], [0, 0, 0], 10 ** 11, 0xaf748d);
const sphere2 = createSphere(scene, [2, 0, 0], [0, 1, 0], 10 ** 3, 0x446df6);
const sphere3 = createSphere(scene, [-2, 0, 0], [0, -1, 0], 10 ** 3, 0x446df6);
const forceArrow1 = createArrow([0, 0, 0], [0, 0, 0], scene);
const forceArrow3 = createArrow([0, 0, 0], [0, 0, 0], scene);

let time = 0;

function animate() {
  requestAnimationFrame(animate);

  const forceOnSphere1 = addVectors(
    getForce(sphere1, sphere2),
    getForce(sphere1, sphere3)
  );
  const forceOnSphere2 = addVectors(
    getForce(sphere2, sphere1),
    getForce(sphere2, sphere3)
  );
  const forceOnSphere3 = addVectors(
    getForce(sphere3, sphere1),
    getForce(sphere3, sphere2)
  );

  eulerStep(forceOnSphere1, sphere1);
  eulerStep(forceOnSphere2, sphere2);
  eulerStep(forceOnSphere3, sphere3);

  updateArrow(forceArrow1, forceOnSphere2, sphere2.position);
  updateArrow(forceArrow3, forceOnSphere3, sphere3.position);

  sphere1.updatePosition(sphere1);
  sphere2.updatePosition(sphere2);
  sphere3.updatePosition(sphere3);

  renderer.render(scene, camera);
  time += TIME_STEP;
}

import WebGL from "three/addons/capabilities/WebGL.js";

if (WebGL.isWebGLAvailable()) {
  // Initiate function or other initializations here
  animate();
} else {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}
