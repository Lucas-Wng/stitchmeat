import * as THREE from 'three';
import { createClothSimulation } from './cloth.js';
import backgroundVertex from './shaders/bg_vertex.glsl?raw';
import backgroundFragment from './shaders/bg_fragment.glsl?raw';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 110); // or whatever your position is
camera.lookAt(new THREE.Vector3(0, 5, 0)); // look slightly upward


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
renderer.autoClear = true;

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // adds smoothness
// controls.dampingFactor = 0.05;
// controls.minDistance = 20; // optional: zoom limits
// controls.maxDistance = 500;
// controls.enablePan = true;
// controls.enabled = false;



// === Lighting ===

// Ambient light to soften shadows and fill dark areas
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Key light: shines down from above like a gallery spotlight
const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
keyLight.position.set(0, 100, 40);
keyLight.target.position.set(0, 0, 0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 300;
keyLight.shadow.camera.left = -200;
keyLight.shadow.camera.right = 200;
keyLight.shadow.camera.top = 200;
keyLight.shadow.camera.bottom = -200;
scene.add(keyLight);
scene.add(keyLight.target);

// Fill light from the opposite side
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(0, 50, -60);
scene.add(fillLight);


// scene.add(new THREE.CameraHelper(keyLight.shadow.camera));

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;


// === Walls (Back, Left, Right) ===
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8f8f5,
  roughness: 0.95,
  metalness: 0.0,
});


const backWall = new THREE.Mesh(new THREE.PlaneGeometry(300, 200), wallMaterial);
backWall.position.set(0, 50, -150);
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(300, 200), wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-150, 50, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(300, 200), wallMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(150, 50, 0);
scene.add(rightWall);


// === Ground Plane ===
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x878787,         // light gray / museum floor
  roughness: 0.95 ,         // soft, non-reflective
  metalness: 0,            // fully matte
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  groundMaterial
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -50;
ground.receiveShadow = true;
scene.add(ground);

// === Background Shader ===
const backgroundMaterial = new THREE.ShaderMaterial({
  vertexShader: backgroundVertex,
  fragmentShader: backgroundFragment,
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  depthWrite: false,
  depthTest: false,
  side: THREE.DoubleSide
});
const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), backgroundMaterial);
backgroundPlane.position.z = -10;
backgroundPlane.renderOrder = -999;
scene.add(backgroundPlane);

// === Floor Detail ===
const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
const detailedFloor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), floorMat);
detailedFloor.rotation.x = -Math.PI / 2;
detailedFloor.position.y = -50.01;
detailedFloor.receiveShadow = true;
scene.add(detailedFloor);

// === Load Blood Texture ===
const bloodTexture = new THREE.TextureLoader().load('/textures/blood.png');
bloodTexture.encoding = THREE.sRGBEncoding; // ensure correct color space
bloodTexture.anisotropy = 4; // better texture sharpness

const bloodMaterialBase = new THREE.MeshStandardMaterial({
  map: bloodTexture,
  transparent: true,
  roughness: 1,
  metalness: 0,
  depthWrite: true,     // ✅ Enable depth writing
  depthTest: true,      // ✅ Make sure depth testing is on
});


const bloodGeometry = new THREE.PlaneGeometry(20, 20);

// === Blood Spawner ===
function spawnRandomBloodSplatter() {
  const mat = bloodMaterialBase.clone();

  // Random opacity for variation
  mat.opacity = THREE.MathUtils.randFloat(0.95, 1.0);

  // Random size scale (non-uniform for messiness)
  const width = THREE.MathUtils.randFloat(31, 57);
  const height = THREE.MathUtils.randFloat(35, 50);
  const geometry = new THREE.PlaneGeometry(width, height);
  const splat = new THREE.Mesh(geometry, mat);

  const wallChoice = Math.floor(Math.random() * 4); // 0 = back, 1 = left, 2 = right, 3 = floor

  // slight offset from surface to avoid z-fighting
  const bump = 0.05;

  if (wallChoice === 0) {
    // Back wall
    const x = THREE.MathUtils.randFloatSpread(280);
    const y = THREE.MathUtils.randFloat(-60, 160);
    splat.position.set(x, y, -149.9 + bump);
    splat.rotation.z = Math.random() * Math.PI * 2;
  } else if (wallChoice === 1) {
    // Left wall
    const z = THREE.MathUtils.randFloatSpread(280);
    const y = THREE.MathUtils.randFloat(-60, 160);
    splat.position.set(-149.9 + bump, y, z);
    splat.rotation.y = Math.PI / 2;
    splat.rotation.z = Math.random() * Math.PI * 2;
  } else if (wallChoice === 2) {
    // Right wall
    const z = THREE.MathUtils.randFloatSpread(280);
    const y = THREE.MathUtils.randFloat(-60, 160);
    splat.position.set(149.9 - bump, y, z);
    splat.rotation.y = -Math.PI / 2;
    splat.rotation.z = Math.random() * Math.PI * 2;
  } else {
    // Floor
    const x = THREE.MathUtils.randFloatSpread(280);
    const z = THREE.MathUtils.randFloatSpread(280);
    splat.position.set(x, -49.9 + bump, z);
    splat.rotation.x = -Math.PI / 2;
    splat.rotation.z = Math.random() * Math.PI * 2;
  }

  // Optional: slightly tilt the splat randomly
  splat.rotation.x += THREE.MathUtils.randFloatSpread(0.1);
  splat.rotation.y += THREE.MathUtils.randFloatSpread(0.1);

  splat.castShadow = false;      // optional, blood shouldn't cast shadows
  splat.receiveShadow = false;   // standard for decals — shadows still fall on ground below


  scene.add(splat);
}




// === Cloth Layer ===
const cloth = createClothSimulation(scene, camera, () => {
  spawnRandomBloodSplatter(); // trigger blood splat randomly on wall
});

// === Frame (optional) ===
const textureLoader = new THREE.TextureLoader();
textureLoader.load('/textures/frame2.png', (frameTex) => {
  frameTex.encoding = THREE.sRGBEncoding;
  frameTex.magFilter = THREE.LinearFilter;
  frameTex.minFilter = THREE.LinearMipMapLinearFilter;

  const frameMaterial = new THREE.MeshBasicMaterial({
    map: frameTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const frameGeometry = new THREE.PlaneGeometry(160, 110);
  const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
  frameMesh.position.set(0, 5, 10);
  scene.add(frameMesh);
});

// === Animate Everything ===
function animate() {
  requestAnimationFrame(animate);
  cloth.update();
  // controls.update();
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
