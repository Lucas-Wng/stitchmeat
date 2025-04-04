precision mediump float;

uniform float uTime;
uniform vec2 uResolution;

varying vec3 vColor;
varying vec3 vFinalScarColor;
varying float vAge;
varying float vGlowPulse;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x)
       + (c - a) * u.y * (1.0 - u.x)
       + (d - b) * u.x * u.y;
}

void main() {
  float scarGlow = smoothstep(0.2, 1.0, vColor.r) * vGlowPulse;
  vec3 glowColor = mix(vColor, vec3(1.0, 0.3, 0.5), scarGlow * 0.7); // chaotic glowing color

  // Final dark red tone (realistic dried blood)
  vec3 finalDarkRed = vec3(0.2, 0.03, 0.03); // deep blood-maroon

  // Fade factor for age
  float fadeFactor = smoothstep(5.0, 18.0, vAge); // fade later, keep colors longer

  // Age-based scar texture
  float scarNoise = noise(gl_FragCoord.xy * 0.02 + uTime * 0.05);
  float crackiness = smoothstep(0.4, 0.9, scarNoise) * 0.5;

  // Subtle mid-age bruise tint
  vec3 bruiseColor = vec3(0.12, 0.03, 0.06);
  float bruiseFactor = exp(-pow((vAge - 6.0) / 4.0, 2.0));
  vec3 bruised = mix(vFinalScarColor, bruiseColor, bruiseFactor * 0.5);

  // Healing color blend (chaotic colors)
  vec3 healingColor = mix(glowColor, bruised, smoothstep(1.0, 6.0, vAge));

  // Final blend: chaotic → bruised → dark red
  vec3 midBlend = mix(healingColor, finalDarkRed, fadeFactor);
  vec3 finalColor = mix(midBlend, midBlend * (1.0 - crackiness), fadeFactor * 0.6);

  gl_FragColor = vec4(finalColor, 1.0);
}
