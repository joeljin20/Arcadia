import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCw, Camera } from 'lucide-react';
import { ai } from '../services/gemini';
import { playRitualSound, playAccessGranted } from '../services/audio';

export function InitiationPage({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'VISION' | 'PUZZLE' | 'RICKROLL'>('VISION');

  useEffect(() => {
    playRitualSound();
  }, []);

  return (
    <AnimatePresence mode="wait">
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

function RickRollVideo({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        // If the browser blocks unmuted playback due to async delay, fallback to muted autostart.
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
            <button onClick={() => { if(videoRef.current) { videoRef.current.muted = false; videoRef.current.volume = 1; } }} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md transition-colors border border-white/20">
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        setError("Camera access denied. Please enable it to proceed.");
      }
    }
    setupCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || analyzing) return;
    setAnalyzing(true);
    setError(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

    try {
      const geminiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: "Is the person in this photo holding a BIC PEN? Answer only with 'YES' or 'NO'." },
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
          ]
        }],
      });
      const result = geminiRes.text?.toUpperCase().includes('YES') ? 'YES' : 'NO';

      if (result === 'YES') {
        onSuccess();
      } else {
        onFailure();
      }
    } catch (err) {
      setError("Vision algorithm failed. Please try again.");
    } finally {
      if (stream) {
        setAnalyzing(false);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-[#111827] rounded-[3rem] shadow-[0_40px_100px_rgb(0,0,0,0.5)] overflow-hidden border border-white/5 relative">
        <button onClick={onClose} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full z-10 transition-colors border border-white/5">
          <X className="w-5 h-5" />
        </button>
        <div className="p-12 md:p-16 space-y-10 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif italic text-white flex justify-center items-center gap-4">
               <Sparkles className="text-emerald-500 w-8 h-8"/> 
               <span className="bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent">The Alchemist's Gate</span>
               <Sparkles className="text-emerald-500 w-8 h-8"/>
            </h2>
            <p className="text-[10px] tracking-[0.3em] uppercase text-emerald-500/80 font-bold">Hold up your catalyst (a BIC PEN) to access Arcadia</p>
          </div>
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 m-8 rounded-xl pointer-events-none" />
            {analyzing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white space-y-4 backdrop-blur-md">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-mono font-bold">Analyzing Catalyst...</p>
              </div>
            )}
          </div>
          <div className="h-4">
            {error && <motion.p initial={{opacity: 0}} animate={{opacity:1}} className="text-red-400 text-xs tracking-widest uppercase font-mono font-bold">{error}</motion.p>}
          </div>
          <button disabled={analyzing} onClick={captureAndAnalyze} className="w-full py-5 bg-emerald-600/90 text-white rounded-full font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm border border-emerald-500/50">
            <Camera className="w-5 h-5" />
            <span>Present Catalyst</span>
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
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPuzzle() {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Generate a short, cryptic initiation riddle suitable for a mysterious society. Output JSON strictly matching this shape: {\"question\": \"...\", \"answer\": \"single word\"}. No markdown.",
        });
        if (!active) return;
        const text = response.text || "";
        const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanJson);
        setPuzzle({ q: json.question, a: json.answer });
      } catch (err) {
        if (active) setPuzzle({ q: "I open without a key and close without a lock. What am I?", a: "egg" });
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
              {error && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-red-500 font-mono text-[10px] tracking-[0.3em] font-bold uppercase">Incorrect. The Architect watches.</motion.p>}
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
