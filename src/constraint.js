import * as THREE from "three";

export class Constraint {
  constructor(p1, p2, rest, stiffness, color = 0x000000) {
    this.p1 = p1;
    this.p2 = p2;
    this.rest = rest;
    this.stiffness = stiffness;
    this.active = true;
    this.color = color;
    this._delta = new THREE.Vector3();
  }

  satisfy() {
    if (!this.active) return;
    this._delta.copy(this.p2.position).sub(this.p1.position);
    const dist = this._delta.length();
    const diff = (dist - this.rest) / dist;
    const correction = this._delta.multiplyScalar(0.5 * this.stiffness * diff);
    if (!this.p1.pinned) this.p1.position.add(correction);
    if (!this.p2.pinned) this.p2.position.sub(correction);
  }
}
