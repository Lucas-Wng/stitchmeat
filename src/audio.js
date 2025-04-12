let audioContext;
let tearBuffer = null;
let regenBuffer = null;
let bgBuffer = null;
let bgSource = null; 
let bgDistortion = null;
let bgDelay = null;
let bgFilter = null;
let bgDistortionLevel = 0; 
let isInitialized = false;
let masterGainNode = null;
let tearCount = 0; 

export async function initAudio() {
  if (isInitialized) return;
  isInitialized = true;

  
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  
  masterGainNode = audioContext.createGain();
  masterGainNode.gain.value = 0.5;
  masterGainNode.connect(audioContext.destination);

  
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
  
  
  const effectGain = audioContext.createGain();
  effectGain.gain.value = volume; 
  
  
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
    
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function distortBgSound() {
  
  tearCount+= 0.002;

  
  
  const distortionAmount = tearCount * 5; 
  bgDistortion.curve = makeDistortionCurve(distortionAmount);

  
  
  
  const delayTime = Math.min(0.3, 0.05 + tearCount * 0.05);
  bgDelay.delayTime.setValueAtTime(delayTime, audioContext.currentTime);

  
  
  
  const cutoffFrequency = Math.max(500, 22050 - tearCount * 200);
  bgFilter.frequency.setValueAtTime(cutoffFrequency, audioContext.currentTime);

  
  const filterQ = 1 + tearCount * 0.2;
  bgFilter.Q.setValueAtTime(filterQ, audioContext.currentTime);

  
  
  
  if (bgSource) {
    const newPlaybackRate = Math.max(0.1, 1 - tearCount * 0.1);
    bgSource.playbackRate.setValueAtTime(newPlaybackRate, audioContext.currentTime);
  }
}



export function playBgSound() {
  if (!audioContext || !bgBuffer) return;

  
  if (bgSource) {
    bgSource.stop();
    bgSource.disconnect();
  }

  
  bgSource = audioContext.createBufferSource();
  bgSource.buffer = bgBuffer;
  bgSource.loop = true;
  
  
  if (!bgDistortion) {
    bgDistortion = audioContext.createWaveShaper();
    bgDelay = audioContext.createDelay();
    bgFilter = audioContext.createBiquadFilter();

    
    bgDistortion.curve = makeDistortionCurve(0); 
    bgDelay.delayTime.value = 0; 
    bgFilter.type = "lowpass";
    bgFilter.frequency.value = 22050; 
  }
  
  
  
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


export function setVolume(volume) {
  if (masterGainNode) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    masterGainNode.gain.value = clampedVolume;
  }
}
