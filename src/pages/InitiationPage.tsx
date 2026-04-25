import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Camera, RefreshCw, Cpu, ShieldCheck, UserCircle } from 'lucide-react';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { ai } from '../services/gemini';
import { playRitualSound, playAccessGranted, playTerminalError } from '../services/audio';
import { loginWithAlias } from '../services/mockDB';
import { KioAlignmentTrial } from '../components/initiation/KioAlignmentTrial';
import { AngelBearingTrial } from '../components/initiation/AngelBearingTrial';
import { ChamberiSignalTrial } from '../components/initiation/ChamberiSignalTrial';

type VisionPrediction = { className: string; probability: number };

// ─── Live scanner state machine ───────────────────────────────────────────────
type ScannerState =
  | 'LOADING'
  | 'READY_AWAITING'
  | 'CATALYST_POSSIBLE'
  | 'CATALYST_LOCKED'
  | 'ANALYZING';

// ─── Tunable constants ────────────────────────────────────────────────────────
// Adjust here; no need to touch detection logic below.
const VISION_CONFIG = {
  FRAME_INTERVAL_MS:          200,   // inference cadence (~5 fps)
  SCORE_ON_THRESHOLD:         0.14,  // EMA score to count as a "lock frame"
  SCORE_OFF_THRESHOLD:        0.06,  // hysteresis: LOCKED → AWAITING only below this
  SCORE_POSSIBLE_THRESHOLD:   0.06,  // shows CATALYST_POSSIBLE (approaching)
  CONSECUTIVE_LOCK_FRAMES:    2,     // how many consecutive lock-frames to enter LOCKED
  EMA_ALPHA:                  0.65,  // EMA weight for the newest frame (more reactive)
  MIN_BBOX_AREA:              300,   // ignore COCO detections smaller than this (px²)
  CENTER_WEIGHT:              0.14,  // bonus for object within 38% of frame centre
  BURST_FRAMES_LOCKED:        2,     // capture-burst length when already live-locked
  BURST_FRAMES_COLD:          3,     // capture-burst length when not locked
  BURST_FRAME_GAP_MS:         250,   // gap between burst frames
  CAPTURE_SCORE_THRESHOLD:    0.12,  // single-frame score required in capture burst
} as const;

// MobileNet ImageNet labels closest to "key" — kept broad because keys produce
// weak, indirect classifier signals (not a proper ImageNet class).
const KEY_MN_KEYWORDS = [
  'padlock', 'combination lock', ' lock', 'lock,',
  'hook,', ' hook', 'can opener', 'corkscrew', 'opener',
  'nail,', ' nail', 'spike', 'bolt,', ' bolt',
  'chain,', ' chain', 'clasp', 'clip,',
  'letter opener', 'wrench', 'screwdriver', 'tool,',
  'blade', 'knife,', 'cleaver',
  'carabiner', 'safety pin', 'handle',
];

// COCO classes that share silhouette with a house key
const COCO_KEY_CLASSES = ['scissors', 'knife', 'fork', 'spoon', 'remote', 'cell phone', 'pen', 'toothbrush'];

// Re-uses the same canvas across frames to avoid GC pressure
function cropFrame(
  video: HTMLVideoElement,
  reusableCanvas: HTMLCanvasElement,
  fraction: number,
): HTMLCanvasElement {
  const size = Math.min(video.videoWidth, video.videoHeight) * fraction;
  reusableCanvas.width  = size;
  reusableCanvas.height = size;
  reusableCanvas.getContext('2d')!.drawImage(
    video,
    (video.videoWidth  - size) / 2,
    (video.videoHeight - size) / 2,
    size, size, 0, 0, size, size,
  );
  return reusableCanvas;
}

// Legacy helper retained for captureAndAnalyze burst path
function centerCrop(video: HTMLVideoElement, fraction = 0.55): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  return cropFrame(video, canvas, fraction);
}

