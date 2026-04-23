import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, Shield, LogOut } from 'lucide-react';
import { AuctionLot } from '../types';
import { getAuctions } from '../services/mockDB';
import { AuctionCard } from '../components/AuctionCard';
import { ai } from '../services/gemini';

export function ArcadiaDashboard({ onAdminToggle, onLogout }: { onAdminToggle: () => void; onLogout: () => void }) {
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [prophecy, setProphecy] = useState<string>("Aligning the stars for the next bidding cycle...");

  useEffect(() => {
    setLots(getAuctions());

    // Generate daily lore prophecy relevant to an auction
    async function loadLore() {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Generate a mysterious, cryptic single-sentence prophecy about a dark, secretive underground auction house selling supernatural artifacts.",
        });
        setProphecy(response.text || "The gavel falls where shadows stretch the longest.");
      } catch (err) {
         setProphecy("The gavel falls where shadows stretch the longest.");
      }
    }
    loadLore();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto py-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-emerald-900/30 pb-8 gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
             <Shield className="w-8 h-8 text-emerald-500" />
             The Syndicate Auction
          </h2>
          <div className="flex items-center gap-3 mt-4">
            <span className="bg-emerald-900/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">Rank: Bidder</span>
            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Inner Circle Access</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button onClick={onAdminToggle} className="flex items-center gap-2 px-4 py-2 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-900/20 text-emerald-500 transition-colors">
            <Terminal className="w-4 h-4" /> Registration
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-900/40 transition-colors">
            <LogOut className="w-4 h-4" /> Disconnect
          </button>
        </div>
      </div>

      {/* LORE CARD */}
      <div className="mb-10 bg-[#1a2235] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
         <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest mb-3">House Notice</p>
         <p className="text-xl md:text-2xl font-serif italic text-slate-300 leading-relaxed max-w-3xl">"{prophecy}"</p>
      </div>

      {/* EVENTS / LOTS */}
      <div className="space-y-8">
        <h3 className="text-emerald-500 font-mono text-sm tracking-widest uppercase">Active Lots</h3>
        {lots.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm tracking-widest uppercase border border-white/5 rounded-3xl border-dashed">No active lots in the vault.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             {lots.map(lot => <AuctionCard key={lot.id} lot={lot} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
