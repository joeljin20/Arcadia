import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Camera, RefreshCw, Cpu, ShieldCheck, UserCircle } from 'lucide-react';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { ai } from '../services/gemini';
import { playRitualSound, playAccessGranted, playTerminalError } from '../services/audio';
import { loginWithAlias } from '../services/mockDB';

type VisionPrediction = { className: string; probability: number };

// "key" (door/house/car key) is not an ImageNet or COCO class, so we use:
//   1. MobileNet keywords for the closest ImageNet classes (padlock, lock, hook, tools)
//   2. COCO-SSD scissors/knife — same elongated-metal silhouette as a key
//   3. COCO bounding-box aspect ratio: keys are 2:1–5:1, which a knife/scissors bbox also matches
// Thresholds are intentionally low because keys produce weak indirect signals.
const KEY_MN_KEYWORDS = [
  'padlock', 'combination lock', ' lock', 'lock,',
  'hook,', ' hook', 'can opener', 'corkscrew', 'opener',
  'nail,', ' nail', 'spike', 'bolt,', ' bolt',
  'chain,', ' chain', 'clasp', 'clip,',
  'letter opener', 'wrench', 'screwdriver', 'tool,',
  'blade', 'knife,', 'cleaver',
];

const COCO_KEY_CLASSES = ['scissors', 'knife'];

function centerCrop(video: HTMLVideoElement, fraction = 0.65): HTMLCanvasElement {
  const size = Math.min(video.videoWidth, video.videoHeight) * fraction;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.getContext('2d')!.drawImage(
    video,
    (video.videoWidth - size) / 2, (video.videoHeight - size) / 2,
    size, size, 0, 0, size, size,
  );
  return canvas;
}

function isKeyDetected(
  fullPreds: VisionPrediction[],
  cropPreds: VisionPrediction[],
  cocoPreds: cocoSsd.DetectedObject[],
): boolean {
  const kwMatch = (p: VisionPrediction, t: number) =>
    p.probability >= t && KEY_MN_KEYWORDS.some(kw => p.className.toLowerCase().includes(kw));

  if (fullPreds.some(p => kwMatch(p, 0.015))) return true;
  if (cropPreds.some(p => kwMatch(p, 0.01))) return true;
  if (cocoPreds.some(p => COCO_KEY_CLASSES.includes(p.class) && p.score > 0.30)) return true;
  // Key-shaped COCO box: elongated (2:1–6:1) with reasonable confidence
  if (cocoPreds.some(p => {
    const [, , w, h] = p.bbox;
    const ratio = Math.max(w / h, h / w);
    return ratio >= 2 && ratio <= 6 && p.score > 0.35;
  })) return true;
  return false;
}

function isKeyVisibleNow(
  preds: VisionPrediction[],
  cocoPreds: cocoSsd.DetectedObject[],
): boolean {
  const kwHit = preds.some(p =>
    p.probability >= 0.01 && KEY_MN_KEYWORDS.some(kw => p.className.toLowerCase().includes(kw))
  );
  const cocoHit = cocoPreds.some(p => COCO_KEY_CLASSES.includes(p.class) && p.score > 0.25);
  const shapeHit = cocoPreds.some(p => {
    const [, , w, h] = p.bbox;
    const ratio = Math.max(w / h, h / w);
    return ratio >= 2 && ratio <= 6 && p.score > 0.30;
  });
  return kwHit || cocoHit || shapeHit;
}

