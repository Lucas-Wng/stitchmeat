let audioContext;
let tearBuffer = null;
let regenBuffer = null;
let isInitialized = false;

export async function initAudio() {
  if (isInitialized) return;
  isInitialized = true;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const [tearData, regenData] = await Promise.all([
    fetch('/sounds/tear.mp3').then(res => res.arrayBuffer()),
    fetch('/sounds/regen.mp3').then(res => res.arrayBuffer()),
  ]);

  [tearBuffer, regenBuffer] = await Promise.all([
    audioContext.decodeAudioData(tearData),
    audioContext.decodeAudioData(regenData),
  ]);
}

function playBuffer(buffer, pitchRange = 0.3) {
  if (!audioContext || !buffer) return;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 0.95 + Math.random() * pitchRange;
  source.connect(audioContext.destination);
  source.start(0);
}

export function playTearSound() {
  playBuffer(tearBuffer);
}

export function playRegenSound() {
  playBuffer(regenBuffer);
}
