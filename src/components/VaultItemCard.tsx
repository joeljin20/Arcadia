import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Timer, Eye } from 'lucide-react';
import { VaultItem } from '../types';
import { CATEGORY_STYLES } from '../services/vaultDB';

function formatCountdown(endsAt: number): string {
  const diff = Math.max(0, endsAt - Date.now());
  if (diff === 0) return 'CLOSED';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `00:${s.toString().padStart(2, '0')}`;
}

export function VaultItemCard({ item, onSelect }: { item: VaultItem; onSelect: (id: string) => void }) {
  const [countdown, setCountdown] = useState(() => formatCountdown(item.endsAt));
  const style = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES['Relics'];

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(item.endsAt)), 1000);
    return () => clearInterval(id);
  }, [item.endsAt]);

  const pctChange = ((item.currentPrice - item.priceOpenedAt) / item.priceOpenedAt) * 100;
  const isUp = pctChange >= 0;
  const isExpiringSoon = item.endsAt - Date.now() < 5 * 60 * 1000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={() => onSelect(item.id)}
      className={`relative bg-black border ${style.border} ${style.glow} cursor-pointer group transition-all duration-300 hover:border-zinc-700 overflow-hidden`}
    >
      {/* top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${isUp ? 'from-emerald-700 to-transparent' : 'from-red-900 to-transparent'}`} />

      {/* image strip */}
      <div className="h-28 overflow-hidden relative">
        <img src={item.imageUrl} alt="" className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-70 group-hover:grayscale-0 transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        {/* category badge */}
        <span className={`absolute top-2 left-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 border ${style.badge}`}>
          {item.category}
        </span>
        {/* expiring soon */}
        {isExpiringSoon && (
          <span className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border text-red-400 bg-red-950/40 border-red-900/50 animate-pulse">
            CLOSING
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* cipher title */}
        <h3 className="text-sm font-mono text-zinc-300 leading-snug line-clamp-2 group-hover:text-zinc-100 transition-colors terminal-text">
          {item.cipherTitle}
        </h3>

        {/* seller */}
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">
          Seller: <span className="text-zinc-400">{item.sellerAlias}</span>
        </p>

        {/* price row */}
        <div className="flex items-end justify-between gap-2 pt-1 border-t border-zinc-900">
          <div>
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-0.5 font-mono">Current Price</p>
            <p className="text-base font-mono font-bold text-zinc-100">
              ℂ {item.currentPrice.toLocaleString()}
            </p>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isUp ? '+' : ''}{pctChange.toFixed(1)}%</span>
          </div>
        </div>

        {/* timer */}
        <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest ${isExpiringSoon ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`}>
          <Timer className="w-3 h-3 shrink-0" />
          <span>{countdown}</span>
        </div>

        {/* view hint */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
          <Eye className="w-3 h-3" /> View
        </div>
      </div>
    </motion.div>
  );
}
