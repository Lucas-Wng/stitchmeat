import * as THREE from "three";
import { createClothSimulation } from "./cloth.js";
import backgroundVertex from "./shaders/bg_vertex.glsl?raw";
import backgroundFragment from "./shaders/bg_fragment.glsl?raw";
import { setupLighting } from "./lighting.js";
import { createWalls, createGround } from "./walls.js";
import { setupBlood, spawnRandomBloodSplatter, updateBloodSplats } from "./blood.js";




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




const clock = new THREE.Clock();


setupLighting(scene, renderer);


createWalls(scene);
createGround(scene);



const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const canvasWidth = 512;
const canvasHeight = 256;
canvas.width = canvasWidth;
canvas.height = canvasHeight;


ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvasWidth, canvasHeight);


ctx.fillStyle = '#000000';
ctx.font = 'bold 70px Frutiger';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('stitchmeat', canvasWidth / 2, canvasHeight / 2);


const labelTexture = new THREE.CanvasTexture(canvas);
labelTexture.encoding = THREE.sRGBEncoding;
labelTexture.needsUpdate = true;


const labelMaterial = new THREE.MeshStandardMaterial({
  map: labelTexture,
  transparent: false,
  depthWrite: true,
});


const labelWidth = 8;
const labelHeight = 5;
const labelMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(labelWidth, labelHeight),
  labelMaterial
);


labelMesh.position.set(25, -29, 35);
labelMesh.rotation.set(THREE.MathUtils.degToRad(-20), 0, 0);
labelMesh.renderOrder = 1;

labelMesh.castShadow = true;
labelMesh.receiveShadow = true;

scene.add(labelMesh);


setupBlood();


let tearCount = 0;


const cloth = createClothSimulation(scene, camera, () => {
  tearCount ++;
  spawnRandomBloodSplatter(scene, clock);
});


let nextFlickerTime = 0;
let isFlickering = false;
let flickerDuration = 0;
let flickerStartTime = 0;
const baseIntensity = 2.3; 

const keyLight = scene.userData.keyLight;

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  
  
  updateBloodSplats(clock);

  
  if (tearCount > 0 && elapsed > nextFlickerTime && !isFlickering) {
    const flickerProbability = Math.min(0.0003 * tearCount, 1.0);
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

  
  cloth.update();
  renderer.render(scene, camera);
}
animate();
