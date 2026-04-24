import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Gavel, KeyRound, AlertCircle } from 'lucide-react';
import { AuctionLot } from '../types';

export function AuctionCard({ lot }: { lot: AuctionLot }) {
  const [unlocked, setUnlocked] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    if (keyInput.toLowerCase().trim() === lot.decryptionKey.toLowerCase().trim()) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="bg-black rounded-sm p-8 md:p-10 border border-zinc-900 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative group text-zinc-300">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-900 via-emerald-900/50 to-transparent block"></div>
      
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/5 blur-[50px] pointer-events-none"></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-emerald-500 font-bold bg-emerald-950/30 px-4 py-1.5 border border-emerald-900/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Encrypted Lot</span>
        <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-2">ID: {lot.id.split('_')[1] || lot.id}</span>
      </div>

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div key="locked" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8 relative z-10">
            <div className="py-8 border-y border-zinc-900 bg-zinc-950/20 -mx-4 px-4">
              <h3 className="text-2xl md:text-3xl font-mono text-zinc-200 leading-relaxed break-words tracking-widest">{lot.cipherTitle}</h3>
              <p className="text-sm md:text-base font-mono text-zinc-500 mt-6 leading-relaxed break-words opacity-80">{lot.cipherDescription}</p>
            </div>
            
            <div className="flex items-center gap-4 text-zinc-400">
                <Gavel className="w-5 h-5" />
                <span className="font-mono text-sm tracking-[0.2em] uppercase">Starting Bid: ???</span>
            </div>

            <div className="pt-6 relative">
                {error && (
                   <motion.p initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="absolute -top-4 left-0 text-red-500 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Integrity Check Failed
                   </motion.p>
                )}
                <div className="flex bg-zinc-950 border border-zinc-800 outline outline-1 outline-transparent focus-within:outline-emerald-900/50 transition-all">
                    <div className="pl-4 py-3 flex items-center justify-center text-zinc-600">
                        <KeyRound className="w-4 h-4" />
                    </div>
                    <input 
                        type="text"
                        placeholder="ENTER DECRYPTION CODE..."
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        className="w-full bg-transparent border-none text-sm font-mono text-emerald-400 placeholder-zinc-700 outline-none px-4 py-3 uppercase tracking-widest shadow-inner focus:text-emerald-300"
                    />
                    <button 
                        onClick={handleUnlock}
                        className="px-8 bg-zinc-900 text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-900/40 hover:text-emerald-400 transition-colors border-l border-zinc-800"
                    >
                        Decrypt
                    </button>
                </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="unlocked" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-10">
               <div className="w-full md:w-[45%] shrink-0">
                  <div className="aspect-[4/5] overflow-hidden border border-zinc-800 relative shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:border-emerald-900/50 transition-all">
                     <div className="absolute inset-0 bg-black/20 mix-blend-overlay z-10 pointer-events-none"></div>
                     <img src={lot.imageUrl} alt={lot.originalTitle} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                  </div>
               </div>
               <div className="w-full md:w-[55%] space-y-8 flex flex-col justify-center">
                  <div>
                    <div className="inline-block px-3 py-1 bg-emerald-950/30 text-emerald-500 text-[9px] uppercase font-bold tracking-[0.3em] border border-emerald-900/20 mb-4 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Decrypted File</div>
                    <h3 className="text-4xl md:text-5xl font-mono text-zinc-100 leading-[1.1]">{lot.originalTitle}</h3>
                  </div>
                  <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-serif italic border-l-[1px] border-emerald-900/50 pl-6">"{lot.originalDescription}"</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between pt-8 border-t border-zinc-900 mt-8">
                <div className="flex items-center gap-4">
                    <div className="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                        <Gavel className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Starting Bid</p>
                        <p className="text-xl font-mono text-zinc-200">${lot.startingBid.toLocaleString()}</p>
                    </div>
                </div>
                <button className="px-8 py-4 bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-emerald-900/50 hover:text-emerald-300 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                    Submit Bid
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
