import * as THREE from "three";

export function createDistortionMap(size) {
  const data = new Uint8Array(size * size * 3);
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
  texture.needsUpdate = true;
  return { data, texture, size };
}

export function updateDistortionMap(position, { data, size, texture }) {
  const u = Math.floor(((position.x + 40) / 80) * size);
  const v = Math.floor(((40 - position.y) / 80) * size);
  const r = 3;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const i = ((v + dy) * size + (u + dx)) * 3;
      if (i >= 0 && i < data.length) {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
  }
  texture.needsUpdate = true;
}

export function fadeDistortion({ data, texture }) {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.max(0, data[i] - 1);
  }
  texture.needsUpdate = true;
}
