import * as THREE from "three";

// Exported array to keep track of all blood splats.
export const bloodSplats = [];

let bloodTextureAspect = 1;
let bloodMaterialBase;

export function setupBlood() {
  const bloodTexture = new THREE.TextureLoader().load(
    "public/textures/f0e7b87a9b21de37e1723ce62fc416d8.png",
    (texture) => {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.encoding = THREE.sRGBEncoding;
      bloodTextureAspect = texture.image.width / texture.image.height;
    }
  );
  // Fallback in case the texture isn't loaded immediately.
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
    receiveShadow: true,
  });
}

export function spawnRandomBloodSplatter(scene, clock) {
  // Create a clone of the base material for individual customization.
  const mat = bloodMaterialBase.clone();
  
  // Choose a random initial color.
  const initialColor = new THREE.Color().setHSL(
    0,
    THREE.MathUtils.randFloat(0.6, 1.0),
    THREE.MathUtils.randFloat(0.4, 0.6)
  );
  mat.color.copy(initialColor);
  mat.opacity = THREE.MathUtils.randFloat(0.95, 1.0);

  // Determine a final, darker color.
  const finalColor = new THREE.Color().setHSL(
    0,
    THREE.MathUtils.randFloat(0.6, 1.0),
    THREE.MathUtils.randFloat(0.05, 0.2)
  );

  const aspect = bloodTextureAspect || 1;
  const baseHeight = THREE.MathUtils.randFloat(60, 80);
  const geometry = new THREE.PlaneGeometry(baseHeight * aspect, baseHeight);
  const splat = new THREE.Mesh(geometry, mat);

  // Randomly choose one wall (or the floor) where the splat appears.
  const wallChoice = Math.floor(Math.random() * 4);
  const bump = 0.05;

  if (wallChoice === 0) {
    // Back wall
    splat.position.set(
      THREE.MathUtils.randFloatSpread(280),
      THREE.MathUtils.randFloat(-60, 160),
      -149.9 + bump
    );
    splat.rotation.z = Math.random() * Math.PI * 2;
  } else if (wallChoice === 1) {
    // Left wall
    splat.position.set(
      -149.9 + bump,
      THREE.MathUtils.randFloat(-60, 160),
      THREE.MathUtils.randFloatSpread(280)
    );
    splat.rotation.set(0, Math.PI / 2, Math.random() * Math.PI * 2);
  } else if (wallChoice === 2) {
    // Right wall
    splat.position.set(
      149.9 - bump,
      THREE.MathUtils.randFloat(-60, 160),
      THREE.MathUtils.randFloatSpread(280)
    );
    splat.rotation.set(0, -Math.PI / 2, Math.random() * Math.PI * 2);
  } else {
    // Floor
    splat.position.set(
      THREE.MathUtils.randFloatSpread(280),
      -49.9 + bump,
      THREE.MathUtils.randFloatSpread(280)
    );
    splat.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
  }

  // Apply some slight random adjustments.
  splat.rotation.x += THREE.MathUtils.randFloatSpread(0.1);
  splat.rotation.y += THREE.MathUtils.randFloatSpread(0.1);
  splat.castShadow = false;
  splat.receiveShadow = true;
  splat.renderOrder = 0;
  scene.add(splat);

  // Save time and color data for later interpolation.
  splat.userData.spawnTime = clock.getElapsedTime();
  splat.userData.initialColor = initialColor.clone();
  splat.userData.finalColor = finalColor.clone();
  splat.userData.darkenDuration = 10; // Duration in seconds over which the splat darkens.

  // Add the splat to the exported array.
  bloodSplats.push(splat);
}

// Update each blood splat to gradually darken over time.
export function updateBloodSplats(clock) {
  const elapsed = clock.getElapsedTime();
  bloodSplats.forEach((splat) => {
    // Calculate the time passed since this splat spawned.
    const age = elapsed - splat.userData.spawnTime;
    // Ensure the interpolation factor (t) is between 0 and 1.
    const t = Math.min(age / splat.userData.darkenDuration, 1);
    // Linearly interpolate from the initial color to the final darker color.
    splat.material.color.copy(splat.userData.initialColor).lerp(splat.userData.finalColor, t);
  });
}
