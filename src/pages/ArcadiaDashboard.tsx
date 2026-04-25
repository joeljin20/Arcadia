import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, LogOut, Radio, PackageOpen, Mic, MicOff, Activity, MapPin } from 'lucide-react';
import { VaultItem, VaultCategory, EventMetadata, MemberIdentity } from '../types';
import { getEvents, generateIdentity, saveEvent } from '../services/mockDB';
import { getActiveVaultItems, saveActiveVaultItems, hasAcceptedNDA, acceptNDA, getCredits, CATEGORY_STYLES } from '../services/vaultDB';
import { VaultNDAModal } from '../components/VaultNDAModal';
import { VaultItemCard } from '../components/VaultItemCard';
import { VaultDetail } from '../components/VaultDetail';
import { CipherCard } from '../components/CipherCard';
import { buildEmojiClue, chooseClueTypeForEventId, encodeForumCipher, extractLocation } from '../logic/cipher';
import { ai } from '../services/gemini';

const MADRID_LOCATIONS = [
  { name: 'Crystal Palace, Retiro', lat: 40.4138, lng: -3.6824 },
  { name: 'Puerta del Sol', lat: 40.4168, lng: -3.7038 },
  { name: 'Chamberí Ghost Station', lat: 40.4349, lng: -3.6993 },
  { name: 'KIO Towers', lat: 40.4497, lng: -3.6936 },
  { name: 'Templo de Debod', lat: 40.4236, lng: -3.7153 },
] as const;
type MadridLocation = typeof MADRID_LOCATIONS[number];

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let columns = Math.floor(width / 20);
    const drops: number[] = new Array(columns).fill(0);
    const baseChars = "0101010101010101ABCDEFHIJKLMNOPQRSTUVWXYZ";
    const arcadiaChars = "⍙⍦⎈⎉⎊⍝⍧⍨⍩⍪⍫⍬⍭⍮⍯⍰⍱⍲⍳⍴⍵⍶⍷⍸⍹◴◵◶◷◰◱◲◳◨◩";
    const chars = `${baseChars}${arcadiaChars}`;
    const ripples: Array<{ x: number; y: number; radius: number; life: number }> = [];
    let frameId = 0;
    let pulseUntil = 0;
    let nextPulse = performance.now() + 9000 + Math.random() * 6000;

    const draw = (time: number) => {
      const isPulse = time < pulseUntil;
      const shade = isPulse ? 0.028 : 0.05;
      const baseAlpha = isPulse ? 0.32 : 0.14;

      ctx.fillStyle = `rgba(0, 0, 0, ${shade})`;
      ctx.fillRect(0, 0, width, height);
      ctx.font = '15px monospace';

      for (let i = 0; i < drops.length; i++) {
        const charIndex = Math.floor(Math.random() * chars.length);
        const text = chars.charAt(charIndex);
        const x = i * 20;
        const y = drops[i] * 20;
        let rippleBoost = 0;
        for (let r = 0; r < ripples.length; r += 1) {
          const ripple = ripples[r];
          const dx = ripple.x - x;
          const dy = ripple.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < ripple.radius) {
            rippleBoost = Math.max(rippleBoost, (1 - distance / ripple.radius) * 0.45);
          }
        }
        ctx.fillStyle = `rgba(16, 185, 129, ${Math.min(0.95, baseAlpha + rippleBoost)})`;
        ctx.fillText(text, x, y);

        if (drops[i] * 20 > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 1;
      }

      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const ripple = ripples[i];
        ripple.radius += 8;
        ripple.life -= 0.018;
        if (ripple.life <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.strokeStyle = `rgba(52, 211, 153, ${ripple.life * 0.32})`;
        ctx.lineWidth = 2;
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (time >= nextPulse) {
        pulseUntil = time + 2000;
        nextPulse = time + 10000 + Math.random() * 5000;
      }

      frameId = window.requestAnimationFrame(draw);
    };

    frameId = window.requestAnimationFrame(draw);
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / 20);
      drops.length = columns;
      drops.fill(0);
    };
    const handlePointerDown = (event: PointerEvent) => {
      ripples.push({ x: event.clientX, y: event.clientY, radius: 20, life: 1 });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20 z-0" />;
}

const ALL_CATEGORIES: VaultCategory[] = ['Relics', 'Cipher Keys', 'Black Ledger', 'Oracular Signals', 'Initiation Artifacts', 'Forbidden Archives'];

