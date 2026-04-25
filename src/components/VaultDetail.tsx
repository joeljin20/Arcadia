import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, KeyRound, AlertCircle, TrendingUp, TrendingDown, Timer, User, Send, History, Gavel } from 'lucide-react';
import { VaultItem, VaultChat, MemberIdentity } from '../types';
import { CATEGORY_STYLES, placeVaultBid, getVaultChat, saveVaultChat, deductCredits } from '../services/vaultDB';

function formatCountdown(endsAt: number): string {
  const diff = Math.max(0, endsAt - Date.now());
  if (diff === 0) return 'AUCTION CLOSED';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function VaultDetail({
  item,
  identity,
  credits,
  onBack,
  onBidUpdate,
}: {
  item: VaultItem;
  identity: MemberIdentity | null;
  credits: number;
  onBack: () => void;
  onBidUpdate: (newCredits: number, updatedItems: VaultItem[]) => void;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState('');

  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [chat, setChat] = useState<VaultChat[]>([]);
  const [chatMsg, setChatMsg] = useState('');

  const [countdown, setCountdown] = useState(() => formatCountdown(item.endsAt));

  const style = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES['Relics'];
  const pctChange = ((item.currentPrice - item.priceOpenedAt) / item.priceOpenedAt) * 100;
  const isUp = pctChange >= 0;

  useEffect(() => {
    setChat(getVaultChat(item.id));
    const id = setInterval(() => setCountdown(formatCountdown(item.endsAt)), 1000);
    return () => clearInterval(id);
  }, [item.id, item.endsAt]);

  // typewriter on unlock
  useEffect(() => {
    if (!unlocked) { setDisplayedTitle(''); return; }
    let i = 0;
    setDisplayedTitle('');
    const t = setInterval(() => {
      setDisplayedTitle(item.originalTitle.substring(0, i + 1));
      i++;
      if (i >= item.originalTitle.length) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [unlocked, item.originalTitle]);

  const handleUnlock = () => {
    if (keyInput.toLowerCase().trim() === item.decryptionKey.toLowerCase()) {
      setUnlocked(true);
      setKeyError(false);
    } else {
      setKeyError(true);
      setTimeout(() => setKeyError(false), 600);
    }
  };

  const handleBid = () => {
    if (!identity) return;
    const amount = parseInt(bidAmount, 10);
    const floor = Math.max(item.highestBid, item.currentPrice);

    if (isNaN(amount) || amount <= floor) {
      setBidError(`Must exceed ℂ ${floor.toLocaleString()}`);
      setTimeout(() => setBidError(null), 3000);
      return;
    }
    if (amount > credits) {
      setBidError('Insufficient credit balance');
      setTimeout(() => setBidError(null), 3000);
      return;
    }

    const updated = placeVaultBid(item.id, { bidderId: identity.id, bidderName: identity.codename, amount });
    const newCredits = deductCredits(amount);
    setBidAmount('');
    onBidUpdate(newCredits, updated);
  };

  const handleChat = () => {
    if (!chatMsg.trim() || !identity) return;
    const msg: VaultChat = {
      id: 'vc_' + Date.now(),
      lotId: item.id,
      senderId: identity.id,
      senderName: identity.codename,
      content: chatMsg.trim(),
      timestamp: Date.now(),
    };
    saveVaultChat(item.id, msg);
    setChat(getVaultChat(item.id));
    setChatMsg('');
  };

  const isClosed = item.endsAt <= Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={`space-y-8 ${keyError ? 'violent-glitch' : ''}`}
    >
      {/* back + meta */}
      <div className="flex items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors text-[10px] uppercase tracking-widest font-mono">
          <ArrowLeft className="w-4 h-4" /> Back to Vault
        </button>
        <span className={`text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 border ${style.badge}`}>
          {item.category}
        </span>
      </div>

      {/* main card */}
      <div className={`bg-black border ${style.border} relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${isUp ? 'from-emerald-700 to-transparent' : 'from-red-900 to-transparent'}`} />

        <div className="p-6 md:p-8 space-y-7">
          {/* title area */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-56 shrink-0">
              <div className="aspect-[4/5] overflow-hidden border border-zinc-800 relative">
                <img src={item.imageUrl} alt="" className={`w-full h-full object-cover transition-all duration-700 ${unlocked ? 'grayscale-0 opacity-90' : 'grayscale opacity-50'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </div>

            <div className="flex-1 space-y-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-mono mb-2">
                  LOT ID: {item.id.split('_').pop()}
                </p>
                {unlocked ? (
                  <div>
                    <div className="inline-block text-[9px] uppercase tracking-[0.25em] text-emerald-500 border border-emerald-900/30 bg-emerald-950/20 px-3 py-1 mb-3 font-mono">
                      Decrypted File
                    </div>
                    <h2 className="text-3xl md:text-4xl font-mono text-zinc-100 leading-tight min-h-[2.5rem]">
                      {displayedTitle}
                      {displayedTitle.length < item.originalTitle.length && (
                        <span className="inline-block w-0.5 h-7 bg-emerald-400 ml-1 animate-pulse align-middle" />
                      )}
                    </h2>
                    {item.alternateName && (
                      <p className="mt-2 text-[11px] font-mono text-zinc-500 uppercase tracking-widest italic">
                        aka "{item.alternateName}"
                      </p>
                    )}
                  </div>
                ) : (
                  <h2 className="text-2xl font-mono text-zinc-300 leading-relaxed terminal-text">
                    {item.cipherTitle}
                  </h2>
                )}
              </div>

              <p className="text-sm text-zinc-500 font-mono italic leading-relaxed border-l border-zinc-800 pl-4">
                {unlocked ? `"${item.originalDescription}"` : item.cipherDescription}
              </p>

              {/* seller */}
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
                Seller: <span className="text-zinc-300 font-bold">{item.sellerAlias}</span>
              </p>

              {/* stats row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-zinc-950 border border-zinc-900 p-3">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1 font-mono">Floor</p>
                  <p className="text-base font-mono text-zinc-400">ℂ {item.startingBid.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 p-3 relative overflow-hidden">
                  <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-1 font-mono">Market Price</p>
                  <p className="text-base font-mono font-bold text-zinc-100">ℂ {item.currentPrice.toLocaleString()}</p>
                  <div className={`absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {isUp ? '+' : ''}{pctChange.toFixed(1)}%
                  </div>
                </div>
                <div className={`border p-3 col-span-2 md:col-span-1 ${isClosed ? 'bg-red-950/10 border-red-900/30' : 'bg-zinc-950 border-zinc-900'}`}>
                  <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1 font-mono flex items-center gap-1">
                    <Timer className="w-2.5 h-2.5" /> Time Left
                  </p>
                  <p className={`text-sm font-mono font-bold ${isClosed ? 'text-red-400' : item.endsAt - Date.now() < 5 * 60 * 1000 ? 'text-red-400 animate-pulse' : 'text-zinc-300'}`}>
                    {countdown}
                  </p>
                </div>
              </div>

              {/* unlock */}
              {!unlocked && (
                <div className="relative pt-2">
                  {keyError && (
                    <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-4 left-0 text-red-500 text-[9px] uppercase tracking-widest font-mono flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Integrity Check Failed
                    </motion.p>
                  )}
                  <div className="flex bg-zinc-950 border border-zinc-800 focus-within:border-emerald-900/50 transition-all">
                    <div className="pl-3 flex items-center text-zinc-600">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="ENTER DECRYPTION CODE..."
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                      className="flex-1 bg-transparent border-none text-sm font-mono text-emerald-400 placeholder-zinc-700 outline-none px-3 py-2.5 uppercase tracking-widest"
                    />
                    <button onClick={handleUnlock} className="px-5 bg-zinc-900 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-emerald-950/50 hover:text-emerald-400 transition-colors border-l border-zinc-800">
                      Decrypt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* bidding */}
          {!isClosed && (
            <div className="border-t border-zinc-900 pt-6 space-y-5">
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="w-full md:max-w-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500">Your Offer</label>
                    {bidError && <span className="text-[9px] text-red-500 font-mono animate-pulse">{bidError}</span>}
                  </div>
                  <div className="flex bg-zinc-950 border border-zinc-800 focus-within:border-emerald-900/50 transition-all">
                    <span className="pl-3 flex items-center text-zinc-500 font-mono text-sm">ℂ</span>
                    <input
                      type="number"
                      placeholder="ENTER AMOUNT..."
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm font-mono text-emerald-400 placeholder-zinc-800 outline-none px-3 py-2.5 tracking-widest"
                    />
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600">
                    Balance: ℂ {credits.toLocaleString()} · Highest: ℂ {item.highestBid.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-5 py-2.5 border text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${showHistory ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-black text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'}`}
                  >
                    <History className="w-3.5 h-3.5" />
                    {showHistory ? 'Hide' : 'Bids'}
                  </button>
                  <button
                    onClick={handleBid}
                    disabled={!bidAmount || !identity}
                    className="px-8 py-2.5 bg-emerald-700 text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_18px_rgba(16,185,129,0.2)] disabled:opacity-20 flex items-center gap-2"
                  >
                    <Gavel className="w-3.5 h-3.5" /> Place Bid
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-zinc-900/50 pt-5">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-mono mb-3 flex items-center gap-2">
                      <History className="w-3 h-3" /> Bid History
                    </p>
                    <div className="max-h-44 overflow-y-auto space-y-1">
                      {item.bids.length > 0 ? item.bids.map((bid, idx) => (
                        <div key={bid.id} className={`flex justify-between items-center p-3 border ${idx === 0 ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-zinc-950/50 border-zinc-900/50'}`}>
                          <div className="flex items-center gap-2">
                            <User className={`w-3.5 h-3.5 ${idx === 0 ? 'text-emerald-500' : 'text-zinc-600'}`} />
                            <span className={`text-[11px] font-mono uppercase tracking-wider ${idx === 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                              {bid.bidderName} {bid.bidderId === identity?.id && <span className="text-zinc-600">(you)</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[9px] text-zinc-600 font-mono">{new Date(bid.timestamp).toLocaleTimeString()}</span>
                            <span className={`text-sm font-mono font-bold ${idx === 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>ℂ {bid.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      )) : (
                        <p className="text-center py-6 text-zinc-700 text-[10px] uppercase tracking-widest font-mono border border-dashed border-zinc-900">No active bids detected</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isClosed && (
            <div className="border-t border-zinc-900 pt-6">
              <p className="text-center text-red-500 text-[10px] uppercase tracking-[0.3em] font-mono py-4 border border-red-900/30 bg-red-950/10">
                Auction Closed — This lot is no longer accepting bids
              </p>
            </div>
          )}
        </div>
      </div>

      {/* per-item chat */}
      <div className="bg-black border border-zinc-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950/50">
          <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-zinc-500">
            Back-Channel — <span className="text-zinc-400">{item.cipherTitle.slice(0, 18)}…</span>
          </p>
        </div>

        <div className="max-h-48 overflow-y-auto flex flex-col-reverse p-4 space-y-2 space-y-reverse gap-2">
          {chat.length === 0 ? (
            <p className="text-center py-4 text-zinc-700 text-[9px] uppercase tracking-widest font-mono">Silence on the back-channel</p>
          ) : (
            chat.map(m => (
              <div key={m.id} className="flex gap-3 items-start">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 shrink-0 mt-0.5">{m.senderName}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-zinc-300 leading-relaxed break-words">{m.content}</p>
                  <p className="text-[8px] font-mono text-zinc-700 mt-0.5">{new Date(m.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-900 p-3 flex gap-3">
          <input
            type="text"
            placeholder="Transmit to back-channel..."
            value={chatMsg}
            onChange={e => setChatMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChat()}
            className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-emerald-400 placeholder-zinc-700 outline-none focus:border-emerald-900/50 transition-colors"
          />
          <button onClick={handleChat} disabled={!chatMsg.trim() || !identity} className="px-4 bg-zinc-900 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors disabled:opacity-20 border border-zinc-800">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
