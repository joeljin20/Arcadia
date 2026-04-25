import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

export function VaultNDAModal({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-hidden modal-shake"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-red-900 via-red-700/50 to-transparent" />

        <div className="p-6 space-y-4">
          {/* header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 border border-red-900/50 flex items-center justify-center bg-red-950/20">
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-red-600 font-mono">Restricted Access · VAP-∅</p>
              <h2 className="text-base font-mono text-zinc-100 tracking-widest uppercase">Vault Access Protocol</h2>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

          {/* body */}
          <div className="space-y-3 text-[12px] text-zinc-400 leading-relaxed font-mono">
            <p>
              All lot contents, seller identities, and transaction records are classified at{' '}
              <span className="text-zinc-200 font-bold">Obsidian Level</span>. By entering you covenant to:
            </p>
            <ul className="list-none space-y-1 pl-3 border-l border-red-900/30 text-[11px]">
              <li>— Hold all acquired knowledge in perpetual silence</li>
              <li>— Never disclose lot provenance to uninitiated parties</li>
              <li>— Surrender due-process claims on all Vault transactions</li>
              <li>— Accept bids as irrevocable commitments to the Inner Council</li>
            </ul>
            <p className="text-[11px] text-zinc-500">
              This covenant is enforced across all jurisdictions, named and unnamed. Breach is logged and acted upon.
            </p>
          </div>

          {/* closing line */}
          <div className="border border-red-900/30 bg-red-950/10 px-4 py-3">
            <p className="text-[11px] text-red-400 font-mono italic">
              "don't worry if you break this vow we know how to find you"
            </p>
          </div>

          {/* actions */}
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-2.5 border border-zinc-800 text-zinc-500 text-[9px] uppercase tracking-[0.25em] font-mono hover:border-zinc-700 hover:text-zinc-300 transition-colors"
            >
              Decline / Retreat
            </button>
            <button
              onClick={onAccept}
              className="flex-[2] py-2.5 bg-red-950/40 border border-red-900/60 text-red-400 text-[9px] uppercase tracking-[0.25em] font-mono font-bold hover:bg-red-900/50 hover:text-red-200 transition-colors shadow-[0_0_20px_rgba(185,28,28,0.15)]"
            >
              Accept / Proceed
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
