uniform sampler2D uTexture;
uniform sampler2D uDistortionMap;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 center = uv - 0.5;
  center.x *= uResolution.x / uResolution.y;

  // Distance from center (for vignette + glow)
  float dist = length(center);

  // Pulsing soft glow
  float pulse = 0.2 + 0.1 * sin(uTime * 0.8);
  float glow = smoothstep(0.3 + pulse, 0.0, dist);

  // Vignette (light gray → white toward center)
  float vignette = smoothstep(1.5, 0.6, dist);

  // Slightly warm off-white base
  vec3 baseColor = vec3(0.98, 0.96, 0.95);

  // Glow adds warmth to center
  vec3 glowColor = vec3(1.0, 0.94, 0.9); // subtle rose-beige tone
  vec3 color = mix(baseColor, glowColor, glow * 0.5);

  // Apply vignette darkening subtly
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
