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
import { OctreeNode } from "../library/octree.js";

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
  10 ** 3, // high mass to make immovable in collision resolution
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
  10 ** 3, // 999999, // high mass to make immovable in collision resolution
  0x456e4e,
  true
);

const boxLen = 0.75;

const movableBox1 = createBox(
  scene,
  boxLen,
  boxLen,
  [-1, 1.5, 0],
  [2, 0, 0],
  [0, 1, 0],
  Math.PI / 2,
  boxLen,
  10 ** 3,
  0x446df6,
  false
);

const movableBox2 = createBox(
  scene,
  boxLen,
  boxLen,
  [2, 1.2, 0],
  [-2, 0, 0],
  [0, 1, 0],
  Math.PI / 2,
  boxLen,
  10 ** 3,
  0x446df6,
  false
);

const movableBox3 = createBox(
  scene,
  boxLen,
  boxLen,
  [1, 2, 0],
  [1, -1, 0],
  [0, 1, 0],
  Math.PI / 2,
  boxLen,
  10 ** 3,
  0x446df6,
  false
);

let time = 0;

const allObjects = [
  movableBox1,
  movableBox2,
  movableBox3,
  bottomPlane,
  leftPlane,
];

const movableObjects = allObjects.filter((obj) => !obj.fixed);

const arrowObj = createArrow([0, 0, 0], [0, 0, 0], scene);

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
    updateArrow(arrowObj, col.normal, col.obj1.position);
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

  resolveAllCollisionsOctree();

  movableObjects.forEach((obj) => {
    eulerStep(getGravityForce(obj), obj);
  });
  // movableObjects.forEach((obj) => {
  //   eulerStep([0, 0, 0], obj);
  // });

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
