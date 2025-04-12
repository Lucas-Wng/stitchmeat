import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function createWalls(scene) {
    const textureLoader = new THREE.TextureLoader();
    
    const wallTexture = textureLoader.load('/textures/concretewall.jpg', texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
    });
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7f7f7,
      roughness: 0.85,
      metalness: 0.0,
      map: wallTexture
    });
  
    const wallWidth = 300;
    const wallHeight = 250;
  
    const createWallGeometry = (rotation, position) => {
      const geom = new THREE.PlaneGeometry(wallWidth, wallHeight);
      const tempObj = new THREE.Object3D();
      if (rotation) tempObj.rotation.copy(rotation);
      if (position) tempObj.position.copy(position);
      tempObj.updateMatrix();
      geom.applyMatrix4(tempObj.matrix);
      return geom;
    };
  
    const backWallGeometry = createWallGeometry(null, new THREE.Vector3(0, 50, -150));
    const leftWallGeometry = createWallGeometry(new THREE.Euler(0, Math.PI / 2, 0), new THREE.Vector3(-150, 50, 0));
    const rightWallGeometry = createWallGeometry(new THREE.Euler(0, -Math.PI / 2, 0), new THREE.Vector3(150, 50, 0));
  
    
    const roofGeometry = createWallGeometry(new THREE.Euler(Math.PI / 2, 0, 0), new THREE.Vector3(0, 150, -50));
  
    const mergedWallsGeometry = mergeGeometries(
      [backWallGeometry, leftWallGeometry, rightWallGeometry, roofGeometry],
      false
    );
    
    const mergedWallsMesh = new THREE.Mesh(mergedWallsGeometry, wallMaterial);
    mergedWallsMesh.receiveShadow = true;
    
    scene.add(mergedWallsMesh);
  }
  

export function createGround(scene) {
  const textureLoader = new THREE.TextureLoader();
  
  
  const groundTexture = textureLoader.load('/textures/woodfloor.jpg', texture => {
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    texture.repeat.set(4, 4);
  });
  
  
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x878787,
    roughness: 0.2,
    metalness: 0,
    map: groundTexture  
  });
  
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    groundMaterial
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -50;
  ground.receiveShadow = true;
  scene.add(ground);
}
