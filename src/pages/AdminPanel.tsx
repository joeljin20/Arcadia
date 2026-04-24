import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ChevronRight, Send, Coins, FileText, Image as ImageIcon, KeyRound, Mic, MicOff } from 'lucide-react';
import { AuctionLot, EventMetadata } from '../types';
import { encodeCipher, encodeForumCipher, extractLocation } from '../logic/cipher';
import { saveAuction, saveEvent } from '../services/mockDB';

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'LOT' | 'INTEL'>('LOT');

  // Lot State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [decryptionKey, setDecryptionKey] = useState("");

  // Intel State
  const [intelText, setIntelText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        setIntelText(event.results[event.results.length - 1][0].transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIntelText("");
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

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

  const submitIntel = () => {
    if (!intelText) return;
    
    const { loc, lat, lng } = extractLocation(intelText);

    const newEvent: EventMetadata = {
      id: "ev_" + Date.now().toString().slice(-4),
      originalText: intelText,
      cipherText: encodeForumCipher(intelText),
      locationName: loc,
      latitude: lat,
      longitude: lng,
      timestamp: Date.now()
    };

    saveEvent(newEvent);
    setIntelText("");
    onBack();
  };

  const isLotComplete = title && description && decryptionKey;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto py-12">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={onBack} className="p-3 border border-emerald-500/30 rounded-full hover:bg-emerald-900/20 transition-colors group">
          <ChevronRight className="w-5 h-5 rotate-180 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-4xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-emerald-600" /> Vault Administration
          </h2>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest mt-2">Manage the Syndicate's assets</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
         <button onClick={() => setActiveTab('LOT')} className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'LOT' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>Register Lot</button>
         <button onClick={() => setActiveTab('INTEL')} className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'INTEL' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>Transmit Intel (Voice)</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'LOT' && (
          <motion.div key="lot" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-[#1a2235] rounded-[2rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden text-slate-300">
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
                      placeholder="Set secret unlock code (e.g. secret)" 
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
                  disabled={!isLotComplete}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Seal & Publish Lot
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'INTEL' && (
           <motion.div key="intel" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-[#1a2235] rounded-[2rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden text-slate-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <p className="text-sm font-bold text-white uppercase tracking-widest mb-6">Drop Intel Transmission</p>
              
              <div className="space-y-6">
                 <div className="p-6 bg-[#0f1423] rounded-xl border border-white/5 flex items-start gap-6">
                   <button 
                     onClick={toggleRecording}
                     className={`shrink-0 p-6 rounded-full transition-all flex items-center justify-center shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' : 'bg-emerald-900/50 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'}`}
                   >
                     {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                   </button>
                   <textarea
                     className="w-full bg-transparent border-none text-xl md:text-2xl font-serif text-slate-300 placeholder-slate-600 focus:ring-0 resize-none min-h-[150px] outline-none"
                     placeholder={isRecording ? "Listening to your transmission..." : "Type intel or use secure voice dictation to embed hints..."}
                     value={intelText}
                     onChange={(e) => setIntelText(e.target.value)}
                   ></textarea>
                 </div>

                 <div className="flex justify-between items-center pt-6 border-t border-white/5">
                   <p className="text-xs text-slate-500 font-mono max-w-[300px]">
                     Intel translates coordinates dynamically. Transmit map targets by speaking locations (e.g. "meet at the lake").
                   </p>
                   <button 
                     onClick={submitIntel}
                     disabled={!intelText}
                     className="px-8 py-4 bg-emerald-600 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                   >
                     <Send className="w-4 h-4" /> Scatter Intel
                   </button>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
