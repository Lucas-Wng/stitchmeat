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
camera.position.set(0, -5, 60);
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

const keyLight = scene.userData.keyLight;

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  
  
  updateBloodSplats(clock);

  
  if (tearCount > 0 && elapsed > nextFlickerTime && !isFlickering) {
    const flickerProbability = Math.min(0.00005 * tearCount, 1.0);
    if (Math.random() < flickerProbability) {
      isFlickering = true;
      flickerDuration = Math.random() * 0.2 + 0.1;
      flickerStartTime = elapsed;
    }
    nextFlickerTime = elapsed + Math.random() * (0.4 / tearCount) + (0.1 / tearCount);
  }
  
  let flickerFactor = 1;
  if (isFlickering) {
    const progress = (elapsed - flickerStartTime) / flickerDuration;
    flickerFactor = 0.2 + Math.abs(Math.sin(progress * Math.PI));
    if (progress >= 1) {
      isFlickering = false;
      flickerFactor = 1;
    }
  }
  const decreaseFactor = Math.max(0, 1 - tearCount * 0.001);
  const flickeringLights = [
    scene.userData.keyLight,
    scene.userData.spotLeft,
    scene.userData.spotRight,
    scene.userData.sideFillLeft,
    scene.userData.sideFillRight,
    scene.userData.overheadLight
  ];
  flickeringLights.forEach(light => {
    if (!light.userData.baseIntensity) {
      light.userData.baseIntensity = light.intensity;
    }
    if (isFlickering) {
      light.intensity = light.userData.baseIntensity * flickerFactor;
    } else {
      light.intensity = light.userData.baseIntensity * decreaseFactor;
    }
  });

  
  cloth.update();
  renderer.render(scene, camera);
}
animate();
