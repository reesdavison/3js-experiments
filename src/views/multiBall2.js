import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { gjkIntersection, resolveCollision } from "../library/collision.js";
import { createBox } from "../library/box.js";
import { createSphere } from "../library/sphere.js";
import {
  createHelperGrid,
  getGravityForce,
  setupCamera,
  createArrow,
  updateArrow,
  getRandomFloat,
  getRandomInt,
} from "../library/helpers.js";
import { eulerStep } from "../library/simulate.js";
import { TIME_STEP } from "../library/constants.js";

// 3js setup + camera + light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbdbcc);

const camera = setupCamera();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 5); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
scene.add(directionalLight);

createHelperGrid(scene);

const bottomPlane = createBox(
  scene,
  10,
  10,
  [0, 0, 0],
  [0, 0, 0],
  [1, 0, 0],
  Math.PI / 2,
  0.2,
  999999, // high mass to make immovable in collision resolution
  0x456e4e,
  true
);

const leftPlane = createBox(
  scene,
  5,
  5,
  [-2.5, 2.5, 0],
  [0, 0, 0],
  [0, 1, 0],
  Math.PI / 2,
  0.2,
  999999, // high mass to make immovable in collision resolution
  0x456e4e,
  true
);

// const movableBox = createBox(
//   scene,
//   0.5,
//   0.5,
//   [2, 4, 0],
//   [-1, 0, 0],
//   [0, 1, 0],
//   Math.PI / 2,
//   0.5,
//   10 ** 3,
//   0x446df6,
//   false
// );

// const sphere1 = createSphere(
//   scene,
//   [-2, 1.5, 0],
//   [2, 0, 0],
//   10 ** 3, // mass
//   0x446df6,
//   0.4,
//   0.8,
//   false
// );
// const sphere2 = createSphere(
//   scene,
//   [2, 1.2, 0],
//   [-2, 0, 0],
//   10 ** 3, // mass
//   0x446df6,
//   0.4,
//   0.8,
//   false
// );

// const sphere3 = createSphere(
//   scene,
//   [-2, 2, 0],
//   [1, -1, 0],
//   10 ** 3,
//   0x446df6,
//   0.4,
//   0.8,
//   false
// );

const randomSpheres = [];

const NBalls = 200;

for (let i = 0; i < NBalls; ++i) {
  randomSpheres.push(
    createSphere(
      scene,
      [getRandomInt(-5, 5), getRandomInt(2, 7), getRandomInt(-5, 5)],
      [getRandomFloat(-3, 3), getRandomFloat(-3, 3), 0],
      10 ** 3,
      0x446df6,
      0.2,
      0.8,
      false
    )
  );
}

let time = 0;

const allObjects = [...randomSpheres, bottomPlane, leftPlane];

const movableObjects = allObjects.filter((obj) => !obj.fixed);

function resolveAllCollisions() {
  for (let i = 0; i < allObjects.length; i++) {
    for (let j = 0; j < allObjects.length; j++) {
      if (i !== j) {
        const objI = allObjects[i];
        const objJ = allObjects[j];
        if (objI.fixed && objJ.fixed) {
          continue;
        }
        const collision = gjkIntersection(objI, objJ);
        const { collide, normal: collideNormal } = collision;
        if (collide) {
          resolveCollision(collision, objI, objJ);
        }
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  resolveAllCollisions();

  movableObjects.forEach((obj) => {
    eulerStep(getGravityForce(obj), obj);
  });

  movableObjects.forEach((obj) => {
    obj.updatePosition(obj);
  });

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