// ─── Per-frame composite key-presence score (0–1) ────────────────────────────
// Combines four independent signals:
//   1. COCO class hit  — strongest (knife/scissors proxy)
//   2. Shape prior     — elongated non-person bbox (only when no COCO class hit)
//   3. MobileNet full-frame keyword probability
//   4. MobileNet centre-crop keyword probability (higher weight: key fills more of crop)
// Person-dominant frames suppress the MobileNet signals (face/clothing noise).
function computeFrameScore(
  mnFull: VisionPrediction[],
  mnCrop: VisionPrediction[],
  coco: cocoSsd.DetectedObject[],
  videoW: number,
  videoH: number,
): number {
  const personDominant = coco.some(p => p.class === 'person' && p.score > 0.50);
  let s = 0;

  // Signal 1 — COCO key-class hit
  let cocoKeyHit = false;
  for (const pred of coco) {
    if (!COCO_KEY_CLASSES.includes(pred.class)) continue;
    if (pred.score < 0.15) continue;
    const [x, y, w, h] = pred.bbox;
    if (w * h < VISION_CONFIG.MIN_BBOX_AREA) continue;
    cocoKeyHit = true;
    s += 0.55 * Math.min(pred.score, 0.95);
    // Centre bonus — user presenting a key tends to centre it in frame
    const cx = (x + w / 2) / videoW;
    const cy = (y + h / 2) / videoH;
    if (Math.sqrt((cx - 0.5) ** 2 + (cy - 0.5) ** 2) < 0.45) {
      s += VISION_CONFIG.CENTER_WEIGHT;
    }
    break; // take the highest-confidence hit only
  }

  // Signal 2 — shape prior (elongated non-person); always fires for any non-person object
  if (!cocoKeyHit) {
    for (const pred of coco) {
      if (pred.class === 'person' || pred.score < 0.18) continue;
      const [, , w, h] = pred.bbox;
      if (w * h < VISION_CONFIG.MIN_BBOX_AREA) continue;
      const r = Math.max(w / h, h / w);
      if (r >= 1.4 && r <= 12.0) {
        s += 0.30 * pred.score;
        break;
      }
    }
  }

  // Signals 3 & 4 — MobileNet keyword hits (suppressed when person dominates)
  if (!personDominant) {
    const kwScore = (preds: VisionPrediction[]): number =>
      preds.reduce((best, p) =>
        KEY_MN_KEYWORDS.some(kw => p.className.toLowerCase().includes(kw))
          ? Math.max(best, p.probability)
          : best,
      0);

    const bestFull = kwScore(mnFull);
    if (bestFull > 0.008) s += Math.min(0.25, bestFull * 5.0); // full-frame

    const bestCrop = kwScore(mnCrop);
    if (bestCrop > 0.006) s += Math.min(0.35, bestCrop * 7.0); // crop weighted higher
  }

  return Math.min(1.0, s);
}

function drawDetections(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  preds: cocoSsd.DetectedObject[],
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  preds.forEach(pred => {
    if (!COCO_KEY_CLASSES.includes(pred.class)) return;
    const [x, y, w, h] = pred.bbox;
    const alpha = Math.max(0.4, pred.score);
    ctx.strokeStyle = `rgba(34,197,94,${alpha})`;
    ctx.lineWidth   = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(34,197,94,0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`KEY ${Math.round(pred.score * 100)}%`, x + 2, y > 18 ? y - 5 : y + h + 14);
  });
}

let mobileNetModelPromise: Promise<mobilenet.MobileNet> | null = null;

async function getMobileNetModel(): Promise<mobilenet.MobileNet> {
  if (!mobileNetModelPromise) {
    mobileNetModelPromise = mobilenet.load({ version: 2, alpha: 0.5 });
  }
  return mobileNetModelPromise;
}

async function warmupModel(model: mobilenet.MobileNet) {
  const warmCanvas = document.createElement('canvas');
  warmCanvas.width  = 224;
  warmCanvas.height = 224;
  const ctx = warmCanvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#20242a';
  ctx.fillRect(0, 0, warmCanvas.width, warmCanvas.height);
  await model.classify(warmCanvas, 1);
}

