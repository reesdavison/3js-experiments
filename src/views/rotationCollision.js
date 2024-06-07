import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { gjkIntersection, resolveCollision } from "../library/collision.js";
import { createTHREEBox } from "../library/box.js";
import { createTHREESphere } from "../library/sphere.js";
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
import { OctreeNode } from "../library/octree.js";
import { invertVector } from "../library/vector.js";

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

const objectMass = 10;

const bottomPlane = createTHREEBox(
  scene,
  0x456e4e,
  10,
  10,
  0.2,
  [0, -0.1, 0],
  [0, 0, 0],
  [1, 0, 0],
  Math.PI / 2,
  objectMass ** 10,
  true
);

const leftPlane = createTHREEBox(
  scene,
  0x456e4e,
  5,
  5,
  0.2,
  [-2.5, 2.5, 0],
  [0, 0, 0],
  [0, 1, 0],
  Math.PI / 2,
  objectMass ** 10,
  true
);

const boxLen = 0.75;

// const movableBox1 = createTHREEBox(
//   scene,
//   0x446df6,
//   boxLen,
//   boxLen,
//   boxLen,
//   [-1, 1.5, 0],
//   [2, 0, 0],
//   [0, 1, 0],
//   Math.PI / 2,
//   objectMass,
//   false,
//   1,
//   [0, 1, 0]
// );

// const movableBox2 = createTHREEBox(
//   scene,
//   0x446df6,
//   boxLen,
//   boxLen,
//   boxLen,
//   [2, 1.2, 0],
//   [-2, 0, 0],
//   [0, 1, 0],
//   Math.PI / 2,
//   objectMass,
//   false,
//   1,
//   normaliseVec([1, 1, 0])
// );

// const movableBox3 = createTHREEBox(
//   scene,
//   0x446df6,
//   boxLen,
//   boxLen,
//   boxLen,
//   [1, 2, 0],
//   [1, -1, 0],
//   [0, 1, 0],
//   Math.PI / 2,
//   objectMass,
//   false,
//   2,
//   [0.5, 0, 0.5]
// );

const movableBox4 = createTHREEBox(
  scene,
  0x446df6,
  boxLen,
  boxLen,
  boxLen,
  [2, boxLen / 2, -3],
  [0, 0, 0],
  [0, 1, 0],
  0,
  objectMass,
  false,
  0,
  [0.5, 0, 0.5]
);

// const cuboid1 = createTHREEBox(
//   scene,
//   0x446df6,
//   10,
//   0.5,
//   10,
//   [0, -0.25, 0],
//   [0, 0, 0],
//   [0, 1, 0],
//   0,
//   10 ** 10,
//   true
// );
// const cuboid2 = createTHREEBox(scene, 0x446df6, 1, 1, 1, [0, 0.51, 0]);

let time = 0;

const allObjects = [
  // cuboid1,
  // cuboid2,
  // movableBox1,
  // movableBox2,
  // movableBox3,
  movableBox4,
  bottomPlane,
  leftPlane,
];

const movableObjects = allObjects.filter((obj) => !obj.fixed);

const arrowObj1 = createArrow([0, 0, 0], [0, 0, 0], scene);
const arrowObj2 = createArrow([0, 0, 0], [0, 0, 0], scene);

function resolveAllCollisionsOctree() {
  const frameOctree = new OctreeNode(
    { x: 0, y: 0, z: 0, size: 20 },
    gjkIntersection,
    0,
    4
  );
  for (let i = 0; i < allObjects.length; i++) {
    frameOctree.insert(allObjects[i]);
  }
  const { collisions, numChecks } = frameOctree.checkCollisions();
  for (let i = 0; i < collisions.length; i++) {
    console.log("collision");
    resolveCollision(collisions[i]);
    const col = collisions[i];
    updateArrow(arrowObj1, col.normal, col.obj1Closest);
    updateArrow(arrowObj2, invertVector(col.normal), col.obj2Closest);
  }
  // console.log("Num checks ", numChecks);
}

function resolveAllCollisions() {
  // let numChecks = 0;
  if (allObjects.length >= 2) {
    for (let i = 1; i < allObjects.length; i++) {
      for (let j = 0; j < i; j++) {
        const objI = allObjects[i];
        const objJ = allObjects[j];
        if (objI.fixed && objJ.fixed) {
          continue;
        }
        const collision = gjkIntersection(objI, objJ);
        // numChecks++;
        const { collide } = collision;
        if (collide) {
          resolveCollision(collision);
        }
      }
    }
  }
  // console.log("NUM CHECKS ", numChecks);
}

function animate() {
  requestAnimationFrame(animate);

  // only other external forces
  movableObjects.forEach((obj) => {
    obj.centerForce = getGravityForce(obj);
  });

  resolveAllCollisionsOctree();

  movableObjects.forEach((obj) => {
    eulerStep(obj);
  });
  // movableObjects.forEach((obj) => {
  //   eulerStep([0, 0, 0], obj);
  // });

  movableObjects.forEach((obj) => {
    obj.updateTHREE(obj);
  });

  renderer.render(scene, camera);
  time += TIME_STEP;

  // // reset contact force
  // movableObjects.forEach((obj) => {
  //   obj.centerForce = [0, 0, 0];
  // });
}

import WebGL from "three/addons/capabilities/WebGL.js";
import { normaliseVec } from "../library/vector.js";

if (WebGL.isWebGLAvailable()) {
  // Initiate function or other initializations here
  animate();
} else {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}
