import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbdbcc);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 10); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
scene.add(directionalLight);

function getSphere(color = 0xaf748d) {
  const geometrySphere = new THREE.SphereGeometry();
  const materialSphere = new THREE.MeshPhongMaterial({
    color: color,
  });
  const sphere = new THREE.Mesh(geometrySphere, materialSphere);
  scene.add(sphere);
  return sphere;
}

const sphere1 = getSphere();
const sphere2 = getSphere(0x4d9140);

camera.position.z = 5;

let time = 0;

function animate() {
  requestAnimationFrame(animate);

  sphere1.position.x = Math.sin(time);
  sphere1.position.y = Math.sin(time);
  sphere1.position.z = Math.sin(time);

  sphere2.position.x = Math.cos(time);
  sphere2.position.y = Math.cos(time);
  sphere2.position.z = Math.cos(time);

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
