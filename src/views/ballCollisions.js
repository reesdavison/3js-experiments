import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { createSphere } from "../library/sphere.js";

import { gjkIntersection, resolveCollision } from "../library/collision.js";
import { G } from "../library/constants.js";
import { createArrow, updateArrow } from "../library/helpers.js";
import { eulerStep } from "../library/simulate.js";

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

const sphere1 = createSphere(
  scene,
  [-2, -2, 0],
  [1, 1, 0],
  10 ** 3, // mass
  0x446df6,
  0.75,
  0.8
);
const sphere2 = createSphere(
  scene,
  [2, -2, 0],
  [-1, 1, 0],
  10 ** 3, // mass
  0x446df6,
  0.75,
  0.8
);

const normalArrow = createArrow([90, 90, 90], [90, 90, 90], scene);

const TIME_STEP = 0.01;
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  const collision = gjkIntersection(sphere1, sphere2);
  const { collide, normal: collideNormal } = collision;

  if (collide) {
    updateArrow(normalArrow, collideNormal, sphere1.position);
    resolveCollision(collision);
  }

  eulerStep([0, 0, 0], sphere1);
  eulerStep([0, 0, 0], sphere2);

  sphere1.updatePosition(sphere1);
  sphere2.updatePosition(sphere2);

  renderer.render(scene, camera);
  time += TIME_STEP;
}

import WebGL from "three/addons/capabilities/WebGL.js";
import { setupCamera } from "../library/helpers.js";

if (WebGL.isWebGLAvailable()) {
  // Initiate function or other initializations here
  animate();
} else {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}
