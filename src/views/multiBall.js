import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { gjkIntersection, resolveCollision } from "../library/collision.js";
import { createBox } from "../library/box.js";
import { createSphere } from "../library/sphere.js";
import { createHelperGrid, getGravityForce } from "../library/helpers.js";

// 3js setup + camera + light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbdbcc);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.translateY(1);
camera.translateZ(3);

// Gravitational constant
const G = 6.674 * 10 ** -11;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 5); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
scene.add(directionalLight);

camera.position.z = 5;

function createArrow(newDir, newOrigin) {
  const dir = new THREE.Vector3(...newDir);
  dir.normalize();
  const origin = new THREE.Vector3(...newOrigin);
  const length = 1;
  const hex = 0x00635d;
  const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
  scene.add(arrowHelper);
  return arrowHelper;
}

function eulerStep(force, obj) {
  // this is the semi-implicit euler method
  // that's because we update position using
  // a future velocity measurement

  // if we were to use the old velocity, this
  // would be explicit Euler integration
  const acc = force.map((force_comp) => force_comp / obj.mass);
  const vel0 = obj.velocity[0] + TIME_STEP * acc[0];
  const vel1 = obj.velocity[1] + TIME_STEP * acc[1];
  const vel2 = obj.velocity[2] + TIME_STEP * acc[2];

  const pos0 = obj.position[0] + TIME_STEP * vel0;
  const pos1 = obj.position[1] + TIME_STEP * vel1;
  const pos2 = obj.position[2] + TIME_STEP * vel2;

  obj.position = [pos0, pos1, pos2];
  obj.velocity = [vel0, vel1, vel2];
}

createHelperGrid(scene);

const bottomPlane = createBox(
  scene,
  5,
  5,
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

const sphere1 = createSphere(
  scene,
  [-2, 1.5, 0],
  [2, 0, 0],
  10 ** 3, // mass
  0x446df6,
  0.4,
  0.8,
  false
);
const sphere2 = createSphere(
  scene,
  [2, 1.2, 0],
  [-2, 0, 0],
  10 ** 3, // mass
  0x446df6,
  0.4,
  0.8,
  false
);

const sphere3 = createSphere(
  scene,
  [-2, 2, 0],
  [1, -1, 0],
  10 ** 3,
  0x446df6,
  0.4,
  0.8,
  false
);

const normalArrow = createArrow([90, 90, 90], [90, 90, 90]);

function updateArrow(arrowObj, direction, position) {
  arrowObj.position.x = position[0];
  arrowObj.position.y = position[1];
  arrowObj.position.z = position[2];
  arrowObj.setDirection(new THREE.Vector3(...direction).normalize());
  arrowObj.setLength(2);
}

const TIME_STEP = 0.01;
let time = 0;

const allObjects = [
  sphere1,
  sphere2,
  sphere3,
  bottomPlane,
  leftPlane,
  // movableBox,
];

const movableObjects = allObjects.filter((obj) => !obj.fixed);

function animate() {
  requestAnimationFrame(animate);

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
          updateArrow(normalArrow, collideNormal, objI.position);
          resolveCollision(collision, objI, objJ);
        }
      }
    }
  }

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