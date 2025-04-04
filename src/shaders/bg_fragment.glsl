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

  // Subtle pulsating glow at center
  float pulse = 0.2 + 0.1 * sin(uTime * 0.5);
  float glow = smoothstep(0.3 + pulse, 0.0, dist);

  // Base background color (deep blood red)
  vec3 baseColor = vec3(0.07, 0.02, 0.02);

  // Glow color
  vec3 glowColor = vec3(0.4, 0.05, 0.1); // crimson glow

  // Combine glow and base
  vec3 color = mix(baseColor, glowColor, glow);

  // Vignette fade to black
  float vignette = smoothstep(1.0, 0.4, dist);
  color *= vignette;

  gl_FragColor = vec4(1,1,1, 1.0);
}
