import * as THREE from "three";

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

function getSphere(initPosition = [0, 0, 0], mass = 1, color = 0xaf748d) {
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
  };
}

const sphere1 = getSphere([0, 0, 0], 10 ** 10, 0xaf748d);
const sphere2 = getSphere([10, 10, 0], 1, 0x446df6);

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

function updatePosition(obj) {
  obj.sphere.position.x = obj.position[0];
  obj.sphere.position.y = obj.position[1];
  obj.sphere.position.z = obj.position[2];
}

camera.position.z = 5;

let time = 0;

const radius = 2;

function addArrow(newDir, newOrigin) {
  const dir = new THREE.Vector3(...newDir);
  dir.normalize();
  const origin = new THREE.Vector3(...newOrigin);
  const length = 1;
  const hex = 0x00635d;
  const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
  scene.add(arrowHelper);
  return arrowHelper;
}

const forceArrow = addArrow([0, 0, 0], [0, 0, 0]);

function animate() {
  requestAnimationFrame(animate);

  sphere1.sphere.position.x = 0; //Math.sin(time);
  sphere1.sphere.position.y = 0; //Math.sin(time);
  sphere1.sphere.position.z = 0; //Math.sin(time);

  sphere2.position[0] = radius * Math.cos(time);
  sphere2.position[1] = radius * Math.sin(time);
  sphere2.position[2] = Math.cos(time);

  const forceOnSphere1 = getForce(sphere1, sphere2);
  const forceOnSphere2 = getForce(sphere2, sphere1);

  console.assert(
    forceOnSphere2[0] + forceOnSphere1[0] < 0.01 &&
      forceOnSphere2[1] + forceOnSphere1[1] < 0.01 &&
      forceOnSphere2[2] + forceOnSphere1[2] < 0.01,
    "Forces must be equal and opposite"
  );

  forceArrow.position.x = sphere2.position[0];
  forceArrow.position.y = sphere2.position[1];
  forceArrow.position.z = sphere2.position[2];
  forceArrow.setDirection(new THREE.Vector3(...forceOnSphere2).normalize());
  forceArrow.setLength(
    Math.sqrt(
      forceOnSphere2[0] ** 2 + forceOnSphere2[1] ** 2 + forceOnSphere2[2] ** 2
    ) * 5
  );

  updatePosition(sphere2);

  renderer.render(scene, camera);
  time += 0.01;
}

import WebGL from "three/addons/capabilities/WebGL.js";

if (WebGL.isWebGLAvailable()) {
  // Initiate function or other initializations here
  animate();
} else {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}
