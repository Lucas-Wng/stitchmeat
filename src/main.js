import * as THREE from "three";
import { createClothSimulation } from "./cloth.js";
import backgroundVertex from "./shaders/bg_vertex.glsl?raw";
import backgroundFragment from "./shaders/bg_fragment.glsl?raw";
import { setupLighting } from "./lighting.js";
import { createWalls, createGround } from "./walls.js";
import { setupBlood, spawnRandomBloodSplatter, updateBloodSplats } from "./blood.js";

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, -5, 100);
camera.lookAt(0, 5, 0);
camera.setFocalLength(15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
renderer.autoClear = true;

// === Clock for Uniform Updates ===
const clock = new THREE.Clock();

// === Setup Lighting ===
setupLighting(scene, renderer);

// === Create Walls and Ground ===
createWalls(scene);
createGround(scene);

// === Setup Blood Texture/Material ===
setupBlood();

// Global tear counter (example variable)
let tearCount = 0;

// === Cloth Simulation ===
const cloth = createClothSimulation(scene, camera, () => {
  // Spawn a blood splat whenever the cloth simulation triggers the event.
  spawnRandomBloodSplatter(scene, clock);
});

// === Animation Loop ===
let nextFlickerTime = 0;
let isFlickering = false;
let flickerDuration = 0;
let flickerStartTime = 0;
const baseIntensity = 2.3; // original intensity for keyLight

const keyLight = scene.userData.keyLight;

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Update blood splats to darken over time.
  updateBloodSplats(clock);

  // Flicker keyLight intensity based on tearCount if applicable.
  if (tearCount > 0 && elapsed > nextFlickerTime && !isFlickering) {
    const flickerProbability = Math.min(0.3 * tearCount, 1.0);
    if (Math.random() < flickerProbability) {
      isFlickering = true;
      flickerDuration = Math.random() * 0.2 + 0.1;
      flickerStartTime = elapsed;
    }
    nextFlickerTime = elapsed + Math.random() * (0.4 / tearCount) + (0.1 / tearCount);
  }
  if (isFlickering) {
    const progress = (elapsed - flickerStartTime) / flickerDuration;
    const flickerFactor = 0.2 + Math.abs(Math.sin(progress * Math.PI));
    keyLight.intensity = baseIntensity * flickerFactor;
    if (progress >= 1) {
      isFlickering = false;
      keyLight.intensity = baseIntensity;
    }
  } else {
    keyLight.intensity = baseIntensity;
  }

  // Update cloth simulation.
  cloth.update();
  renderer.render(scene, camera);
}
animate();