export function ArcadiaDashboard({ onAdminToggle, onLogout }: { onAdminToggle: () => void; onLogout: () => void }) {
  const [events, setEvents] = useState<EventMetadata[]>([]);
  const [identity, setIdentity] = useState<MemberIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'INTEL' | 'VAULT'>('INTEL');
  const [prophecy, setProphecy] = useState<string>("Aligning the nodes for the next network cycle...");
  const [displayedProphecy, setDisplayedProphecy] = useState("");

  // Vault state
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [vaultCategory, setVaultCategory] = useState<VaultCategory | 'ALL'>('ALL');
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [showNDA, setShowNDA] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(() => hasAcceptedNDA());
  const [credits, setCredits] = useState(() => getCredits());
  
  // Intel Input
  const [intelText, setIntelText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MadridLocation | null>(null);
  const recognitionRef = useRef<any>(null);
  

  useEffect(() => {
    let i = 0;
    setDisplayedProphecy("");
    const interval = setInterval(() => {
      setDisplayedProphecy(prophecy.substring(0, i + 1));
      i++;
      if (i >= prophecy.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [prophecy]);

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

  // Load vault items and start price drift + rotation
  useEffect(() => {
    const items = getActiveVaultItems();
    setVaultItems(items);

    // Price drift every 8s
    const driftId = setInterval(() => {
      setVaultItems(prev => {
        const now = Date.now();
        const updated = prev.map(item => {
          if (item.endsAt <= now) return item;
          const drift = 1 + (Math.random() * 0.04 - 0.015); // ±2% random walk
          const newPrice = Math.max(item.highestBid, Math.round(item.currentPrice * drift));
          return { ...item, currentPrice: newPrice };
        });
        return updated;
      });
    }, 8000);

    // Rotation check every 10s (timers are 2-5 min)
    const rotateId = setInterval(() => {
      setVaultItems(() => getActiveVaultItems());
    }, 10000);

    return () => { clearInterval(driftId); clearInterval(rotateId); };
  }, []);

  useEffect(() => {
    const me = generateIdentity();
    setIdentity(me);
    setEvents(getEvents());

    // Generate daily lore prophecy relevant to an auction
    async function loadLore() {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: "Generate a mysterious, cryptic single-sentence prophecy about a dark, secretive underground hacking network called Arcadia.",
        });
        setProphecy(response.text || "The gavel falls where shadows stretch the longest.");
      } catch (err) {
         setProphecy("The gavel falls where shadows stretch the longest.");
      }
    }
    loadLore();
  }, [activeTab]);

  const handlePostIntel = () => {
    if (!intelText.trim()) return;
    const { loc, lat, lng } = extractLocation(intelText);
    const eventId = "ev_" + Date.now().toString().slice(-4);
    const cipherText = encodeForumCipher(intelText);
    const clueType = chooseClueTypeForEventId(eventId);
    const clue = buildEmojiClue(cipherText, clueType);
    const newEvent: EventMetadata = {
      id: eventId,
      originalText: intelText,
      cipherText,
      locationName: loc,
      latitude: lat,
      longitude: lng,
      timestamp: Date.now(),
      authorId: isAnonymous ? undefined : identity?.id,
      authorName: isAnonymous ? undefined : identity?.codename,
      clueType: clue.clueType,
      cluePrompt: clue.cluePrompt,
      expectedAnswer: clue.expectedAnswer,
      clueMeta: clue.clueMeta,
      attachedLocation: selectedLocation
        ? { name: selectedLocation.name, latitude: selectedLocation.lat, longitude: selectedLocation.lng }
        : undefined,
    };
    saveEvent(newEvent);
    setEvents(getEvents());
    setIntelText("");
    setSelectedLocation(null);
    if (isRecording) {
      toggleRecording();
    }
  };


  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono selection:bg-emerald-900/40 selection:text-emerald-100 crt-effect relative overflow-hidden">
      {showNDA && (
        <VaultNDAModal
          onAccept={() => {
            acceptNDA();
            setNdaAccepted(true);
            setShowNDA(false);
            setActiveTab('VAULT');
          }}
          onDecline={() => setShowNDA(false)}
        />
      )}
      <MatrixRain />
      <div className="scanline" />
      
      <div className="max-w-7xl mx-auto py-8 md:py-12 px-6 flex flex-col md:flex-row gap-8 md:gap-12 relative z-10">
        {/* Left Sidebar / Nav */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-10 border-b border-zinc-900 pb-8 md:pb-0 md:border-b-0 md:border-r pr-6 relative">
          <div className="space-y-4">
             <div className="w-10 h-10 border border-emerald-900/50 flex items-center justify-center rounded-sm bg-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
               <Terminal className="w-5 h-5 text-emerald-500 z-10" />
               <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
             </div>
             <h2 className="text-2xl font-bold text-zinc-100 tracking-[0.2em] uppercase terminal-text">Arcadia</h2>
             <div className="h-[1px] w-full bg-gradient-to-r from-emerald-900/50 to-transparent my-6"></div>
             
             {identity && (
              <div className="text-xs uppercase tracking-[0.2em] space-y-2">
                 <p className="text-zinc-600">Active Alias</p>
                 <p className="text-emerald-400 border border-emerald-900/30 px-3 py-2 bg-emerald-950/20 inline-block shadow-inner">{identity.codename}</p>
                 <div className="flex items-center gap-2 pt-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] fx-net-pulse"></div>
                   <span className="text-[9px] text-zinc-500">Secure Protocol Active</span>
                 </div>
              </div>
             )}
          </div>

          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
            <button
                onClick={() => setActiveTab('INTEL')}
                className={`flex items-center gap-3 px-4 py-3 shrink-0 uppercase tracking-widest text-xs transition-all border-l-2 ${activeTab === 'INTEL' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
            >
                <Radio className="w-4 h-4" /> Global Intel
            </button>
            <button
                onClick={() => {
                  if (!ndaAccepted) { setShowNDA(true); return; }
                  setActiveTab('VAULT');
                  setSelectedVaultId(null);
                }}
                className={`flex items-center gap-3 px-4 py-3 shrink-0 uppercase tracking-widest text-xs transition-all border-l-2 ${activeTab === 'VAULT' ? 'border-amber-500 text-amber-400 bg-amber-950/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
            >
                <PackageOpen className="w-4 h-4" /> The Vault
            </button>
          </div>

          {/* Credit bar */}
          {ndaAccepted && (
            <div className="hidden md:block space-y-2 mt-2">
              <p className="text-[8px] uppercase tracking-[0.25em] text-amber-600 font-mono">Credit Balance</p>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-700 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                  style={{ width: `${Math.min(100, (credits / 5000000) * 100)}%` }}
                />
              </div>
              <p className={`text-[11px] font-mono font-bold ${credits < 200000 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                ℂ {credits.toLocaleString()}
              </p>
            </div>
          )}

          {/* Network Traffic Decorator */}
          <div className="hidden md:block mt-8 opacity-20 space-y-1">
             <p className="text-[8px] uppercase tracking-tighter text-emerald-500 mb-2">Network Load</p>
             <div className="flex gap-0.5 h-8 items-end">
                {[...Array(20)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ height: [Math.random()*100+'%', Math.random()*100+'%', Math.random()*100+'%'] }} 
                    transition={{ repeat: Infinity, duration: 2+Math.random()*2 }}
                    className="w-1 bg-emerald-500"
                  />
                ))}
             </div>
          </div>

          <div className="mt-auto pt-8 flex flex-col gap-3">
             <button onClick={onAdminToggle} className="text-left text-[10px] uppercase tracking-widest text-zinc-500 hover:text-emerald-400 flex items-center gap-2 transition-colors">
               <Terminal className="w-3.5 h-3.5" /> Architect Terminal
             </button>
             <button onClick={onLogout} className="text-left text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 flex items-center gap-2 transition-colors">
               <LogOut className="w-3.5 h-3.5" /> Terminate Session
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 w-full min-w-0 transition-colors duration-500 ${activeTab === 'INTEL' ? 'tab-theme-intel' : 'tab-theme-vault'}`}>
          
          {/* LORE NOTICE */}
          <div className="mb-12 border-l border-emerald-900/50 pl-6 py-4 relative group bg-gradient-to-r from-emerald-950/20 to-transparent backdrop-blur-sm border-y border-zinc-900/50">
             <p className="text-[9px] uppercase text-emerald-600 tracking-[0.3em] mb-2 flex items-center gap-2">
               <Activity className="w-3 h-3 animate-pulse" /> Network Insight
             </p>
             <p className="text-lg md:text-xl text-zinc-300 leading-snug font-mono italic">
               "{displayedProphecy}
               {displayedProphecy.length < prophecy.length && <span className="inline-block w-2 h-5 bg-emerald-500 ml-1 animate-pulse" />}
               "
             </p>
             <div className="absolute top-0 -left-[1px] w-[2px] h-0 bg-emerald-500 transition-all duration-700 group-hover:h-full shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'VAULT' && (
              <motion.div key="vault" initial={{opacity:0, filter:"blur(10px)"}} animate={{opacity:1, filter:"blur(0px)"}} exit={{opacity:0, filter:"blur(10px)"}} transition={{duration:0.4}}>
                <AnimatePresence mode="wait">
                  {selectedVaultId ? (
                    <VaultDetail
                      key={selectedVaultId}
                      item={vaultItems.find(i => i.id === selectedVaultId)!}
                      identity={identity}
                      credits={credits}
                      onBack={() => setSelectedVaultId(null)}
                      onBidUpdate={(newCredits, updatedItems) => {
                        setCredits(newCredits);
                        setVaultItems(updatedItems);
                        saveActiveVaultItems(updatedItems);
                      }}
                    />
                  ) : (
                    <motion.div key="grid" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                      {/* header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-mono text-zinc-200 uppercase tracking-widest">The Vault</h2>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-1">
                            {vaultItems.filter(i => i.endsAt > Date.now()).length} active lots
                          </p>
                        </div>
                        {/* mobile credit */}
                        <div className="md:hidden flex items-center gap-3 bg-zinc-950 border border-amber-900/30 px-4 py-2">
                          <span className="text-[9px] uppercase tracking-widest font-mono text-amber-600">Credits</span>
                          <span className="font-mono text-amber-400 text-sm font-bold">ℂ {credits.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* category filter */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setVaultCategory('ALL')}
                          className={`text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all ${vaultCategory === 'ALL' ? 'border-zinc-500 text-zinc-200 bg-zinc-900' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'}`}
                        >
                          All
                        </button>
                        {ALL_CATEGORIES.map(cat => {
                          const s = CATEGORY_STYLES[cat];
                          return (
                            <button
                              key={cat}
                              onClick={() => setVaultCategory(cat)}
                              className={`text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all ${vaultCategory === cat ? s.badge : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'}`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>

                      {/* grid */}
                      {(() => {
                        const now = Date.now();
                        const filtered = vaultItems.filter(i =>
                          i.endsAt > now && (vaultCategory === 'ALL' || i.category === vaultCategory)
                        );
                        return filtered.length === 0 ? (
                          <div className="p-16 text-center text-zinc-600 font-mono text-[10px] tracking-[0.2em] uppercase border border-zinc-900 bg-zinc-950/30">
                            No active lots in this category.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                              {filtered.map(item => (
                                <VaultItemCard key={item.id} item={item} onSelect={setSelectedVaultId} />
                              ))}
                            </AnimatePresence>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'INTEL' && (
              <motion.div key="intel" initial={{opacity:0, filter:"blur(10px)"}} animate={{opacity:1, filter:"blur(0px)"}} exit={{opacity:0, filter:"blur(10px)"}} transition={{duration:0.4}}>
                 <div className="mb-10 p-6 md:p-8 bg-zinc-950 border border-zinc-900 flex flex-col gap-6 shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/10 blur-[60px] pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                       <p className="text-xs text-zinc-400 uppercase tracking-widest max-w-sm leading-relaxed">Broadcast to the public network. Transmissions are automatically encrypted into raw byte format.</p>
                       <button 
                         onClick={() => setIsAnonymous(!isAnonymous)}
                         className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-all ${isAnonymous ? 'border-emerald-900/50 text-emerald-500 bg-emerald-950/20' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
                       >
                         {isAnonymous ? '[Ghost Mode]' : 'Anonymous Off'}
                       </button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <button
                        onClick={toggleRecording}
                        className={`shrink-0 w-14 h-14 border transition-all flex items-center justify-center ${isRecording ? 'bg-emerald-950/50 text-emerald-500 border-emerald-900/50 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                      >
                        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <textarea
                        value={intelText}
                        onChange={(e) => setIntelText(e.target.value)}
                        placeholder={isRecording ? "Capturing audio input..." : "Encode your data payload here..."}
                        className="flex-1 bg-black border border-zinc-800 px-5 py-4 text-zinc-300 focus:outline-none focus:border-emerald-900/50 focus:shadow-[0_0_10px_rgba(16,185,129,0.1)] resize-none min-h-[56px] transition-all"
                      />
                      <button onClick={handlePostIntel} disabled={!intelText} className="shrink-0 bg-zinc-200 text-black px-8 py-4 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 hover:text-black transition-colors flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:bg-zinc-200 h-[56px]">
                         Transmit
                      </button>
                    </div>

                    {/* Location attachment */}
                    <div className="space-y-2">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-600 font-mono flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Attach Location
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {MADRID_LOCATIONS.map(loc => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => setSelectedLocation(selectedLocation?.name === loc.name ? null : loc)}
                            className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest border transition-all ${
                              selectedLocation?.name === loc.name
                                ? 'border-emerald-500/60 text-emerald-400 bg-emerald-950/30'
                                : 'border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                            }`}
                          >
                            ◈ {loc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>
                 
                 {events.length === 0 ? (
                    <div className="p-16 text-center text-zinc-600 font-mono text-[10px] tracking-[0.2em] uppercase border border-zinc-900 bg-zinc-950/30">Archive empty. Await the first transmission.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                       {events.map((ev: any) => <CipherCard key={ev.id} event={ev} />)}
                    </div>
                  )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