export function InitiationPage({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'AUTH' | 'VISION' | 'PUZZLE' | 'TRIAL_KIO' | 'TRIAL_ANGEL' | 'TRIAL_CHAMBERI' | 'RICKROLL'>('AUTH');

  useEffect(() => {
    playRitualSound();
  }, []);

  return (
    <AnimatePresence mode="wait">
      {step === 'AUTH' && (
        <AuthGate 
          key="auth"
          onClose={onClose}
          onLoginSuccess={onSuccess}
          onInitiate={() => setStep('VISION')}
        />
      )}
      {step === 'VISION' && (
        <VisionScanner
          key="vision"
          onClose={onClose}
          onSuccess={() => {
            playAccessGranted();
            setStep('PUZZLE');
          }}
          onFailure={() => {
            setStep('RICKROLL');
          }}
        />
      )}
      {step === 'PUZZLE' && (
        <InitiationPuzzle
          key="puzzle"
          onClose={onClose}
          onSuccess={() => {
            playAccessGranted();
            setStep('TRIAL_KIO');
          }}
        />
      )}
      {step === 'TRIAL_KIO' && (
        <KioAlignmentTrial
          key="trial_kio"
          onClose={onClose}
          onSuccess={() => setStep('TRIAL_ANGEL')}
        />
      )}
      {step === 'TRIAL_ANGEL' && (
        <AngelBearingTrial
          key="trial_angel"
          onClose={onClose}
          onSuccess={() => setStep('TRIAL_CHAMBERI')}
        />
      )}
      {step === 'TRIAL_CHAMBERI' && (
        <ChamberiSignalTrial
          key="trial_chamberi"
          onClose={onClose}
          onSuccess={() => {
            playAccessGranted();
            onSuccess();
          }}
        />
      )}
      {step === 'RICKROLL' && (
        <RickRollVideo key="rickroll" onClose={onClose} />
      )}
    </AnimatePresence>
  );
}

function AuthGate({ onClose, onLoginSuccess, onInitiate }: { onClose: () => void; onLoginSuccess: () => void; onInitiate: () => void }) {
  const [mode, setMode] = useState<'CHOICE' | 'LOGIN'>('CHOICE');
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const result = loginWithAlias(alias);
    if (result) {
      playAccessGranted();
      onLoginSuccess();
    } else {
      playTerminalError();
      setError('Alias not recognized on this device.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#050810]/95 backdrop-blur-3xl flex items-center justify-center p-6 text-zinc-300">
      <div className="max-w-xl w-full bg-zinc-950 border border-emerald-900/30 rounded-3xl p-12 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-600 hover:text-emerald-400 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {mode === 'CHOICE' ? (
            <motion.div key="choice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-950/30 border border-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-serif italic text-zinc-100">Welcome, Seeker</h2>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">Accessing Arcadia Node 882</p>
              </div>

              <div className="grid gap-4">
                <button 
                  onClick={() => setMode('LOGIN')}
                  className="w-full py-5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl hover:bg-emerald-950/20 hover:border-emerald-900/50 transition-all flex items-center justify-center gap-4 group"
                >
                  <UserCircle className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500" />
                  <span className="font-bold uppercase tracking-widest text-sm">Return to Alias</span>
                </button>
                <button 
                  onClick={onInitiate}
                  className="w-full py-5 bg-emerald-600 text-black rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                >
                  Start New Initiation
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-serif italic text-zinc-100">Identity Verification</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Enter your device-locked alias</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="relative">
                  <input 
                    type="text" 
                    autoFocus
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="ALIA_ID..."
                    className={`w-full bg-black border ${error ? 'border-red-500' : 'border-emerald-900/30'} focus:border-emerald-500 rounded-xl px-6 py-4 text-center font-mono text-xl text-emerald-400 outline-none transition-all placeholder:text-emerald-900/20 uppercase tracking-widest`}
                  />
                  {error && <p className="text-center text-[10px] text-red-500 font-mono mt-4 uppercase tracking-widest animate-pulse">{error}</p>}
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setMode('CHOICE')}
                    className="flex-1 py-4 bg-zinc-900 text-zinc-500 rounded-xl font-bold uppercase tracking-widest text-xs hover:text-zinc-300 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RickRollVideo({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(console.error);
        }
      });
    }
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="absolute top-6 right-6 z-20 flex gap-4 items-center">
        <button
          onClick={() => { if (videoRef.current) { videoRef.current.muted = false; videoRef.current.volume = 1; } }}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md transition-colors border border-white/20"
        >
          Unmute
        </button>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20">
          <X className="w-5 h-5" />
        </button>
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        src="https://archive.org/download/Rick_Astley_Never_Gonna_Give_You_Up/Rick_Astley_Never_Gonna_Give_You_Up.mp4"
      />
    </motion.div>
  );
}

