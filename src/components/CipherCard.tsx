import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, MapPin } from 'lucide-react';
import { EventMetadata } from '../types';

export function CipherCard({ event }: { event: EventMetadata }) {
  const [decoded, setDecoded] = useState(false);
  const [attemptingDecode, setAttemptingDecode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleDecode = () => {
    if (decoded) {
      setDecoded(false);
      setAttemptingDecode(false);
      setPasscode('');
      setError(false);
    } else {
      setAttemptingDecode(true);
    }
  };

  const submitPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    // Use a hardcoded passcode for demonstration, or could be fetched/stored
    if (passcode.toLowerCase() === 'oblivion') {
      setDecoded(true);
      setAttemptingDecode(false);
      setError(false);
    } else {
      setError(true);
      setPasscode('');
    }
  };

  return (
    <div className="bg-black p-8 md:p-10 border border-zinc-900 shadow-[0_5px_30px_rgba(0,0,0,0.8)] overflow-hidden relative group text-zinc-300">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-900/40 block group-hover:bg-emerald-500/80 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
      
      <div className="flex justify-between items-start mb-8 pl-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-emerald-500 font-bold bg-emerald-950/20 px-3 py-1.5 border border-emerald-900/40 shadow-inner">Intercepted Intel</span>
          {event.authorName && (
             <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-emerald-600/80 px-3 py-1.5 border border-emerald-900/30 bg-emerald-950/10">Source: {event.authorName}</span>
          )}
        </div>
        <span className="text-[10px] uppercase text-zinc-600 font-mono tracking-widest">{new Date(event.timestamp).toLocaleString()}</span>
      </div>

      <div className="py-8 border-y border-zinc-900 my-8 pl-4">
        <p className="text-3xl md:text-4xl tracking-[0.3em] text-zinc-400 uppercase font-mono leading-relaxed min-h-[48px] break-words opacity-80 group-hover:opacity-100 transition-opacity">
          {event.cipherText}
        </p>
      </div>

      <div className="pl-4">
        <AnimatePresence>
          {decoded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-zinc-950/50 p-6 mb-8 border border-zinc-900">
                <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-[0.2em] mb-4">Decrypted Transmission</p>
                <p className="text-xl md:text-2xl font-serif text-zinc-200 italic leading-relaxed border-l-[2px] border-emerald-900/50 pl-6">"{event.originalText}"</p>
              </div>
              
              {(event.latitude && event.longitude) ? (
                <div className="bg-zinc-900 overflow-hidden aspect-[21/9] relative flex items-center justify-center border border-zinc-800 mt-8 group">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    style={{border:0}} 
                    loading="lazy" 
                    allowFullScreen 
                    src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`}
                    className="grayscale opacity-50 group-hover:opacity-80 transition-opacity"
                  ></iframe>
                  <div className="absolute top-4 left-4 bg-black border border-emerald-900/30 backdrop-blur-sm px-4 py-3 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">{event.locationName}</span>
                  </div>
                </div>
              ): null}
            </motion.div>
          )}

          {attemptingDecode && !decoded && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
               <form onSubmit={submitPasscode} className="bg-zinc-950 p-6 md:p-8 border border-zinc-900 outline outline-1 outline-transparent focus-within:outline-emerald-900/30 transition-all shadow-inner">
                 <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] mb-6 block">Enter Decryption Key</p>
                 <div className="flex flex-col md:flex-row gap-4">
                   <input 
                     type="password" 
                     value={passcode}
                     onChange={(e) => setPasscode(e.target.value)}
                     className={`flex-1 w-full bg-black border ${error ? 'border-red-500 text-red-400' : 'border-zinc-800 focus:border-emerald-900/50 focus:text-emerald-400 text-zinc-200'} px-5 py-4 outline-none font-mono tracking-[0.2em] uppercase text-sm transition-colors`}
                     placeholder="KEY..."
                     autoFocus
                   />
                   <button type="submit" className="shrink-0 px-8 py-4 bg-emerald-950/40 text-emerald-500 border border-emerald-900/50 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-emerald-900/60 hover:text-emerald-300 transition-all shadow-lg">
                     Verify
                   </button>
                 </div>
                 {error && <p className="text-[10px] text-red-500 mt-4 font-mono uppercase tracking-[0.2em]">Invalid cryptographic sequence</p>}
               </form>
             </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <button 
            onClick={handleDecode}
            className="flex items-center gap-3 px-6 py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:border-emerald-900/50 hover:text-emerald-400 transition-all shadow-sm"
          >
            {decoded ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{decoded ? "Conceal Intel" : "Decode Intel"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
