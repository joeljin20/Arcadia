import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, KeyRound, AlertCircle, History, TrendingUp, User } from 'lucide-react';
import { AuctionLot, MemberIdentity } from '../types';
import { placeBid } from '../services/mockDB';

export function AuctionCard({ lot, identity, onBidUpdate }: { lot: AuctionLot; identity: MemberIdentity | null; onBidUpdate: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedDesc, setDisplayedDesc] = useState('');
  
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidError, setBidError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!unlocked) { setDisplayedTitle(''); setDisplayedDesc(''); return; }

    let i = 0;
    setDisplayedTitle('');
    const titleInterval = setInterval(() => {
      setDisplayedTitle(lot.originalTitle.substring(0, i + 1));
      i++;
      if (i >= lot.originalTitle.length) clearInterval(titleInterval);
    }, 40);

    // Description starts after title finishes
    const descDelay = setTimeout(() => {
      let j = 0;
      setDisplayedDesc('');
      const descInterval = setInterval(() => {
        setDisplayedDesc(lot.originalDescription.substring(0, j + 1));
        j++;
        if (j >= lot.originalDescription.length) clearInterval(descInterval);
      }, 18);
      return () => clearInterval(descInterval);
    }, lot.originalTitle.length * 40 + 200);

    return () => { clearInterval(titleInterval); clearTimeout(descDelay); };
  }, [unlocked, lot.originalTitle, lot.originalDescription]);

  const handleUnlock = () => {
    if (keyInput.toLowerCase().trim() === lot.decryptionKey.toLowerCase().trim()) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  };

  const handleBid = () => {
    if (!identity) return;
    const amount = parseInt(bidAmount);
    const currentHighest = lot.highestBid || lot.startingBid;

    if (isNaN(amount) || amount <= currentHighest) {
      setBidError(`Bid must be higher than $${currentHighest.toLocaleString()}`);
      setTimeout(() => setBidError(null), 3000);
      return;
    }

    placeBid(lot.id, {
      bidderId: identity.id,
      bidderName: identity.codename,
      amount: amount
    });
    
    setBidAmount("");
    onBidUpdate();
  };

  return (
    <div className={`bg-black rounded-sm p-8 md:p-10 border border-zinc-900 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative group text-zinc-300 crt-effect ${error ? 'violent-glitch' : ''}`}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-900 via-emerald-900/50 to-transparent block"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/5 blur-[50px] pointer-events-none"></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex flex-wrap gap-3">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-emerald-500 font-bold bg-emerald-950/30 px-4 py-1.5 border border-emerald-900/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Encrypted Lot</span>
          {unlocked && (
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-amber-500 font-bold bg-amber-950/20 px-4 py-1.5 border border-amber-900/30">Active Auction</span>
          )}
        </div>
        <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-2">ID: {lot.id.split('_')[1] || lot.id}</span>
      </div>

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div key="locked" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8 relative z-10">
            <div className="py-8 border-y border-zinc-900 bg-zinc-950/20 -mx-4 px-4">
              <h3 className="text-2xl md:text-3xl font-mono text-zinc-200 leading-relaxed break-words tracking-widest terminal-text">{lot.cipherTitle}</h3>
              <p className="text-sm md:text-base font-mono text-zinc-500 mt-6 leading-relaxed break-words opacity-80">{lot.cipherDescription}</p>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <Gavel className="w-5 h-5" />
              <span className="font-mono text-sm tracking-[0.2em] uppercase">Starting Bid: ${lot.startingBid.toLocaleString()} (Hidden)</span>
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
                  <h3 className="text-4xl md:text-5xl font-mono text-zinc-100 leading-[1.1] min-h-[3rem]">
                    {displayedTitle}
                    {displayedTitle.length < lot.originalTitle.length && (
                      <span className="inline-block w-0.5 h-8 bg-emerald-400 ml-1 animate-pulse align-middle" />
                    )}
                  </h3>
                </div>
                <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-serif italic border-l-[1px] border-emerald-900/50 pl-6 min-h-[3rem]">
                  "{displayedDesc}
                  {displayedDesc.length < lot.originalDescription.length && displayedTitle.length >= lot.originalTitle.length && (
                    <span className="inline-block w-0.5 h-5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                  )}"
                </p>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-zinc-950 border border-zinc-900 p-4">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Starting Price</p>
                    <p className="text-xl font-mono text-zinc-400">${lot.startingBid.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500 opacity-50" />
                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-emerald-600 mb-1">Current Highest</p>
                    <p className="text-xl font-mono text-emerald-400">${(lot.highestBid || lot.startingBid).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-8 border-t border-zinc-900 mt-8">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="w-full md:max-w-xs space-y-3">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Your Offer</label>
                      {bidError && <span className="text-[9px] text-red-500 animate-pulse font-bold uppercase">{bidError}</span>}
                   </div>
                   <div className="flex bg-zinc-950 border border-zinc-800 focus-within:border-emerald-900/50 transition-all">
                      <div className="pl-4 py-3 flex items-center justify-center text-zinc-600">
                        <span className="font-mono text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        placeholder="ENTER AMOUNT..."
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-mono text-emerald-400 placeholder-zinc-800 outline-none px-4 py-3 uppercase tracking-widest"
                      />
                   </div>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                   <button 
                     onClick={() => setShowHistory(!showHistory)}
                     className={`flex-1 md:flex-none px-6 py-4 border border-zinc-800 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${showHistory ? 'bg-zinc-800 text-zinc-100' : 'bg-black text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}
                   >
                     <History className="w-4 h-4" />
                     {showHistory ? "Hide Bids" : "View Bids"}
                   </button>
                   <button 
                     onClick={handleBid}
                     disabled={!bidAmount}
                     className="flex-[2] md:flex-none px-10 py-4 bg-emerald-600 text-black text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-20"
                   >
                     Submit Bid
                   </button>
                </div>
              </div>

              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-zinc-900/50 pt-6"
                  >
                    <div className="space-y-2">
                       <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4 flex items-center gap-2">
                         <History className="w-3 h-3" /> Transmission History: Bids
                       </p>
                       <div className="max-h-48 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                         {lot.bids && lot.bids.length > 0 ? (
                           lot.bids.map((bid, idx) => (
                             <div key={bid.id} className={`flex items-center justify-between p-3 border ${idx === 0 ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-zinc-950/50 border-zinc-900/50'} group`}>
                               <div className="flex items-center gap-3">
                                 <User className={`w-3.5 h-3.5 ${idx === 0 ? 'text-emerald-500' : 'text-zinc-600'}`} />
                                 <span className={`text-[11px] font-mono uppercase tracking-wider ${idx === 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                   {bid.bidderName} {bid.bidderId === identity?.id && "(YOU)"}
                                 </span>
                               </div>
                               <div className="flex items-center gap-4">
                                 <span className="text-[10px] text-zinc-600 font-mono">{new Date(bid.timestamp).toLocaleTimeString()}</span>
                                 <span className={`text-sm font-mono font-bold ${idx === 0 ? 'text-emerald-500' : 'text-zinc-300'}`}>
                                   ${bid.amount.toLocaleString()}
                                 </span>
                               </div>
                             </div>
                           ))
                         ) : (
                           <p className="text-center py-8 text-zinc-700 text-[10px] uppercase tracking-widest border border-dashed border-zinc-900">No active bids detected in network</p>
                         )}
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
