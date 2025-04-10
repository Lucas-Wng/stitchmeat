import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function createWalls(scene) {
  const textureLoader = new THREE.TextureLoader();
  
  // Load a subtle texture for a more realistic museum wall effect.
  const wallTexture = textureLoader.load('/public/textures/concretewall.jpg', texture => {
    // Set up texture wrapping so the pattern repeats nicely.
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2); // adjust repeat values as needed
  });
  
  // Define a material that emulates contemporary art museum walls.
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7f7f7,       // a subtle off-white tone instead of stark white
    roughness: 0.85,       // a matte finish similar to museum walls
    metalness: 0.0,
    map: wallTexture       // apply the wall texture for added realism
  });

  const wallWidth = 300;
  const wallHeight = 400;

  // Helper to create a wall geometry with specific rotation and position.
  const createWallGeometry = (rotation, position) => {
    const geom = new THREE.PlaneGeometry(wallWidth, wallHeight);
    const tempObj = new THREE.Object3D();
    if (rotation) tempObj.rotation.copy(rotation);
    if (position) tempObj.position.copy(position);
    tempObj.updateMatrix();
    geom.applyMatrix4(tempObj.matrix);
    return geom;
  };

  // Create three walls: back, left, and right.
  const backWallGeometry = createWallGeometry(null, new THREE.Vector3(0, 50, -150));
  const leftWallGeometry = createWallGeometry(new THREE.Euler(0, Math.PI / 2, 0), new THREE.Vector3(-150, 50, 0));
  const rightWallGeometry = createWallGeometry(new THREE.Euler(0, -Math.PI / 2, 0), new THREE.Vector3(150, 50, 0));

  // Merge the individual wall geometries.
  const mergedWallsGeometry = mergeGeometries(
    [backWallGeometry, leftWallGeometry, rightWallGeometry],
    false
  );
  
  // Create the wall mesh and enable it to receive shadows.
  const mergedWallsMesh = new THREE.Mesh(mergedWallsGeometry, wallMaterial);
  mergedWallsMesh.receiveShadow = true;
  
  scene.add(mergedWallsMesh);
}

export function createGround(scene) {
  const textureLoader = new THREE.TextureLoader();
  
  // Load a texture for the ground. Replace with the path to your ground texture.
  const groundTexture = textureLoader.load('/public/textures/woodfloor.jpg', texture => {
    // Set up texture wrapping so the texture repeats.
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Adjust these repeat settings depending on the scale you want on the ground.
    texture.repeat.set(4, 4);
  });
  
  // Define a ground material that includes the texture.
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x878787,
    roughness: 0.2,
    metalness: 0,
    map: groundTexture  // apply the texture to the ground
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
