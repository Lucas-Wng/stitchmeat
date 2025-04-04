export class Quadtree {
    constructor(bounds, capacity = 4) {
      this.bounds = bounds;
      this.capacity = capacity;
      this.particles = [];
      this.divided = false;
    }
  
    subdivide() {
      const { x, y, w, h } = this.bounds;
      const hw = w / 2, hh = h / 2;
  
      this.nw = new Quadtree({ x: x, y: y, w: hw, h: hh }, this.capacity);
      this.ne = new Quadtree({ x: x + hw, y: y, w: hw, h: hh }, this.capacity);
      this.sw = new Quadtree({ x: x, y: y - hh, w: hw, h: hh }, this.capacity);
      this.se = new Quadtree({ x: x + hw, y: y - hh, w: hw, h: hh }, this.capacity);
  
      this.divided = true;
    }
  
    insert(particle) {
      const { x, y, w, h } = this.bounds;
      const px = particle.position.x, py = particle.position.y;
  
      if (px < x || px > x + w || py > y || py < y - h) return false;
  
      if (this.particles.length < this.capacity) {
        this.particles.push(particle);
        return true;
      }
  
      if (!this.divided) this.subdivide();
  
      return (
        this.nw.insert(particle) ||
        this.ne.insert(particle) ||
        this.sw.insert(particle) ||
        this.se.insert(particle)
      );
    }
  
    query(range, found = []) {
      const { x, y, w, h } = this.bounds;
      const rx = range.x, ry = range.y, rw = range.w, rh = range.h;
  
      if (
        x + w < rx || x > rx + rw ||
        y - h > ry || y < ry - rh
      ) return found;
  
      for (const p of this.particles) {
        const px = p.position.x, py = p.position.y;
        if (
          px >= rx && px <= rx + rw &&
          py <= ry && py >= ry - rh
        ) found.push(p);
      }
  
      if (this.divided) {
        this.nw.query(range, found);
        this.ne.query(range, found);
        this.sw.query(range, found);
        this.se.query(range, found);
      }
  
      return found;
    }
  }
  