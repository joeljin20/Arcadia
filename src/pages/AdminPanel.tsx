import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ChevronRight, Send, Coins, FileText, Image as ImageIcon, KeyRound } from 'lucide-react';
import { AuctionLot } from '../types';
import { encodeCipher } from '../logic/cipher';
import { saveAuction } from '../services/mockDB';

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [decryptionKey, setDecryptionKey] = useState("");

  const submitLot = () => {
    if (!title || !description || !decryptionKey) return;
    
    const newLot: AuctionLot = {
      id: "lot_" + Date.now().toString().slice(-4),
      originalTitle: title,
      originalDescription: description,
      cipherTitle: encodeCipher(title),
      cipherDescription: encodeCipher(description),
      startingBid: parseInt(startingBid) || 0,
      decryptionKey: decryptionKey,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800",
      timestamp: Date.now()
    };

    saveAuction(newLot);
    onBack();
  };

  const isComplete = title && description && decryptionKey;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto py-12">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={onBack} className="p-3 border border-emerald-500/30 rounded-full hover:bg-emerald-900/20 transition-colors group">
          <ChevronRight className="w-5 h-5 rotate-180 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-4xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-emerald-600" /> Vault Registration
          </h2>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest mt-2">Seal and encode a new item for auction</p>
        </div>
      </div>

      <div className="bg-[#1a2235] rounded-[2rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden text-slate-300">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        
        <p className="text-sm font-bold text-white uppercase tracking-widest mb-8">Lot Configuration</p>
        
        <div className="space-y-6">
          {/* Title */}
          <div className="flex bg-[#0f1423] rounded-xl border border-white/5 overflow-hidden p-1">
             <div className="w-12 flex items-center justify-center text-emerald-600/50">
               <FileText className="w-5 h-5" />
             </div>
             <input 
               type="text" 
               placeholder="Item Name (e.g. Dagger of the Ancients)" 
               value={title}
               onChange={(e)=>setTitle(e.target.value)}
               className="w-full bg-transparent border-none text-white focus:ring-0 px-4 py-4 outline-none font-serif text-lg"
             />
          </div>

          {/* Description */}
          <div className="flex bg-[#0f1423] rounded-xl border border-white/5 overflow-hidden p-1 items-start">
             <div className="w-12 pt-5 flex justify-center text-emerald-600/50 shrink-0">
               <FileText className="w-5 h-5" />
             </div>
             <textarea 
               placeholder="Lore and Description..." 
               value={description}
               onChange={(e)=>setDescription(e.target.value)}
               className="w-full bg-transparent border-none text-slate-300 focus:ring-0 px-4 py-4 outline-none font-serif min-h-[120px] resize-none"
             ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Bid */}
             <div className="flex bg-[#0f1423] rounded-xl border border-white/5 overflow-hidden p-1">
               <div className="w-12 flex items-center justify-center text-emerald-600/50">
                 <Coins className="w-5 h-5" />
               </div>
               <input 
                 type="number" 
                 placeholder="Starting Bid ($)" 
                 value={startingBid}
                 onChange={(e)=>setStartingBid(e.target.value)}
                 className="w-full bg-transparent border-none text-white focus:ring-0 px-4 py-4 outline-none font-mono"
               />
             </div>
             {/* Image */}
             <div className="flex bg-[#0f1423] rounded-xl border border-white/5 overflow-hidden p-1">
               <div className="w-12 flex items-center justify-center text-emerald-600/50">
                 <ImageIcon className="w-5 h-5" />
               </div>
               <input 
                 type="text" 
                 placeholder="Image URL (Unsplash etc)" 
                 value={imageUrl}
                 onChange={(e)=>setImageUrl(e.target.value)}
                 className="w-full bg-transparent border-none text-white focus:ring-0 px-4 py-4 outline-none font-mono text-sm"
               />
             </div>
          </div>

          {/* Decryption Key (Crucial) */}
          <div className="pt-6 border-t border-white/5">
              <label className="block text-xs uppercase font-bold tracking-widest text-emerald-500 mb-3">Decryption Passcode (Mandatory)</label>
              <div className="flex bg-[#0f1423] rounded-xl border border-emerald-500/30 overflow-hidden p-1 focus-within:border-emerald-500 transition-colors">
                <div className="w-12 flex items-center justify-center text-emerald-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Set secret unlock code (e.g. secreto)" 
                  value={decryptionKey}
                  onChange={(e)=>setDecryptionKey(e.target.value)}
                  className="w-full bg-transparent border-none text-white focus:ring-0 px-4 py-4 outline-none font-mono text-lg"
                />
              </div>
          </div>

          <div className="flex justify-between items-center pt-8 mt-8 border-t border-white/5">
            <p className="text-xs text-slate-500 font-mono max-w-[250px]">
               The system will automatically cipher the title and description upon registration.
            </p>
            <button 
              onClick={submitLot}
              disabled={!isComplete}
              className="px-8 py-4 bg-emerald-600 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Seal & Publish Lot
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
