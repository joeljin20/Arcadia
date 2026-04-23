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
    <div className="bg-[#1a2235] rounded-[2rem] p-8 border border-white/10 shadow-2xl overflow-hidden relative group text-slate-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50 block"></div>
      
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-500/20">Sealed Lot</span>
        <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ID: {lot.id.split('_')[1] || lot.id}</span>
      </div>

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div key="locked" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
            <div className="py-4 border-b border-white/5">
              <h3 className="text-2xl font-mono text-emerald-500 leading-relaxed break-words">{lot.cipherTitle}</h3>
              <p className="text-sm font-mono text-slate-600 mt-4 leading-relaxed break-words">{lot.cipherDescription}</p>
            </div>
            
            <div className="flex items-center gap-4 text-slate-400">
                <Gavel className="w-5 h-5" />
                <span className="font-mono text-sm tracking-widest">Starting Bid: ???</span>
            </div>

            <div className="pt-6 relative">
                {error && (
                   <motion.p initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="absolute -top-4 left-0 text-red-400 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Integrity Check Failed
                   </motion.p>
                )}
                <div className="flex bg-[#0f1423] rounded-full border border-white/10 overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                    <div className="pl-4 py-3 flex items-center justify-center text-slate-500">
                        <KeyRound className="w-4 h-4" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Enter decryption code..."
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        className="w-full bg-transparent border-none text-sm font-mono text-white placeholder-slate-600 focus:ring-0 px-4 py-3 outline-none"
                    />
                    <button 
                        onClick={handleUnlock}
                        className="px-6 bg-emerald-600/20 text-emerald-400 font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-600/40 transition-colors border-l border-white/10"
                    >
                        Decrypt
                    </button>
                </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="unlocked" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
            <div className="flex gap-6">
               <div className="w-1/3 shrink-0">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 relative">
                     <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay z-10 pointer-events-none"></div>
                     <img src={lot.imageUrl} alt={lot.originalTitle} className="w-full h-full object-cover grayscale opacity-80" />
                  </div>
               </div>
               <div className="w-2/3 space-y-4">
                  <h3 className="text-3xl font-serif text-white">{lot.originalTitle}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{lot.originalDescription}</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="bg-[#0f1423] p-3 rounded-xl border border-white/5">
                        <Gavel className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Starting Bid</p>
                        <p className="text-xl font-mono text-white">${lot.startingBid.toLocaleString()}</p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2">
                    Submit Bid
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
