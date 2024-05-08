import * as THREE from "three";

// 3js setup + camera + light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbdbcc);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Gravitational constant
const G = 6.674 * 10 ** -11;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 10); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
scene.add(directionalLight);

camera.position.z = 5;

// functions

function createSphere(
  initPosition = [0, 0, 0],
  initVelocity = [0, 0, 0],
  mass = 1,
  color = 0xaf748d
) {
  const geometrySphere = new THREE.SphereGeometry(0.25);
  const materialSphere = new THREE.MeshPhongMaterial({
    color: color,
  });
  const sphere = new THREE.Mesh(geometrySphere, materialSphere);
  scene.add(sphere);
  return {
    sphere: sphere,
    mass: mass,
    position: initPosition,
    velocity: initVelocity,
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

const sphere1 = createSphere([0, 0, 0], [0, 0, 0], 10 ** 11, 0xaf748d);
const sphere2 = createSphere([2, 0, 0], [0, 1, 0], 100, 0x446df6);
const sphere3 = createSphere([-2, 0, 0], [0, 1, 0], 100, 0x446df6);
const forceArrow1 = createArrow([0, 0, 0], [0, 0, 0]);
const forceArrow2 = createArrow([0, 0, 0], [0, 0, 0]);
const forceArrow3 = createArrow([0, 0, 0], [0, 0, 0]);

const TIME_STEP = 0.01;
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  const forceOnSphere1 = addForces(
    getForce(sphere1, sphere2),
    getForce(sphere1, sphere3)
  );
  const forceOnSphere2 = addForces(
    getForce(sphere2, sphere1),
    getForce(sphere2, sphere3)
  );
  const forceOnSphere3 = addForces(
    getForce(sphere3, sphere1),
    getForce(sphere3, sphere2)
  );

  // console.log("force", forceOnSphere1, forceOnSphere2, forceOnSphere3);

  eulerStep(forceOnSphere1, sphere1);
  eulerStep(forceOnSphere2, sphere2);
  eulerStep(forceOnSphere3, sphere3);

  // console.assert(
  //   forceOnSphere2[0] + forceOnSphere1[0] < 0.01 &&
  //     forceOnSphere2[1] + forceOnSphere1[1] < 0.01 &&
  //     forceOnSphere2[2] + forceOnSphere1[2] < 0.01,
  //   "Forces must be equal and opposite"
  // );
  // console.log("position", sphere1.position, sphere2.position, sphere3.position);

  updateForceArrow(forceArrow2, forceOnSphere1, sphere1.position);
  updateForceArrow(forceArrow1, forceOnSphere2, sphere2.position);
  updateForceArrow(forceArrow3, forceOnSphere3, sphere3.position);

  updatePosition(sphere1);
  updatePosition(sphere2);
  updatePosition(sphere3);

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