function VisionScanner({ onClose, onSuccess, onFailure }: { onClose: () => void; onSuccess: () => void; onFailure: () => void }) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const cocoRef       = useRef<cocoSsd.ObjectDetection | null>(null);
  const mobileNetRef  = useRef<mobilenet.MobileNet | null>(null);
  const detectionLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const progressRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Per-frame inference state (refs avoid stale closures in the loop)
  const emaScoreRef    = useRef(0);
  const consecutiveRef = useRef(0);
  const isLockedRef    = useRef(false);
  const analyzingRef   = useRef(false);
  const cropCanvasRef  = useRef<HTMLCanvasElement | null>(null);

  // React state (drives UI)
  const [scannerState, _setScannerState] = useState<ScannerState>('LOADING');
  const scannerStateRef = useRef<ScannerState>('LOADING');
  const setScannerState = useCallback((s: ScannerState) => {
    scannerStateRef.current = s;
    _setScannerState(s);
  }, []);

  const [scanProgress, setScanProgress]   = useState(0);
  const [error, setError]                 = useState<string | null>(null);
  const [liveDetections, setLiveDetections] = useState<cocoSsd.DetectedObject[]>([]);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [loadStep, setLoadStep]             = useState<string>('Initializing catalyst scanner...');
  const [loadNonce, setLoadNonce]           = useState(0);
  const [showPassFlash, setShowPassFlash]   = useState(false);

  // Cleanup all timers on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (detectionLoopRef.current) clearTimeout(detectionLoopRef.current);
    if (progressRef.current)      clearInterval(progressRef.current);
  }, []);

  // ── Model loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setModelLoadError(false);
        setScannerState('LOADING');
        setLoadStep('Loading object detector...');
        const coco = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (cancelled) return;
        cocoRef.current = coco;
        setLoadStep('Loading classifier...');
        const mn = await getMobileNetModel();
        if (cancelled) return;
        await warmupModel(mn);
        if (cancelled) return;
        mobileNetRef.current = mn;
        setLoadStep('Scanner ready');
        // scannerState transitions to READY_AWAITING once camera is also ready
        // (handled below in camera effect)
      } catch {
        if (!cancelled) {
          setModelLoadError(true);
          setLoadStep('Scanner unavailable');
          mobileNetModelPromise = null;
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [loadNonce, setScannerState]);

  // ── Camera setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        });
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadeddata = () => {
            if (!cancelled) {
              // Transition to READY_AWAITING only once both models and camera are up
              if (mobileNetRef.current && cocoRef.current) {
                setScannerState('READY_AWAITING');
              }
            }
          };
        }
      } catch {
        if (!cancelled) setError('Camera access denied. Please enable it to proceed.');
      }
    }
    setupCamera();
    return () => { cancelled = true; };
  }, [setScannerState]);

  // When models finish loading after camera is already ready, transition state
  useEffect(() => {
    if (
      cocoRef.current && mobileNetRef.current &&
      videoRef.current && videoRef.current.readyState >= 2 &&
      scannerStateRef.current === 'LOADING'
    ) {
      setScannerState('READY_AWAITING');
    }
  });

  // ── Live detection loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const isReady = scannerState === 'READY_AWAITING' ||
                    scannerState === 'CATALYST_POSSIBLE' ||
                    scannerState === 'CATALYST_LOCKED';
    if (!isReady) return;

    // Ensure reusable crop canvas exists
    if (!cropCanvasRef.current) cropCanvasRef.current = document.createElement('canvas');

    let active = true;

    async function runLoop() {
      if (!active) return;

      const video = videoRef.current;
      const coco  = cocoRef.current;
      const mn    = mobileNetRef.current;

      if (video && coco && mn && video.readyState === 4 && !analyzingRef.current) {
        try {
          const cropCanvas = cropFrame(video, cropCanvasRef.current!, 0.55);
          const [cocoPreds, mnFull, mnCrop] = await Promise.all([
            coco.detect(video),
            mn.classify(video, 5),
            mn.classify(cropCanvas as unknown as HTMLVideoElement, 5),
          ]);

          if (!active) return;

          // Draw COCO key-class boxes on overlay
          drawDetections(canvasRef.current!, video, cocoPreds);
          setLiveDetections(cocoPreds);

          // Compute composite score + EMA
          const frameScore = computeFrameScore(mnFull, mnCrop, cocoPreds, video.videoWidth, video.videoHeight);
          const ema = VISION_CONFIG.EMA_ALPHA * frameScore + (1 - VISION_CONFIG.EMA_ALPHA) * emaScoreRef.current;
          emaScoreRef.current = ema;

          // Hysteresis state machine
          if (isLockedRef.current) {
            // Already LOCKED: only drop if EMA falls well below threshold
            if (ema < VISION_CONFIG.SCORE_OFF_THRESHOLD) {
              isLockedRef.current  = false;
              consecutiveRef.current = 0;
              setScannerState('READY_AWAITING');
            }
          } else {
            if (ema >= VISION_CONFIG.SCORE_ON_THRESHOLD) {
              consecutiveRef.current += 1;
              if (consecutiveRef.current >= VISION_CONFIG.CONSECUTIVE_LOCK_FRAMES) {
                isLockedRef.current = true;
                setScannerState('CATALYST_LOCKED');
              } else {
                setScannerState('CATALYST_POSSIBLE');
              }
            } else if (ema >= VISION_CONFIG.SCORE_POSSIBLE_THRESHOLD) {
              consecutiveRef.current = 0;
              setScannerState('CATALYST_POSSIBLE');
            } else {
              consecutiveRef.current = 0;
              if (scannerStateRef.current !== 'READY_AWAITING') {
                setScannerState('READY_AWAITING');
              }
            }
          }
        } catch { /* transient inference errors — keep looping */ }
      }

      if (active) detectionLoopRef.current = setTimeout(runLoop, VISION_CONFIG.FRAME_INTERVAL_MS);
    }

    runLoop();
    return () => {
      active = false;
      if (detectionLoopRef.current) { clearTimeout(detectionLoopRef.current); detectionLoopRef.current = null; }
    };
  // Re-run only when transitioning in/out of scannable states
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerState === 'LOADING' || scannerState === 'ANALYZING', setScannerState]);

  // ── Capture & analyse burst ──────────────────────────────────────────────────
  const captureAndAnalyze = useCallback(async () => {
    if (analyzingRef.current || !mobileNetRef.current || !cocoRef.current || !videoRef.current) return;

    analyzingRef.current = true;
    setScannerState('ANALYZING');
    setScanProgress(0);
    setError(null);

    // Burst length depends on whether we already have a live lock
    const FRAMES    = isLockedRef.current ? VISION_CONFIG.BURST_FRAMES_LOCKED : VISION_CONFIG.BURST_FRAMES_COLD;
    const FRAME_GAP = VISION_CONFIG.BURST_FRAME_GAP_MS;
    // Lower threshold if already locked (live EMA was already confident)
    const THRESHOLD = isLockedRef.current
      ? VISION_CONFIG.CAPTURE_SCORE_THRESHOLD * 0.75
      : VISION_CONFIG.CAPTURE_SCORE_THRESHOLD;

    // Animate progress bar over the expected burst duration
    const totalMs = FRAMES * FRAME_GAP;
    progressRef.current = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 85) { clearInterval(progressRef.current!); return 85; }
        return prev + Math.round(8000 / totalMs);
      });
    }, totalMs / 20);

    try {
      let detected = false;

      for (let i = 0; i < FRAMES && !detected; i++) {
        if (i > 0) await new Promise<void>(r => setTimeout(r, FRAME_GAP));
        const video = videoRef.current!;
        if (video.readyState < 4) continue;
        const crop = centerCrop(video, 0.55);
        const [mnFull, mnCrop, cocoPreds] = await Promise.all([
          mobileNetRef.current!.classify(video, 10),
          mobileNetRef.current!.classify(crop as unknown as HTMLVideoElement, 10),
          cocoRef.current!.detect(video),
        ]);
        const score = computeFrameScore(mnFull, mnCrop, cocoPreds, video.videoWidth, video.videoHeight);
        if (score >= THRESHOLD) detected = true;
      }

      clearInterval(progressRef.current!);
      progressRef.current = null;
      setScanProgress(100);
      if (detected) setShowPassFlash(true);

      setTimeout(() => {
        analyzingRef.current = false;
        setScanProgress(0);
        // Restore live state
        setScannerState(isLockedRef.current ? 'CATALYST_LOCKED' : 'READY_AWAITING');
        if (detected) onSuccess();
        else onFailure();
      }, 450);
    } catch (e) {
      if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
      console.error('[VisionScanner] capture error:', e);
      setError('Vision algorithm failed. Please try again.');
      analyzingRef.current = false;
      setScanProgress(0);
      setScannerState(isLockedRef.current ? 'CATALYST_LOCKED' : 'READY_AWAITING');
    }
  }, [onSuccess, onFailure, setScannerState]);

  // ── Derived UI values ────────────────────────────────────────────────────────
  const isReady    = scannerState !== 'LOADING' && !modelLoadError;
  const analyzing  = scannerState === 'ANALYZING';
  const isLocked   = scannerState === 'CATALYST_LOCKED';
  const isPossible = scannerState === 'CATALYST_POSSIBLE';

  const badgeBg    = isLocked   ? 'bg-emerald-950/90 border-emerald-500/50'
                   : isPossible ? 'bg-amber-950/90 border-amber-500/40'
                   :              'bg-black/60 border-white/10';
  const dotColor   = isLocked   ? 'bg-emerald-400 animate-pulse'
                   : isPossible ? 'bg-amber-400 animate-pulse'
                   :              'bg-slate-600';
  const badgeText  = isLocked   ? 'Catalyst Locked'
                   : isPossible ? 'Catalyst Approaching'
                   :              'Awaiting the Instrument';
  const badgeTextColor = isLocked   ? 'text-emerald-400'
                        : isPossible ? 'text-amber-400'
                        :              'text-slate-500';

  const ctaLabel = !isReady ? 'Initializing Scanner...' : isLocked ? 'Seal the Gate' : 'Present Catalyst';
  const ctaClass = isLocked
    ? 'w-full py-5 bg-emerald-500 text-black rounded-full font-bold uppercase tracking-[0.2em] shadow-[0_10px_40px_rgb(16,185,129,0.55)] flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgb(16,185,129,0.65)] text-sm border border-emerald-400/60'
    : 'w-full py-5 bg-emerald-600/90 text-white rounded-full font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm border border-emerald-500/50';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-[#111827] rounded-[3rem] shadow-[0_40px_100px_rgb(0,0,0,0.5)] overflow-hidden border border-white/5 relative">
        <button onClick={onClose} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full z-10 transition-colors border border-white/5">
          <X className="w-5 h-5" />
        </button>

        <div className="p-12 md:p-16 space-y-10 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif italic text-white flex justify-center items-center gap-4">
              <Sparkles className="text-emerald-500 w-8 h-8" />
              <span className="bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent">The Alchemist's Gate</span>
              <Sparkles className="text-emerald-500 w-8 h-8" />
            </h2>
            <p className="text-sm text-zinc-400/60 leading-relaxed max-w-xs mx-auto font-light">
              The seal yields to nothing but its counterpart. Present the instrument of passage.
            </p>
          </div>

          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ objectFit: 'cover' }} />

            {/* Corner frame guides */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500/60 rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500/60 rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500/60 rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500/60 rounded-br-lg" />
            </div>

            {/* Lock-state bottom bar */}
            {isReady && isLocked && !analyzing && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,1)]" />
            )}

            {/* Pass-flash overlay */}
            {showPassFlash && (
              <div
                className="fx-pass-flash absolute inset-0 z-50 pointer-events-none rounded-3xl"
                onAnimationEnd={() => setShowPassFlash(false)}
              />
            )}

            {/* Model-loading overlay */}
            {!isReady && !modelLoadError && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
                <p className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] font-mono font-bold">{loadStep}</p>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Load-error overlay */}
            {modelLoadError && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
                <p className="text-red-400 text-xs font-mono uppercase tracking-widest">Scanner failed to initialize</p>
                <button
                  onClick={() => setLoadNonce((n) => n + 1)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md transition-colors border border-white/20"
                >
                  Retry Scanner
                </button>
              </div>
            )}

            {/* Analysing overlay */}
            {analyzing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white space-y-6 backdrop-blur-md px-12">
                <p className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] font-mono font-bold">Scanning Catalyst...</p>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[9px] font-mono uppercase text-emerald-500/70">
                    <span>Vision Analysis</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ ease: 'linear', duration: 0.08 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live detection badge */}
            {isReady && !analyzing && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500 ${badgeBg}`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${dotColor}`} />
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold transition-colors ${badgeTextColor}`}>
                  {badgeText}
                </span>
              </div>
            )}
          </div>

          {/* COCO detection chips */}
          {isReady && !analyzing && liveDetections.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {liveDetections.slice(0, 5).map((d, i) => (
                <span key={i} className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded border ${COCO_KEY_CLASSES.includes(d.class) ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60' : 'text-slate-500 border-slate-700/40 bg-slate-900/40'}`}>
                  {d.class} {Math.round(d.score * 100)}%
                </span>
              ))}
            </div>
          )}

          <div className="h-4">
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs tracking-widest uppercase font-mono font-bold">{error}</motion.p>
            )}
          </div>

          <button
            disabled={analyzing || !isReady}
            onClick={captureAndAnalyze}
            className={ctaClass}
          >
            <Camera className="w-5 h-5" />
            <span>{ctaLabel}</span>
          </button>

          <button onClick={onSuccess} className="w-full py-3 bg-transparent text-emerald-500/50 hover:text-emerald-400 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] transition-colors border border-transparent hover:border-emerald-500/30">
            [DEV] Override Vision Scanner
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InitiationPuzzle({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [puzzle, setPuzzle] = useState<{ q: string, a: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPuzzle() {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: 'Generate a short, cryptic initiation riddle suitable for a mysterious society. Output JSON strictly matching this shape: {"question": "...", "answer": "single word"}. No markdown.',
        });
        if (!active) return;
        const text = response.text || '';
        const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanJson);
        setPuzzle({ q: json.question, a: json.answer });
      } catch {
        if (active) setPuzzle({ q: 'I open without a key and close without a lock. What am I?', a: 'egg' });
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPuzzle();
    return () => { active = false; };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (puzzle && answer.toLowerCase().trim() === puzzle.a.toLowerCase().trim()) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#0f1423] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0f1423] to-[#0f1423] pointer-events-none"></div>
      <button onClick={onClose} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full z-10 transition-colors border border-white/5">
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-2xl w-full z-10 text-center space-y-12">
        <h2 className="text-emerald-500 font-mono tracking-[0.4em] uppercase text-[10px] font-bold">Initiation Rite</h2>

        {loading ? (
          <div className="flex flex-col items-center text-emerald-500/50 space-y-6">
            <RefreshCw className="w-10 h-10 animate-spin" />
            <p className="font-serif italic text-emerald-200/50 md:text-lg">Receiving transmission from the Architect...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-16">
            <p className="text-4xl md:text-5xl font-serif text-white italic leading-tight drop-shadow-md">"{puzzle?.q}"</p>
            <div className="flex flex-col items-center space-y-4">
              <input
                type="text"
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Declare your truth..."
                className={`bg-transparent border-b-2 ${error ? 'border-red-500 text-red-500' : 'border-emerald-500/30 text-emerald-100 focus:border-emerald-400'} w-64 text-center py-3 text-2xl font-mono focus:outline-none transition-colors placeholder:text-emerald-900/40`}
              />
              <button type="submit" className="px-8 py-3 mt-4 bg-emerald-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-800 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg">Submit Truth</button>
              <button type="button" onClick={onSuccess} className="mt-2 text-emerald-500/50 hover:text-emerald-400 font-bold uppercase tracking-widest text-[10px] transition-colors">
                [DEV] Override Puzzle
              </button>
            </div>
            <div className="h-4">
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-mono text-[10px] tracking-[0.3em] font-bold uppercase">Incorrect. The Architect watches.</motion.p>}
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
