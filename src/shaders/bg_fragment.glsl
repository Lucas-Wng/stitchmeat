uniform sampler2D uTexture;
uniform sampler2D uDistortionMap;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec2 distortion = texture2D(uDistortionMap, vUv).rg * 0.05;
  vec2 uv = vUv + distortion;
  vec4 texColor = texture2D(uTexture, uv);
  gl_FragColor = texColor;
}