function drawDetections(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  preds: cocoSsd.DetectedObject[],
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  preds.forEach(pred => {
    const [x, y, w, h] = pred.bbox;
    const isKey = COCO_KEY_CLASSES.includes(pred.class);
    const alpha = Math.max(0.3, pred.score);
    ctx.strokeStyle = isKey ? `rgba(34,197,94,${alpha})` : `rgba(34,197,94,${alpha * 0.5})`;
    ctx.lineWidth = isKey ? 2 : 1;
    ctx.setLineDash(isKey ? [] : [4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = isKey ? 'rgba(34,197,94,0.85)' : 'rgba(34,197,94,0.5)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${pred.class.toUpperCase()} ${Math.round(pred.score * 100)}%`, x + 2, y > 18 ? y - 5 : y + h + 14);
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
  warmCanvas.width = 224;
  warmCanvas.height = 224;
  const ctx = warmCanvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#20242a';
  ctx.fillRect(0, 0, warmCanvas.width, warmCanvas.height);
  await model.classify(warmCanvas, 1);
}

export function InitiationPage({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'AUTH' | 'VISION' | 'PUZZLE' | 'RICKROLL'>('AUTH');

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cocoRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const mobileNetRef = useRef<mobilenet.MobileNet | null>(null);
  const detectionLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [catalystVisible, setCatalystVisible] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [liveDetections, setLiveDetections] = useState<cocoSsd.DetectedObject[]>([]);
  const [topLabel, setTopLabel] = useState<string>('');
  const [loadStep, setLoadStep] = useState<string>('Initializing catalyst scanner...');
  const [loadNonce, setLoadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setModelLoadError(false);
        setModelsReady(false);
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
        setModelsReady(true);
        setLoadStep('Scanner ready');
      } catch {
        if (!cancelled) {
          setModelLoadError(true);
          setLoadStep('Scanner unavailable');
          mobileNetModelPromise = null;
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadNonce]);

  useEffect(() => {
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadeddata = () => setCameraReady(true);
        }
      } catch {
        setError('Camera access denied. Please enable it to proceed.');
      }
    }
    setupCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (detectionLoopRef.current) clearTimeout(detectionLoopRef.current);
    };
  }, []);

  useEffect(() => {
    if (!modelsReady || !cameraReady) return;
    let active = true;

    async function runLoop() {
      if (!active || !cocoRef.current || !mobileNetRef.current || !videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState === 4) {
        try {
          const [cocoPreds, mnPreds] = await Promise.all([
            cocoRef.current.detect(videoRef.current),
            mobileNetRef.current.classify(videoRef.current, 5),
          ]);
          if (!active) return;
          setLiveDetections(cocoPreds);
          drawDetections(canvasRef.current!, videoRef.current, cocoPreds);
          const detected = isKeyVisibleNow(mnPreds, cocoPreds);
          setKeyVisible(detected);
          setCatalystVisible(detected || Boolean(mnPreds[0] && mnPreds[0].probability >= 0.18));
          setTopLabel(mnPreds[0]?.className.split(',')[0] ?? '');
        } catch { /* ignore intermittent errors */ }
      }
      if (active) detectionLoopRef.current = setTimeout(runLoop, 300);
    }

    runLoop();
    return () => {
      active = false;
      if (detectionLoopRef.current) clearTimeout(detectionLoopRef.current);
    };
  }, [modelsReady, cameraReady]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || analyzing || !modelsReady) return;
    setAnalyzing(true);
    setScanProgress(0);
    setError(null);

    const FRAMES = 4;
    const FRAME_GAP = 300;

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + 4;
      });
    }, (FRAMES * FRAME_GAP) / 22);

    try {
      let detected = false;

      for (let i = 0; i < FRAMES && !detected; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, FRAME_GAP));
        const video = videoRef.current!;
        const crop = centerCrop(video);
        const [fullPreds, cropPreds, cocoPreds] = await Promise.all([
          mobileNetRef.current!.classify(video, 10),
          mobileNetRef.current!.classify(crop as unknown as HTMLVideoElement, 10),
          cocoRef.current!.detect(video),
        ]);
        if (isKeyDetected(fullPreds, cropPreds, cocoPreds)) detected = true;
      }

      clearInterval(progressInterval);
      setScanProgress(100);

      setTimeout(() => {
        setAnalyzing(false);
        setScanProgress(0);
        if (detected) onSuccess();
        else onFailure();
      }, 450);
    } catch (e) {
      clearInterval(progressInterval);
      console.error('[VisionScanner] error:', e);
      setError('Vision algorithm failed. Please try again.');
      setAnalyzing(false);
      setScanProgress(0);
    }
  };

  const isReady = modelsReady && cameraReady;

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
            <p className="text-[10px] tracking-[0.3em] uppercase text-emerald-500/80 font-bold">Hold up a key (house key, car key) to unseal Arcadia</p>
          </div>

          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ objectFit: 'cover' }} />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500/60 rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500/60 rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500/60 rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500/60 rounded-br-lg" />
            </div>

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

            {isReady && !analyzing && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500 ${keyVisible ? 'bg-emerald-950/90 border-emerald-500/50' : catalystVisible ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-black/60 border-white/10'}`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${keyVisible ? 'bg-emerald-400 animate-pulse' : catalystVisible ? 'bg-emerald-500/80' : 'bg-slate-600'}`} />
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold transition-colors ${keyVisible ? 'text-emerald-400' : catalystVisible ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {keyVisible ? 'Catalyst Detected' : catalystVisible ? 'Object Present' : topLabel ? topLabel : 'Awaiting Catalyst...'}
                </span>
              </div>
            )}
          </div>

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
            className="w-full py-5 bg-emerald-600/90 text-white rounded-full font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm border border-emerald-500/50"
          >
            <Camera className="w-5 h-5" />
            <span>
              {!isReady ? 'Initializing Scanner...' : 'Present Catalyst'}
            </span>
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
