import * as THREE from 'three';
import { createClothSimulation } from './cloth.js';
import backgroundVertex from './shaders/bg_vertex.glsl?raw';
import backgroundFragment from './shaders/bg_fragment.glsl?raw';

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 70;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);
renderer.autoClear = true;

// === Background Shader Material ===
const backgroundMaterial = new THREE.ShaderMaterial({
  vertexShader: backgroundVertex,
  fragmentShader: backgroundFragment,
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    // uTexture: { value: texture } // Uncomment if your fragment shader actually uses it
  },
  depthWrite: false,
  depthTest: false,
  side: THREE.DoubleSide
});

const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), backgroundMaterial);
backgroundPlane.position.z = -10;
backgroundPlane.renderOrder = -999;
scene.add(backgroundPlane);

// === Cloth Layer ===
const cloth = createClothSimulation(scene, camera, () => {
  // optional distortion callback
});

// === Animate Everything ===
function animate() {
  requestAnimationFrame(animate);
  cloth.update();
  backgroundMaterial.uniforms.uTime.value = performance.now() * 0.001;
  renderer.render(scene, camera);
}
animate();

// === Responsive Resize ===
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  backgroundMaterial.uniforms.uResolution.value.set(width, height);
});
