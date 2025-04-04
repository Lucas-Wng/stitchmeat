import * as THREE from 'three';
import { Particle } from './particle.js';
import { Constraint } from './constraint.js';
import { Quadtree } from './quadtree.js';
import { initAudio, playTearSound, playRegenSound } from './audio.js';
import vertexShader from './shaders/cloth_vertex.glsl?raw';
import fragmentShader from './shaders/cloth_fragment.glsl?raw';

export function createClothSimulation(scene, camera, onTearCallback) {
  const clothWidth = 400, clothHeight = 60, spacing = 0.3;
  const gravity = new THREE.Vector3(0, -0.02, 0);
  const stiffness = 0.95, damping = 0.98;
  const totalParticles = (clothWidth + 1) * (clothHeight + 1);

  const particles = new Array(totalParticles);
  const constraints = [];
  const broken = [];

  const offsetX = -clothWidth * spacing / 2;
  const offsetY = clothHeight * spacing / 2 + 25;

  const attractors = [ { x: 50, y: 0 }, { x: 200, y: 0 }, { x: 350, y: 0 } ];

  function createParticlesAndConstraints() {
    let index = 0;
    for (let y = 0; y <= clothHeight; y++) {
      const yRatio = y / clothHeight;
      for (let x = 0; x <= clothWidth; x++, index++) {
        const xTaper = ((x / clothWidth) - 0.5) * spacing * clothWidth;
        const taperedX = xTaper * (1 + yRatio * 1.5);
        const p = new Particle(taperedX, -y * spacing + offsetY, 0, damping);

        for (const attractor of attractors) {
          const dx = x - attractor.x, dy = y - attractor.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 10 && Math.random() > dist / 10) p.pin();
        }

        particles[index] = p;

        if (x > 0) {
          const left = particles[index - 1];
          constraints.push(new Constraint(left, p, spacing, stiffness));
        }
        if (y > 0) {
          const above = particles[index - (clothWidth + 1)];
          constraints.push(new Constraint(above, p, spacing, stiffness));
        }
      }
    }
  }

  function setupMouseInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const mid = new THREE.Vector3();
    let isMouseDown = false;

    const handleMouseMove = (e) => {
      if (!isMouseDown) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      for (const c of constraints) {
        if (!c.active) continue;
        mid.addVectors(c.p1.position, c.p2.position).multiplyScalar(0.5);
        if (raycaster.ray.distanceToPoint(mid) < 0.4) {
          c.active = false;
          if (!broken.some(b => b.constraint === c)) {
            broken.push({ constraint: c, time: performance.now() });
            onTearCallback(mid.clone());
            playTearSound();
          }
        }
      }
    };

    window.addEventListener('mousedown', () => {
      initAudio();
      isMouseDown = true;
    }, { once: true });

    window.addEventListener('mousedown', () => isMouseDown = true);
    window.addEventListener('mouseup', () => isMouseDown = false);
    window.addEventListener('mousemove', handleMouseMove);
  }

  function regenerateConstraints() {
    setInterval(() => {
      if (!broken.length) return;

      const now = performance.now();
      const eligible = broken.filter(b => now - b.time >= 800 + Math.random() * 500);
      if (!eligible.length) return;

      const count = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const b = eligible[Math.floor(Math.random() * eligible.length)];
        if (!b) continue;

        const { constraint } = b;
        const dist = constraint.p1.position.distanceTo(constraint.p2.position);
        if (dist > spacing * 200) continue;

        const restNoise = spacing * (0.5 + Math.random() * 1.5);

        let hue;
        let saturation, lightness;

        if (Math.random() < 0.85) {
          // Brighter, richer reds
          hue = 0.0 + Math.random() * 0.03;
          saturation = 0.85 + Math.random() * 0.15;    // boost richness
          lightness = 0.2 + Math.random() * 0.15;      // slightly brighter
        } else {
          // Sickly infected tones
          hue = 0.11 + Math.random() * 0.07;
          saturation = 0.7 + Math.random() * 0.2;
          lightness = 0.12 + Math.random() * 0.15;
        }
        const pulseColor = new THREE.Color().setHSL(hue, saturation, lightness);


        Object.assign(constraint, {
          rest: restNoise,
          color: pulseColor.getHex(),
          active: true,
          createdAt: now,
          finalScarColor: pulseColor.clone()
        });

        const jitterStrength = 0.15 + Math.random() * 0.08;
        constraint.p1.position.addScalar((Math.random() - 0.5) * jitterStrength);
        constraint.p2.position.addScalar((Math.random() - 0.5) * jitterStrength);

        if (constraint.scarTrail) {
          constraint.scarTrail.push({
            time: now,
            color: pulseColor.clone(),
            pos1: constraint.p1.position.clone(),
            pos2: constraint.p2.position.clone()
          });
        }

        broken.splice(broken.indexOf(b), 1);
        playRegenSound({ intensity: 1, glitch: true });

        const anchor = Math.random() < 0.5 ? constraint.p1 : constraint.p2;
        const quadtree = new Quadtree({ x: -60, y: 60, w: 120, h: 120 });
        particles.forEach(p => quadtree.insert(p));

        let local = quadtree.query({
          x: anchor.position.x - 5,
          y: anchor.position.y + 5,
          w: 10,
          h: 10
        });

        if (local.length < 3) {
          local = quadtree.query({
            x: anchor.position.x - 10,
            y: anchor.position.y + 10,
            w: 20,
            h: 20
          });
        }

        const clusters = 9 + Math.floor(Math.random() * 8);
        for (let c = 0; c < clusters; c++) {
          let partner = (Math.random() < 0.95 && local.length)
            ? local[Math.floor(Math.random() * local.length)]
            : null;

          if (!partner || partner === anchor || partner.pinned) continue;

          const baseDistance = anchor.position.distanceTo(partner.position);
          if (baseDistance > spacing * 6) continue;

          const lines = 5 + Math.floor(Math.random() * 6);
          for (let j = 0; j < lines; j++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.02 + Math.random() * 0.25;
            const offset = new THREE.Vector3(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              (Math.random() - 0.5) * 0.4
            );

            const noisy = {
              position: partner.position.clone().add(offset),
              pinned: false
            };

            const d = anchor.position.distanceTo(noisy.position);
            const scarColor = new THREE.Color().setHSL(
              Math.random(), 1, 0.03 + Math.random() * 0.07
            );

            const stiffness = 0.07 + Math.random() * 0.2;
            const newConstraint = new Constraint(anchor, noisy, d, stiffness, scarColor.getHex());
            newConstraint.createdAt = now;
            newConstraint.finalScarColor = scarColor.clone();

            if (constraints.length < 70000) constraints.push(newConstraint);

            if (Math.random() < 0.7 && local.length > 2) {
              const loop = local[Math.floor(Math.random() * local.length)];
              if (loop !== partner && loop !== anchor) {
                const loopD = anchor.position.distanceTo(loop.position);
                const loopColor = new THREE.Color().setHSL(Math.random(), 1, 0.05 + Math.random() * 0.1);
                const loopConstraint = new Constraint(anchor, loop, loopD, stiffness, loopColor.getHex());
                loopConstraint.createdAt = now;
                loopConstraint.finalScarColor = loopColor.clone();
                constraints.push(loopConstraint);
              }
            }
          }
        }
      }
    }, 50 + Math.random() * 60);
  }

  createParticlesAndConstraints();
  setupMouseInteraction();
  regenerateConstraints();

  const maxSegments = totalParticles * 4;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxSegments * 2 * 3);
  const colors = new Float32Array(maxSegments * 2 * 3);
  const finalColors = new Float32Array(maxSegments * 2 * 3); // new
  const ages = new Float32Array(maxSegments * 2);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('finalColor', new THREE.BufferAttribute(finalColors, 3)); // new
  geometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { time: { value: 0 } },
    vertexColors: true,
    transparent: true,
    depthWrite: false
  });

  const mesh = new THREE.LineSegments(geometry, material);
  scene.add(mesh);

  return {
    update() {
      const now = performance.now();
      material.uniforms.time.value = now * 0.001;

      const quadtree = new Quadtree({ x: -40, y: 60, w: 80, h: 80 });
      for (const p of particles) {
        p.addForce(gravity);
        p.update();
        quadtree.insert(p);
      }

      for (let i = 0; i < 5; i++) {
        for (const c of constraints) c.satisfy();
      }

      let index = 0;
      const color = new THREE.Color();
      const finalColor = new THREE.Color();

      for (const c of constraints) {
        if (!c.active) continue;
        color.setHex(c.color);
        const age = c.createdAt ? (now - c.createdAt) / 1000 : 0;

        [c.p1, c.p2].forEach(p => {
          positions.set(p.position.toArray(), index * 3);
          colors.set([color.r, color.g, color.b], index * 3);
          ages[index] = age;

          finalColor.copy(c.finalScarColor || color);
          finalColors.set([finalColor.r, finalColor.g, finalColor.b], index * 3);

          index++;
        });
      }

      geometry.setDrawRange(0, index);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.finalColor.needsUpdate = true;
      geometry.attributes.age.needsUpdate = true;
    }
  };
}
