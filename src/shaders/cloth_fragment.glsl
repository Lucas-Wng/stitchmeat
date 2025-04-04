varying vec3 vColor;
varying float vAge;
varying float vGlowPulse;

void main() {
  // Scar glow intensity based on red channel and animated pulse
  float scarGlow = smoothstep(0.3, 1.0, vColor.r) * vGlowPulse;

  // Soft glow color, modulated
  vec3 glowColor = mix(vColor, vec3(1.0, 0.3, 0.5), scarGlow * 0.8);

  // Age-based fade toward dried blood / burn tone
  vec3 scarFadeTarget = vec3(0.34, 0.06, 0.06);
  float fadeFactor = smoothstep(3.0, 15.0, vAge); // tweak for faster/slower fade

  // Final blend: glowing color → scar tissue over time
  vec3 finalColor = mix(glowColor, scarFadeTarget, fadeFactor);

  float alpha = 1.0;

  gl_FragColor = vec4(finalColor, alpha);
}
