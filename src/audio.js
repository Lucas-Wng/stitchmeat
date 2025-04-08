let audioContext;
let tearBuffer = null;
let regenBuffer = null;
let isInitialized = false;
let masterGainNode = null; // Add this for volume control

export async function initAudio() {
  if (isInitialized) return;
  isInitialized = true;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Create gain node and set initial volume (0.5 = 50% volume)
  masterGainNode = audioContext.createGain();
  masterGainNode.gain.value = 0.1; // Set default volume to 50%
  masterGainNode.connect(audioContext.destination);

  const [tearData, regenData] = await Promise.all([
    fetch("/sounds/tear.mp3").then((res) => res.arrayBuffer()),
    fetch("/sounds/regen.mp3").then((res) => res.arrayBuffer()),
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

  // Connect to gain node instead of directly to destination
  source.connect(masterGainNode);
  source.start(0);
}

// Add this new function to control volume
export function setVolume(volume) {
  if (masterGainNode) {
    // Ensure volume is between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));
    masterGainNode.gain.value = clampedVolume;
  }
}

export function playTearSound() {
  playBuffer(tearBuffer);
}

export function playRegenSound() {
  playBuffer(regenBuffer);
}
