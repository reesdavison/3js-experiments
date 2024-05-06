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

// const geometryCube = new THREE.BoxGeometry(1, 1, 1);
// const materialCube = new THREE.MeshBasicMaterial({
//   color: 0x00ff00,
//   opacity: 0.3,
// });
// const cube = new THREE.Mesh(geometryCube, materialCube);
// scene.add(cube);

const light = new THREE.AmbientLight(0x404040, 10); // soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
scene.add(directionalLight);

const geometrySphere = new THREE.SphereGeometry(); // 15, 32, 16);
// const materialSphere = new THREE.MeshBasicMaterial({
//   color: 0xffff00,
//   wireframe: true,
// });
// const materialSphere = new THREE.MeshDepthMaterial({
//   color: 0xffff00,
//   // wireframe: true,
// });
// const materialSphere = new THREE.MeshNormalMaterial();
const materialSphere = new THREE.MeshPhongMaterial({
  color: 0xaf748d,
  // wireframe: true,
});
// const materialSphere = new THREE.WireframeGeometry();
const sphere = new THREE.Mesh(geometrySphere, materialSphere);
scene.add(sphere);

camera.position.z = 5;

let time = 0;

function animate() {
  requestAnimationFrame(animate);

  sphere.position.x = Math.sin(time);
  sphere.position.y = Math.sin(time);
  sphere.position.z = Math.sin(time);
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

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
