import * as THREE from "three";

export function setupLighting(scene, renderer) {
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  
  const ambientLight = new THREE.AmbientLight(0xc6d8ff, 1.8);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xc6d8ff, 0x444444, 0.5);
  hemiLight.position.set(0, 100, 0);
  scene.add(hemiLight);

  
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
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

  
  const bottomUpLight = new THREE.DirectionalLight(0x8faaff, 1.5);
  bottomUpLight.position.set(0, -20, 40);
  bottomUpLight.target.position.set(0, 50, -150);
  bottomUpLight.castShadow = true;
  bottomUpLight.shadow.mapSize.set(1024, 1024);
  bottomUpLight.shadow.camera.left = -300;
  bottomUpLight.shadow.camera.right = 300;
  bottomUpLight.shadow.camera.top = 200;
  bottomUpLight.shadow.camera.bottom = -200;
  bottomUpLight.shadow.camera.near = 10;
  bottomUpLight.shadow.camera.far = 500;
  scene.add(bottomUpLight);
  scene.add(bottomUpLight.target);

  
  const sideSpotLeft = new THREE.SpotLight(0xfff4e5, 1.2, 300, Math.PI / 7, 0.3, 1);
  sideSpotLeft.position.set(-100, 80, 0);
  sideSpotLeft.target.position.set(0, 40, 0);
  sideSpotLeft.castShadow = true;
  sideSpotLeft.shadow.mapSize.set(1024, 1024);
  scene.add(sideSpotLeft);
  scene.add(sideSpotLeft.target);

  const sideSpotRight = new THREE.SpotLight(0xfff4e5, 1.2, 300, Math.PI / 7, 0.3, 1);
  sideSpotRight.position.set(100, 80, 0);
  sideSpotRight.target.position.set(0, 40, 0);
  sideSpotRight.castShadow = true;
  sideSpotRight.shadow.mapSize.set(1024, 1024);
  scene.add(sideSpotRight);
  scene.add(sideSpotRight.target);

  
  const fillLight = new THREE.DirectionalLight(0xc6d8ff, 0.5);
  fillLight.position.set(0, 60, -60);
  scene.add(fillLight);

  
  const centerLight = new THREE.PointLight(0xc6d8ff, 0.8, 200);
  centerLight.position.set(0, 30, 0);
  centerLight.castShadow = true;
  centerLight.shadow.mapSize.width = 1024;
  centerLight.shadow.mapSize.height = 1024;
  scene.add(centerLight);

  
  const labelOverheadLight = new THREE.SpotLight(0xffffff, 1.0, 100, Math.PI / 6, 0.3, 1);
  labelOverheadLight.position.set(25, 50, 30); 
  labelOverheadLight.target.position.set(25, -35.5, 30); 
  labelOverheadLight.castShadow = true;
  labelOverheadLight.shadow.mapSize.set(1024, 1024);
  scene.add(labelOverheadLight);
  scene.add(labelOverheadLight.target);

  
  scene.userData.keyLight = keyLight;
  scene.userData.spotLeft = sideSpotLeft;
  scene.userData.spotRight = sideSpotRight;
}
