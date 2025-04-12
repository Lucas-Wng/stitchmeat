import * as THREE from "three";


export const bloodSplats = [];

let bloodTextureAspect = 1;
let bloodMaterialBase;

export function setupBlood() {
  const bloodTexture = new THREE.TextureLoader().load(
    "/textures/f0e7b87a9b21de37e1723ce62fc416d8.png",
    (texture) => {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.encoding = THREE.sRGBEncoding;
      bloodTextureAspect = texture.image.width / texture.image.height;
    }
  );
  
  bloodTextureAspect = bloodTextureAspect || 1;

  bloodMaterialBase = new THREE.MeshStandardMaterial({
    map: bloodTexture,
    transparent: true,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
    depthTest: true,
    color: new THREE.Color().setHSL(
      0,
      THREE.MathUtils.randFloat(0.6, 1),
      THREE.MathUtils.randFloat(0.2, 0.5)
    ),
  });
}

export function spawnRandomBloodSplatter(scene, clock) {
  const mat = bloodMaterialBase.clone();

  const initialSaturation = THREE.MathUtils.randFloat(0.6, 1.0);
  const initialLightness = THREE.MathUtils.randFloat(0.4, 0.6);
  const initialColor = new THREE.Color().setHSL(
    0,
    initialSaturation,
    initialLightness
  );
  mat.color.copy(initialColor);
  mat.opacity = THREE.MathUtils.randFloat(0.95, 1.0);

  const finalSaturation = THREE.MathUtils.randFloat(0.6, 1.0);
  const finalLightness = THREE.MathUtils.randFloat(0.05, 0.2);
  const finalColor = new THREE.Color().setHSL(
    0,
    finalSaturation,
    finalLightness
  );

  const wallChoice = Math.floor(Math.random() * 5); 
  const bump = 0.05;

  let position, rotation;

  if (wallChoice === 0) {
    
    position = [
      THREE.MathUtils.randFloatSpread(280),
      THREE.MathUtils.randFloat(-60, 160),
      -149.9 + bump,
    ];
    rotation = [0, 0, Math.random() * Math.PI * 2];
  } else if (wallChoice === 1) {
    
    position = [
      -149.9 + bump,
      THREE.MathUtils.randFloat(-60, 160),
      THREE.MathUtils.randFloatSpread(280),
    ];
    rotation = [0, Math.PI / 2, Math.random() * Math.PI * 2];
  } else if (wallChoice === 2) {
    
    position = [
      149.9 - bump,
      THREE.MathUtils.randFloat(-60, 160),
      THREE.MathUtils.randFloatSpread(280),
    ];
    rotation = [0, -Math.PI / 2, Math.random() * Math.PI * 2];
  } else if (wallChoice === 3) {
    
    position = [
      THREE.MathUtils.randFloatSpread(280),
      -49.9 + bump,
      THREE.MathUtils.randFloatSpread(280),
    ];
    rotation = [-Math.PI / 2, 0, Math.random() * Math.PI * 2];
  } else {
    
    position = [
      THREE.MathUtils.randFloatSpread(280),
      149.9 - bump,
      THREE.MathUtils.randFloatSpread(280),
    ];
    rotation = [Math.PI / 2, 0, Math.random() * Math.PI * 2];
  }

  const aspect = bloodTextureAspect || 1;
  const baseHeight = THREE.MathUtils.randFloat(60, 80);
  const geometry = new THREE.PlaneGeometry(baseHeight * aspect, baseHeight);
  const splat = new THREE.Mesh(geometry, mat);

  splat.position.set(...position);
  splat.rotation.set(...rotation);

  splat.rotation.x += THREE.MathUtils.randFloatSpread(0.1);
  splat.rotation.y += THREE.MathUtils.randFloatSpread(0.1);
  splat.castShadow = false;
  splat.receiveShadow = true;
  splat.renderOrder = 0;
  scene.add(splat);

  splat.userData = {
    spawnTime: clock.getElapsedTime(),
    initialColor: initialColor.clone(),
    finalColor: finalColor.clone(),
    darkenDuration: 10,
  };

  bloodSplats.push(splat);
}


export function updateBloodSplats(clock) {
  const elapsed = clock.getElapsedTime();
  bloodSplats.forEach((splat) => {
    
    const age = elapsed - splat.userData.spawnTime;
    
    const t = Math.min(age / splat.userData.darkenDuration, 1);
    
    splat.material.color
      .copy(splat.userData.initialColor)
      .lerp(splat.userData.finalColor, t);
  });
}
