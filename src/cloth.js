import * as THREE from 'three';
import { Particle } from './particle.js';
import { Constraint } from './constraint.js';
import { Quadtree } from './quadtree.js';
import { initAudio, playTearSound, playRegenSound } from './audio.js';
import vertexShader from './shaders/cloth_vertex.glsl?raw';
import fragmentShader from './shaders/cloth_fragment.glsl?raw';


export function createClothSimulation(scene, camera, onTearCallback) {
  const clothWidth = 400, clothHeight = 50, spacing = 0.3;
  const gravity = new THREE.Vector3(0, -0.03, 0);
  const stiffness = 0.95, damping = 0.95;
  const particles = [], constraints = [], broken = [];

  const offsetX = -clothWidth * spacing / 2;
  const offsetY = clothHeight * spacing / 2 + 20;

  for (let y = 0; y <= clothHeight; y++) {
    for (let x = 0; x <= clothWidth; x++) {
      const yRatio = y / clothHeight;
      const flareFactor = 1.5;
      const xTaper = ((x / clothWidth) - 0.5) * spacing * clothWidth;
      const taperedX = xTaper * (1 + yRatio * flareFactor);
      const p = new Particle(taperedX, -y * spacing + offsetY, 0, damping);

      const attractors = [
        { x: 50, y: 0 },
        { x: 200, y: 0 },
        { x: 350, y: 0 }
      ];
      for (const attractor of attractors) {
        const dx = x - attractor.x;
        const dy = y - attractor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10 && Math.random() > dist / 10) p.pin();
      }

      particles.push(p);

      if (x > 0) {
        const left = particles[particles.length - 2];
        constraints.push(new Constraint(left, p, spacing, stiffness));
      }
      if (y > 0) {
        const above = particles[(y - 1) * (clothWidth + 1) + x];
        constraints.push(new Constraint(above, p, spacing, stiffness));
      }
    }
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isMouseDown = false;
  window.addEventListener('mousedown', () => {
    initAudio();
  }, { once: true });  
  window.addEventListener('mousedown', () => isMouseDown = true);
  window.addEventListener('mouseup', () => isMouseDown = false);
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (isMouseDown) {
      raycaster.setFromCamera(mouse, camera);
      constraints.forEach(c => {
        if (!c.active) return;
        const mid = c.p1.position.clone().add(c.p2.position).multiplyScalar(0.5);
        const dist = raycaster.ray.distanceToPoint(mid);
        if (dist < 0.4) {
          c.active = false;
          if (!broken.some(b => b.constraint === c)) {
            broken.push({ constraint: c, time: performance.now() });
          }
          onTearCallback(mid);

          playTearSound();
        }
      });
    }
  });

  setInterval(() => {
    const now = performance.now();
    const regenDelay = 1500;
  
    if (!broken.length) return;
  
    const eligible = broken.filter(b => now - b.time >= regenDelay);
    if (!eligible.length) return;
  
    const b = eligible[Math.floor(Math.random() * eligible.length)];
    const { constraint } = b;
    const dist = constraint.p1.position.distanceTo(constraint.p2.position);
  
    if (dist >= spacing * 60) return;
  
    const tensionFactor = 0.5 + Math.random() * 0.2;
    constraint.rest = dist * tensionFactor;
    constraint.color = new THREE.Color().setHSL(0, 1, 0.55 + Math.random() * 0.1).getHex();
    constraint.active = true;
    constraint.createdAt = now;
  
    broken.splice(broken.indexOf(b), 1);
  
    const quadtree = new Quadtree({ x: -40, y: 60, w: 80, h: 80 });
    particles.forEach(p => quadtree.insert(p));
  
    const anchor = Math.random() < 0.5 ? constraint.p1 : constraint.p2;
  
    let local = quadtree.query({
      x: anchor.position.x - 3,
      y: anchor.position.y + 3,
      w: 6,
      h: 6
    });
  
    if (local.length < 4) {
      local = quadtree.query({
        x: anchor.position.x - 6,
        y: anchor.position.y + 6,
        w: 12,
        h: 12
      });
    }
  
    const clusters = 10 + Math.floor(Math.random() * 10); // more clusters
    for (let i = 0; i < clusters; i++) {
      let partner = (Math.random() < 0.9 && local.length)
        ? local[Math.floor(Math.random() * local.length)]
        : null;
  
      if (!partner || partner === anchor || partner.pinned) continue;
  
      const baseDistance = anchor.position.distanceTo(partner.position);
      if (baseDistance > spacing * 4) continue; // tighter range
  
      const lines = 6 + Math.floor(Math.random() * 6); // more lines per cluster
      for (let j = 0; j < lines; j++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.03 + Math.random() * 0.15; // tighter noise
        const offset = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (Math.random() - 0.5) * 0.2
        );
  
        const noisy = {
          position: partner.position.clone().add(offset),
          pinned: false
        };
  
        const d = anchor.position.distanceTo(noisy.position);
        const col = new THREE.Color().setHSL(
          0.0 + Math.random() * 0.05,
          0.6 + Math.random() * 0.4,
          0.04 + Math.random() * 0.1
        );
  
        const stiffness = 0.85 + Math.random() * 0.15;
        const newConstraint = new Constraint(anchor, noisy, d, stiffness, col.getHex());
        newConstraint.createdAt = now;
  
        if (constraints.length < 60000) constraints.push(newConstraint);
  
        // Dense loop structure (more likely, tighter)
        if (Math.random() < 0.5 && local.length > 2) {
          const loop = local[Math.floor(Math.random() * local.length)];
          if (loop !== partner && loop !== anchor) {
            const loopD = anchor.position.distanceTo(loop.position);
            const loopCol = new THREE.Color().setHSL(0.01 + Math.random() * 0.03, 1, 0.06 + Math.random() * 0.1);
            const loopConstraint = new Constraint(anchor, loop, loopD, stiffness, loopCol.getHex());
            loopConstraint.createdAt = now;
            constraints.push(loopConstraint);
          }
        }
      }
    }
  
    // playRegenSound();
    console.log("scar regen: dense overload");
  }, 80);
  
  
  
  const maxSegments = (clothWidth + 1) * (clothHeight + 1) * 4;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxSegments * 2 * 3);
  const colors = new Float32Array(maxSegments * 2 * 3);
  const ages = new Float32Array(maxSegments * 2);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0 }
    },
    vertexColors: true,
    transparent: true,
    depthWrite: false
  });  
  const mesh = new THREE.LineSegments(geometry, material);
  scene.add(mesh);

  return {
    update() {
      material.uniforms.time.value = performance.now() * 0.001;
      const now = performance.now();
      const quadtree = new Quadtree({ x: -40, y: 60, w: 80, h: 80 });
      particles.forEach(p => {
        p.addForce(gravity);
        p.update();
        quadtree.insert(p);
      });

      for (let i = 0; i < 5; i++) constraints.forEach(c => c.satisfy());

      const segments = constraints.filter(c => c.active);
      let index = 0;
      segments.forEach(c => {
        const col = new THREE.Color(c.color);
        const age = c.createdAt ? (now - c.createdAt) / 1000 : 0;
        [c.p1, c.p2].forEach(p => {
          positions.set([p.position.x, p.position.y, p.position.z], index * 3);
          colors.set([col.r, col.g, col.b], index * 3);
          ages[index] = age;
          index++;
        });
      });

      geometry.setDrawRange(0, index);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.age.needsUpdate = true;
    }
  };
}
