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

// === Load Texture ===
const loader = new THREE.TextureLoader();
const texture = loader.load('/textures/crumbling.jpg');

// === ShaderMaterial from external GLSL files ===
const backgroundMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: texture }
  },
  vertexShader: backgroundVertex,
  fragmentShader: backgroundFragment
});

const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), backgroundMaterial);
backgroundPlane.position.z = -10;
backgroundPlane.renderOrder = -999;
scene.add(backgroundPlane);

// === Add Cloth Layer ===
const cloth = createClothSimulation(scene, camera, () => {
  // optional distortion callback
});

// === Animate Everything ===
function animate() {
  requestAnimationFrame(animate);
  cloth.update();
  renderer.render(scene, camera);
}
animate();
