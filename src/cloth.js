import * as THREE from "three";
import { Particle } from "./particle.js";
import { Constraint } from "./constraint.js";
import { Quadtree } from "./quadtree.js";
import {
  initAudio,
  playTearSound,
  playRegenSound,
  playBgSound,
  distortBgSound,
} from "./audio.js";
import vertexShader from "./shaders/cloth_vertex.glsl?raw";
import fragmentShader from "./shaders/cloth_fragment.glsl?raw";

export function createClothSimulation(scene, camera, onTearCallback) {
  const clothWidth = 500,
    clothHeight = 130,
    spacing = 0.2;
  const gravity = new THREE.Vector3(0, -0.07, 0);
  const stiffness = 1.0,
    damping = 0.94;
  const totalParticles = (clothWidth + 1) * (clothHeight + 1);

  const particles = new Array(totalParticles);
  const constraints = [];
  const broken = [];

  const offsetX = (-clothWidth * spacing) / 2;
  const offsetY = (clothHeight * spacing) / 2 + 40;

  const attractors = [
    { x: 60, y: 70 },
    { x: 70, y: 10 },
    { x: 250, y: 15 },
    { x: 430, y: 12 },
    { x: 170, y: 45 },
    { x: 330, y: 59 },
    { x: 440, y: 68 },
    { x: 60, y: 71 },
    { x: 70, y: 11 },
    { x: 250, y: 16 },
    { x: 430, y: 13 },
    { x: 170, y: 46 },
    { x: 330, y: 60 },
    { x: 440, y: 69 },
    { x: 60, y: 69 },
    { x: 70, y: 9 },
    { x: 250, y: 14 },
    { x: 430, y: 11 },
    { x: 170, y: 44 },
    { x: 330, y: 58 },
    { x: 440, y: 67 },
    { x: 60, y: 68 },
    { x: 70, y: 8 },
    { x: 250, y: 13 },
    { x: 430, y: 10 },
    { x: 170, y: 43 },
    { x: 330, y: 57 },
    { x: 440, y: 66 },
  ];
  for (let i = 0; i < attractors.length; i++) {
    const a = attractors[i];
    a.y = a.y + 30;
  }

  
  const tempMid = new THREE.Vector3();

  
  
  let isAudioInitialized = false;
  let isMouseDown = false;

  function createParticlesAndConstraints() {
    let index = 0;
    for (let y = 0; y <= clothHeight; y++) {
      const yRatio = y / clothHeight;
      for (let x = 0; x <= clothWidth; x++, index++) {
        
        const xTaper = (x / clothWidth - 0.5) * spacing * clothWidth;
        const taperedX = xTaper * (1 + yRatio * 1.5);
        const p = new Particle(taperedX, -y * spacing + offsetY, 0, damping);

        
        for (let i = 0, len = attractors.length; i < len; i++) {
          const attractor = attractors[i];
          const dx = x - attractor.x;
          const dy = y - attractor.y;
          
          const distSq = dx * dx + dy * dy;
          const prob = Math.sqrt(distSq) / 10;
          if (distSq < 100 && Math.random() > prob) {
            p.pin();
            break; 
          }
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

    const handleMouseDown = (e) => {
      
      if (!isAudioInitialized) {
        initAudio().then(() => {
          playBgSound();
        });
        isAudioInitialized = true;
      }
      isMouseDown = true;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", () => (isMouseDown = false));

    window.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      
      for (let i = 0, len = constraints.length; i < len; i++) {
        const c = constraints[i];
        if (!c.active) continue;
        
        tempMid.addVectors(c.p1.position, c.p2.position).multiplyScalar(0.5);
        if (raycaster.ray.distanceToPoint(tempMid) < 0.35) {
          c.active = false;
          if (!broken.some((b) => b.constraint === c)) {
            broken.push({ constraint: c, time: performance.now() });
            onTearCallback(tempMid.clone());
            playTearSound();
            distortBgSound();
          }
        }
      }
    });
  }

  function regenerateConstraints() {
    
    const localQuadtree = new Quadtree({ x: -60, y: 60, w: 120, h: 120 });

    setInterval(() => {
      const now = performance.now();
      if (!broken.length) return;

      const eligible = broken.filter(
        (b) => now - b.time >= 800 + Math.random() * 500
      );
      if (!eligible.length) return;

      
      localQuadtree.clear();
      for (let j = 0, len = particles.length; j < len; j++) {
        localQuadtree.insert(particles[j]);
      }

      
      const count = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const b = eligible[Math.floor(Math.random() * eligible.length)];
        if (!b) continue;

        const { constraint } = b;
        const dist = constraint.p1.position.distanceTo(constraint.p2.position);
        if (dist > spacing * 100) continue;

        const restNoise = spacing * (0.5 + Math.random() * 1.5);
        let hue, saturation, lightness;

        if (Math.random() < 0.85) {
          hue = 0.0 + Math.random() * 0.03;
          saturation = 0.85 + Math.random() * 0.15;
          lightness = 0.2 + Math.random() * 0.15;
        } else {
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
          finalScarColor: pulseColor.clone(),
        });

        
        const jitterStrength = 0.15 + Math.random() * 0.08;
        constraint.p1.position.x += (Math.random() - 0.5) * jitterStrength;
        constraint.p1.position.y += (Math.random() - 0.5) * jitterStrength;
        constraint.p1.position.z += (Math.random() - 0.5) * jitterStrength;
        constraint.p2.position.x += (Math.random() - 0.5) * jitterStrength;
        constraint.p2.position.y += (Math.random() - 0.5) * jitterStrength;
        constraint.p2.position.z += (Math.random() - 0.5) * jitterStrength;

        if (constraint.scarTrail) {
          constraint.scarTrail.push({
            time: now,
            color: pulseColor.clone(),
            pos1: constraint.p1.position.clone(),
            pos2: constraint.p2.position.clone(),
          });
        }

        broken.splice(broken.indexOf(b), 1);
        playRegenSound({ intensity: 1, glitch: true });

        const anchor = Math.random() < 0.5 ? constraint.p1 : constraint.p2;
        
        const queryBox = {
          x: anchor.position.x - 5,
          y: anchor.position.y + 5,
          w: 10,
          h: 10,
        };
        let local = localQuadtree.query(queryBox);
        if (local.length < 3) {
          queryBox.x = anchor.position.x - 10;
          queryBox.y = anchor.position.y + 10;
          queryBox.w = 20;
          queryBox.h = 20;
          local = localQuadtree.query(queryBox);
        }

        const clusters = 9 + Math.floor(Math.random() * 8);
        for (let c = 0; c < clusters; c++) {
          let partner =
            Math.random() < 0.95 && local.length
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
              pinned: false,
            };

            const d = anchor.position.distanceTo(noisy.position);
            const scarColor = new THREE.Color().setHSL(
              Math.random(),
              1,
              0.03 + Math.random() * 0.07
            );
            const stiffness = 0.07 + Math.random() * 0.2;
            const newConstraint = new Constraint(
              anchor,
              noisy,
              d,
              stiffness,
              scarColor.getHex()
            );
            newConstraint.createdAt = now;
            newConstraint.finalScarColor = scarColor.clone();

            if (constraints.length < 70000) constraints.push(newConstraint);

            if (Math.random() < 0.7 && local.length > 2) {
              const loop = local[Math.floor(Math.random() * local.length)];
              if (loop !== partner && loop !== anchor) {
                const loopD = anchor.position.distanceTo(loop.position);
                const loopColor = new THREE.Color().setHSL(
                  Math.random(),
                  1,
                  0.05 + Math.random() * 0.1
                );
                const loopConstraint = new Constraint(
                  anchor,
                  loop,
                  loopD,
                  stiffness,
                  loopColor.getHex()
                );
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
  const finalColors = new Float32Array(maxSegments * 2 * 3);
  const ages = new Float32Array(maxSegments * 2);

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute(
    "finalColor",
    new THREE.BufferAttribute(finalColors, 3)
  );
  geometry.setAttribute("age", new THREE.BufferAttribute(ages, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { time: { value: 0 } },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    
  });

  const mesh = new THREE.LineSegments(geometry, material);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  scene.add(mesh);

  const tempPos = new THREE.Vector3();
  const color = new THREE.Color();
  const finalColor = new THREE.Color();
  
  const simulationQuadtree = new Quadtree({ x: -40, y: 60, w: 80, h: 80 });

  return {
    mesh,
    update() {
      const now = performance.now();
      material.uniforms.time.value = now * 0.001;

      simulationQuadtree.clear();

      for (let i = 0, len = particles.length; i < len; i++) {
        const p = particles[i];
        p.addForce(gravity);
        p.update();
        simulationQuadtree.insert(p);
      }

      for (let iter = 0; iter < 7; iter++) {
        for (let i = 0, clen = constraints.length; i < clen; i++) {
          constraints[i].satisfy();
        }
      }

      let index = 0;
      for (let i = 0, clen = constraints.length; i < clen; i++) {
        const c = constraints[i];
        if (!c.active) continue;
        color.setHex(c.color);
        const age = c.createdAt ? (now - c.createdAt) / 1000 : 0;

        const pts = [c.p1, c.p2];
        for (let j = 0; j < 2; j++) {
          tempPos.copy(pts[j].position);
          positions[index * 3] = tempPos.x;
          positions[index * 3 + 1] = tempPos.y;
          positions[index * 3 + 2] = tempPos.z;

          colors[index * 3] = color.r;
          colors[index * 3 + 1] = color.g;
          colors[index * 3 + 2] = color.b;
          ages[index] = age;

          finalColor.copy(c.finalScarColor || color);
          finalColors[index * 3] = finalColor.r;
          finalColors[index * 3 + 1] = finalColor.g;
          finalColors[index * 3 + 2] = finalColor.b;

          index++;
        }
      }

      geometry.setDrawRange(0, index);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.finalColor.needsUpdate = true;
      geometry.attributes.age.needsUpdate = true;
    },
  };
}
