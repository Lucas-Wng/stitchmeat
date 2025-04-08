import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createClothSimulation } from "./cloth.js";
import backgroundVertex from "./shaders/bg_vertex.glsl?raw";
import backgroundFragment from "./shaders/bg_fragment.glsl?raw";

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 5, 110);
camera.lookAt(0, 5, 0);

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

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0xffefd4, 0.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffefd4, 2.3);
keyLight.position.set(0, 100, 40);
keyLight.target.position.set(0, 0, 0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 300;
keyLight.shadow.camera.left = -200;
keyLight.shadow.camera.right = 200;
keyLight.shadow.camera.top = 200;
keyLight.shadow.camera.bottom = -200;
scene.add(keyLight);
scene.add(keyLight.target);

const fillLight = new THREE.DirectionalLight(0xffefd4, 0.5);
fillLight.position.set(0, 50, -60);
scene.add(fillLight);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

// === Merged Walls (Back, Left, Right) ===
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8f8f5,
  roughness: 0.95,
  metalness: 0.0,
});

const wallWidth = 300;
const wallHeight = 200;
const createWallGeometry = (rotation, position) => {
  const geom = new THREE.PlaneGeometry(wallWidth, wallHeight);
  const tempObj = new THREE.Object3D();
  if (rotation) tempObj.rotation.copy(rotation);
  if (position) tempObj.position.copy(position);
  tempObj.updateMatrix();
  geom.applyMatrix4(tempObj.matrix);
  return geom;
};

const backWallGeometry = createWallGeometry(
  null,
  new THREE.Vector3(0, 50, -150),
);
const leftWallGeometry = createWallGeometry(
  new THREE.Euler(0, Math.PI / 2, 0),
  new THREE.Vector3(-150, 50, 0),
);
const rightWallGeometry = createWallGeometry(
  new THREE.Euler(0, -Math.PI / 2, 0),
  new THREE.Vector3(150, 50, 0),
);

const mergedWallsGeometry = mergeGeometries(
  [backWallGeometry, leftWallGeometry, rightWallGeometry],
  false,
);
const mergedWallsMesh = new THREE.Mesh(mergedWallsGeometry, wallMaterial);
mergedWallsMesh.receiveShadow = true;
scene.add(mergedWallsMesh);

// === Ground and Floor Detail ===
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x878787,
  roughness: 0.95,
  metalness: 0,
});
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  groundMaterial,
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
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  },
  depthWrite: false,
  depthTest: false,
  side: THREE.DoubleSide,
});
const backgroundPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  backgroundMaterial,
);
backgroundPlane.position.z = -10;
backgroundPlane.renderOrder = -999;
scene.add(backgroundPlane);

// === Blood Texture and Material ===
const bloodTexture = new THREE.TextureLoader().load(
  "public/textures/f0e7b87a9b21de37e1723ce62fc416d8.png",
  (texture) => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    bloodTexture.aspect = texture.image.width / texture.image.height;
  },
);
bloodTexture.aspect = 1;

const bloodMaterialBase = new THREE.MeshStandardMaterial({
  map: bloodTexture,
  transparent: true,
  roughness: 1,
  metalness: 0,
  depthWrite: false,
  depthTest: true,
  color: new THREE.Color().setHSL(
    0,
    THREE.MathUtils.randFloat(0.6, 1),
    THREE.MathUtils.randFloat(0.2, 0.5),
  ),
  receiveShadow: true,
});

// === Blood Spawner (Consider using object pooling or InstancedMesh if spawns become numerous) ===
function spawnRandomBloodSplatter() {
  const mat = bloodMaterialBase.clone();
  mat.opacity = THREE.MathUtils.randFloat(0.95, 1.0);
  mat.color.setHSL(
    0,
    THREE.MathUtils.randFloat(0.6, 1.0),
    THREE.MathUtils.randFloat(0.2, 0.5),
  );

  const aspect = bloodTexture.aspect || 1;
  const baseHeight = THREE.MathUtils.randFloat(60, 80);
  const geometry = new THREE.PlaneGeometry(baseHeight * aspect, baseHeight);
  const splat = new THREE.Mesh(geometry, mat);

  const wallChoice = Math.floor(Math.random() * 4);
  const bump = 0.05;

  if (wallChoice === 0) {
    // Back wall
    splat.position.set(
      THREE.MathUtils.randFloatSpread(280),
      THREE.MathUtils.randFloat(-60, 160),
      -149.9 + bump,
    );
    splat.rotation.z = Math.random() * Math.PI * 2;
  } else if (wallChoice === 1) {
    // Left wall
    splat.position.set(
      -149.9 + bump,
      THREE.MathUtils.randFloat(-60, 160),
      THREE.MathUtils.randFloatSpread(280),
    );
    splat.rotation.set(0, Math.PI / 2, Math.random() * Math.PI * 2);
  } else if (wallChoice === 2) {
    // Right wall
    splat.position.set(
      149.9 - bump,
      THREE.MathUtils.randFloat(-60, 160),
      THREE.MathUtils.randFloatSpread(280),
    );
    splat.rotation.set(0, -Math.PI / 2, Math.random() * Math.PI * 2);
  } else {
    // Floor
    splat.position.set(
      THREE.MathUtils.randFloatSpread(280),
      -49.9 + bump,
      THREE.MathUtils.randFloatSpread(280),
    );
    splat.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
  }

  // Introduce slight random rotation adjustments.
  splat.rotation.x += THREE.MathUtils.randFloatSpread(0.1);
  splat.rotation.y += THREE.MathUtils.randFloatSpread(0.1);
  splat.castShadow = false;
  splat.receiveShadow = true;
  splat.renderOrder = 0;
  scene.add(splat);
}

// === Cloth Simulation Layer ===
const cloth = createClothSimulation(scene, camera, () => {
  spawnRandomBloodSplatter();
});

// === Frame ===
const textureLoader = new THREE.TextureLoader();
textureLoader.load("/textures/frame2.png", (frameTex) => {
  frameTex.encoding = THREE.sRGBEncoding;
  frameTex.magFilter = THREE.LinearFilter;
  frameTex.minFilter = THREE.LinearMipMapLinearFilter;

  const frameMaterial = new THREE.MeshBasicMaterial({
    map: frameTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
  });

  const frameGeometry = new THREE.PlaneGeometry(160, 110);
  const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
  frameMesh.position.set(0, 5, 10);
  frameMesh.renderOrder = 9999;
  scene.add(frameMesh);
});

// === Animate Everything ===
function animate() {
  requestAnimationFrame(animate);

  cloth.update();
  backgroundMaterial.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();

// === Responsive Resize ===
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  backgroundMaterial.uniforms.uResolution.value.set(width, height);
});
