import * as THREE from 'three';

export class Particle {
  constructor(x, y, z, damping) {
    this.position = new THREE.Vector3(x, y, z);
    this.prevPosition = this.position.clone().add(new THREE.Vector3(0, 0.001, 0));
    this.acceleration = new THREE.Vector3();
    this.damping = damping;
    this.pinned = false;
  }

  addForce(force) {
    this.acceleration.add(force);
  }

  update() {
    if (this.pinned) return;
    const temp = this.position.clone();
    const velocity = this.position.clone().sub(this.prevPosition).multiplyScalar(this.damping);
    this.position.add(velocity).add(this.acceleration);
    this.prevPosition.copy(temp);
    this.acceleration.set(0, 0, 0);
  }

  pin() {
    this.pinned = true;
  }

  isStable() {
    return this.velocity.lengthSq() < 0.01;
  }
  
}
