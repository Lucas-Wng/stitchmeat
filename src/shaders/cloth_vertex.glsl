uniform float time;
attribute float age;

varying vec3 vColor;
varying float vAge;
varying float vGlowPulse;

float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise(vec2 x) {
  vec2 p = floor(x), f = fract(x);
  f = f*f*(3.0 - 2.0*f);
  float n = p.x + p.y * 57.0;
  return mix(mix(hash(n), hash(n + 1.0), f.x),
             mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
}

void main() {
  vColor = color;
  vAge = age;

  // Organic glow flicker from time + position
  float pulse = sin(time * 4.0 + position.y * 10.0) * 0.5 + 0.5;
  float flicker = noise(position.xy * 4.0 + time * 0.8);

  vGlowPulse = pulse * 0.6 + flicker * 0.4;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
