import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// 3js setup + camera + light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbdbcc);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 3;

console.log(camera.position);

// Gravitational constant
const G = 6.674 * 10 ** -11;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 10); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
scene.add(directionalLight);

// const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(helper);

camera.position.z = 5;

// functions
import { createSphere } from "./src/js/shared.js";

function createGround(width = 1, height = 1, depth = 1, color = 0x0a0d4bff) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({
    color: color,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cube.position.y = -height / 2;
  return {
    cube: cube,
  };
}

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

function updatePosition(obj) {
  obj.sphere.position.x = obj.position[0];
  obj.sphere.position.y = obj.position[1];
  obj.sphere.position.z = obj.position[2];
}

function updateForceArrow(forceArrowObj, force, position) {
  forceArrowObj.position.x = position[0];
  forceArrowObj.position.y = position[1];
  forceArrowObj.position.z = position[2];
  forceArrowObj.setDirection(new THREE.Vector3(...force).normalize());
  forceArrowObj.setLength(
    Math.sqrt(force[0] ** 2 + force[1] ** 2 + force[2] ** 2) * 0.005
  );
}

function eulerStep(force, obj, useGroundConstraint = false) {
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

function addForces(...forces) {
  return forces.reduce(
    (prev, force) => [
      prev[0] + force[0],
      prev[1] + force[1],
      prev[2] + force[2],
    ],
    [0, 0, 0]
  );
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

  const forceOnEarth = addForces(getForce(earth, sphere2));

  const forceOfGravity = getForce(sphere2, earth);
  const forceOnSphere2 = addForces(forceOfGravity);

  console.log(sphere2);

  eulerStep(forceOnEarth, earth);
  eulerStep(forceOnSphere2, sphere2, true);

  // updateForceArrow(forceArrow2, forceOnEarth, earth.position);
  // updateForceArrow(forceArrow1, forceOnSphere2, sphere2.position);

  updatePosition(earth);
  updatePosition(sphere2);

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
