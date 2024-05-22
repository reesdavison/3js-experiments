import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { createSphere } from "../library/sphere.js";
import { addVectors } from "../library/vector.js";

// 3js setup + camera + light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbdbcc);

const camera = setupCamera();

console.log(camera.position);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 10); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
scene.add(directionalLight);

// functions

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

function eulerStepWithGround(force, obj, useGroundConstraint = false) {
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

  if (useGroundConstraint && pos1 - obj.radius <= 0) {
    // obj.position = [0, 0, 0];
    obj.velocity = [
      -vel0 * obj.restitution,
      -vel1 * obj.restitution,
      -vel2 * obj.restitution,
    ];
    return;
  }

  obj.position = [pos0, pos1, pos2];
  obj.velocity = [vel0, vel1, vel2];
}

// simulate earth
// we could use g=9.81 but we get to re-use our code this way
const earth = createSphere(
  scene,
  [0, -6335439, 0], // distance in metres between earths surface and centre
  [0, 0, 0],
  5.9722 * 10 ** 24, // mass in kg of earth,
  0x47673b,
  6335439
);
const sphere2 = createSphere(
  scene,
  [0, 10, 0],
  [0, 2, 0],
  10 ** 3, // mass
  0x446df6,
  0.25,
  0.8
);
// const forceArrow1 = createArrow([0, 0, 0], [0, 0, 0]);
// const forceArrow2 = createArrow([0, 0, 0], [0, 0, 0]);
// const ground = createGround(6, 0.5, 6);

const TIME_STEP = 0.01;
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  const forceOnEarth = addVectors(getForce(earth, sphere2));

  const forceOfGravity = getForce(sphere2, earth);
  const forceOnSphere2 = addVectors(forceOfGravity);

  console.log(sphere2);

  eulerStepWithGround(forceOnEarth, earth);
  eulerStepWithGround(forceOnSphere2, sphere2, true);

  earth.updatePosition(earth);
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
