function withAudio(callback: (audioCtx: AudioContext) => void) {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextCtor();
    callback(audioCtx);
  } catch {
    // Audio is optional for this experience.
  }
}

interface ArcaneShimmerOptions {
  volume?: number;
  duration?: number;
}

export const playRitualSound = () => {
  withAudio((audioCtx) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 3);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 3);
  });
};

export const playAccessGranted = () => {
  withAudio((audioCtx) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  });
};

export const playTerminalClick = () => {
  withAudio((audioCtx) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(260, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08);
  });
};

export const playTerminalSuccess = () => {
  withAudio((audioCtx) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(780, audioCtx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  });
};

export const playTerminalError = () => {
  withAudio((audioCtx) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.25);
    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.25);
  });
};

export const playTerminalBreach = () => {
  withAudio((audioCtx) => {
    const frequencies = [320, 480, 720, 960];
    frequencies.forEach((frequency, index) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'triangle';
      const start = audioCtx.currentTime + index * 0.06;
      oscillator.frequency.setValueAtTime(frequency, start);
      gainNode.gain.setValueAtTime(0.025, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });
  });
};

export const playArcaneShimmer = (options?: ArcaneShimmerOptions) => {
  const volume = options?.volume ?? 0.18;
  const duration = options?.duration ?? 0.42;

  withAudio((audioCtx) => {
    const now = audioCtx.currentTime;
    const output = audioCtx.createGain();
    output.gain.setValueAtTime(volume, now);
    output.connect(audioCtx.destination);

    const shimmerOsc = audioCtx.createOscillator();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(720, now);
    shimmerOsc.frequency.exponentialRampToValueAtTime(980, now + duration * 0.45);
    shimmerOsc.frequency.exponentialRampToValueAtTime(640, now + duration);

    const shimmerGain = audioCtx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(output);

    const chimeOsc = audioCtx.createOscillator();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(1180, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(1460, now + duration * 0.5);
    chimeOsc.frequency.exponentialRampToValueAtTime(1080, now + duration);

    const chimeGain = audioCtx.createGain();
    chimeGain.gain.setValueAtTime(0.0001, now + 0.03);
    chimeGain.gain.exponentialRampToValueAtTime(0.08, now + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(output);

    // Subtle filtered noise burst for glassy sparkle texture.
    const noiseBuffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * duration), audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.18;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2200, now);
    noiseFilter.Q.setValueAtTime(2.2, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.035, now + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(output);

    shimmerOsc.start(now);
    chimeOsc.start(now);
    noiseSource.start(now);

    shimmerOsc.stop(now + duration);
    chimeOsc.stop(now + duration);
    noiseSource.stop(now + duration);
  });
};
