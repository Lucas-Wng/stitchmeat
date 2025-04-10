let audioContext;
let tearBuffer = null;
let regenBuffer = null;
let bgBuffer = null;
let bgSource = null; // Background buffer source
let bgDistortion = null;
let bgDelay = null;
let bgFilter = null;
let bgDistortionLevel = 0; // Increase this each time a tear occurs
let isInitialized = false;
let masterGainNode = null;
let tearCount = 0; // Number of tears

export async function initAudio() {
  if (isInitialized) return;
  isInitialized = true;

  // Initialize AudioContext
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Resume the AudioContext if it is suspended (required in some browsers)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Create a gain node and set default volume to 50%
  masterGainNode = audioContext.createGain();
  masterGainNode.gain.value = 0.5;
  masterGainNode.connect(audioContext.destination);

  // Fetch and decode all audio files concurrently
  const [tearData, regenData, bgData] = await Promise.all([
    fetch("/sounds/tear.mp3").then((res) => res.arrayBuffer()),
    fetch("/sounds/regen.mp3").then((res) => res.arrayBuffer()),
    fetch("/sounds/yeule.mp3").then((res) => res.arrayBuffer()),
  ]);

  [tearBuffer, regenBuffer, bgBuffer] = await Promise.all([
    audioContext.decodeAudioData(tearData),
    audioContext.decodeAudioData(regenData),
    audioContext.decodeAudioData(bgData),
  ]);
}

function playBuffer(buffer, pitchRange = 0.3, volume = 1) {
  if (!audioContext || !buffer) return;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 0.95 + Math.random() * pitchRange;
  
  // Create a temporary gain node for this sound effect
  const effectGain = audioContext.createGain();
  effectGain.gain.value = volume; // e.g., lower than 1 for quieter playback
  
  // Chain the nodes: source -> effectGain -> masterGainNode
  source.connect(effectGain);
  effectGain.connect(masterGainNode);
  source.start(0);
}


export function playTearSound() {
  playBuffer(tearBuffer, 0.2, 0.1);
}

export function playRegenSound() {
  playBuffer(regenBuffer, 0.3, 0.1);
}

function makeDistortionCurve(amount) {
  let n_samples = 44100;
  let curve = new Float32Array(n_samples);
  let deg = Math.PI / 180;
  for (let i = 0; i < n_samples; i++) {
    let x = (i * 2) / n_samples - 1;
    // This formula is one way to get a distortion curve; increase 'amount' for more distortion.
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function distortBgSound() {
  // Increment the tear counter.
  tearCount+= 0.002;

  // --- Distortion Effect ---
  // Each tear adds 15 units of distortion.
  const distortionAmount = tearCount * 5; // Lower multiplier for a gentler distortion change.
  bgDistortion.curve = makeDistortionCurve(distortionAmount);

  // --- Delay Effect (Note Repeat / Stutter) ---
  // Increase delay time slightly to create a stutter/repeat feel.
  // Start with a base delay of 0.05s and add 0.01s per tear, capped at 0.3s.
  const delayTime = Math.min(0.3, 0.05 + tearCount * 0.05);
  bgDelay.delayTime.setValueAtTime(delayTime, audioContext.currentTime);

  // --- Filter Effect ---
  // Lower the cutoff frequency to gradually muffle the audio.
  // Each tear subtracts 200 Hz from 22050 Hz, but it never goes below 500 Hz.
  const cutoffFrequency = Math.max(500, 22050 - tearCount * 200);
  bgFilter.frequency.setValueAtTime(cutoffFrequency, audioContext.currentTime);

  // Slightly increase the filter’s resonance (Q factor) to emphasize the effect.
  const filterQ = 1 + tearCount * 0.2;
  bgFilter.Q.setValueAtTime(filterQ, audioContext.currentTime);

  // --- Pitch Shifting ---
  // Gradually reduce the playback rate of the background source to shift its pitch.
  // Here we lower the playback rate by 0.01 per tear, but don't let it drop below 0.7.
  if (bgSource) {
    const newPlaybackRate = Math.max(0.1, 1 - tearCount * 0.1);
    bgSource.playbackRate.setValueAtTime(newPlaybackRate, audioContext.currentTime);
  }
}



export function playBgSound() {
  if (!audioContext || !bgBuffer) return;

  // Stop any previous background source
  if (bgSource) {
    bgSource.stop();
    bgSource.disconnect();
  }

  // Create a new source for the background sound
  bgSource = audioContext.createBufferSource();
  bgSource.buffer = bgBuffer;
  bgSource.loop = true;
  
  // Create or reuse effect nodes
  if (!bgDistortion) {
    bgDistortion = audioContext.createWaveShaper();
    bgDelay = audioContext.createDelay();
    bgFilter = audioContext.createBiquadFilter();

    // Set initial effect parameters
    bgDistortion.curve = makeDistortionCurve(0); // no distortion initially
    bgDelay.delayTime.value = 0; // no delay initially
    bgFilter.type = "lowpass";
    bgFilter.frequency.value = 22050; // full frequency range
  }
  
  // Build the chain:
  // Background Source -> Distortion -> Delay -> Filter -> Master Gain
  bgSource.connect(bgDistortion);
  bgDistortion.connect(bgDelay);
  bgDelay.connect(bgFilter);
  bgFilter.connect(masterGainNode);

  bgSource.start(0);
}


export function stopBgSound() {
  if (bgSource) {
    bgSource.stop();
    bgSource.disconnect();
    bgSource = null;
  }
}

// Function to control volume; pass a value between 0 and 1.
export function setVolume(volume) {
  if (masterGainNode) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    masterGainNode.gain.value = clampedVolume;
  }
}
