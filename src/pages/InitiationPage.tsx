import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCw, Camera } from 'lucide-react';
import { ai } from '../services/gemini';
import { playRitualSound, playAccessGranted } from '../services/audio';

export function InitiationPage({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'VISION' | 'PUZZLE'>('VISION');

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
    </AnimatePresence>
  );
}

function VisionScanner({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Is the person in this photo holding a BIC PEN? Answer only with 'YES' or 'NO'." },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ],
      });

      const text = response.text?.toUpperCase() || "";
      if (text.includes("YES")) {
        onSuccess();
      } else {
        setError("Alchemy requires the correct catalyst (a BIC pen). Try again.");
      }
    } catch (err) {
      setError("Vision algorithm failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[#111827] rounded-[2rem] shadow-2xl overflow-hidden border border-emerald-500/20 relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full z-10 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="p-12 space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif italic text-white flex justify-center items-center gap-3"><Sparkles className="text-emerald-400"/> The Alchemist's Gate <Sparkles className="text-emerald-400"/></h2>
            <p className="text-sm tracking-widest uppercase text-emerald-400/70">Hold up your catalyst (a BIC PEN) to access Arcadia</p>
          </div>
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 m-8 rounded-lg pointer-events-none" />
            {analyzing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white space-y-4 backdrop-blur-sm">
                <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin" />
                <p className="text-xs text-emerald-400 uppercase tracking-widest font-mono font-semibold">Analyzing Catalyst...</p>
              </div>
            )}
          </div>
          {error && <motion.p className="text-red-400 text-sm font-mono font-medium">{error}</motion.p>}
          <button disabled={analyzing} onClick={captureAndAnalyze} className="w-full py-4 bg-emerald-600 text-white rounded-full font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-3 hover:bg-emerald-500 transition-colors disabled:opacity-50">
            <Camera className="w-5 h-5" />
            <span>Present Catalyst</span>
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
          model: "gemini-3-flash-preview",
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#111827] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#111827] to-[#111827]"></div>
      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full z-10 transition-colors">
          <X className="w-6 h-6" />
      </button>
      
      <div className="max-w-xl w-full z-10 text-center space-y-8">
        <h2 className="text-emerald-400 font-mono tracking-[0.3em] uppercase text-xs">Initiation Rite</h2>
        
        {loading ? (
          <div className="flex flex-col items-center text-white opacity-50 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="font-serif italic text-emerald-200">Receiving transmission from the Architect...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-12">
            <p className="text-3xl md:text-5xl font-serif text-white italic leading-relaxed">{puzzle?.q}</p>
            <div className="flex flex-col items-center space-y-4">
              <input 
                type="text"
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                className={`bg-transparent border-b-2 ${error ? 'border-red-500 text-red-400' : 'border-white/20 text-white focus:border-emerald-500'} w-64 text-center py-2 text-xl font-mono focus:outline-none transition-colors`}
              />
              <button type="submit" className="opacity-0 w-0 h-0">Submit</button>
            </div>
            {error && <p className="text-red-400 font-mono text-sm tracking-widest">Incorrect. The Architect watches.</p>}
          </form>
        )}
      </div>
    </motion.div>
  );
}
