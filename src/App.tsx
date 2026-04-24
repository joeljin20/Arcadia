import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AlchemyPage } from './pages/AlchemyPage';
import { InitiationPage } from './pages/InitiationPage';
import { ArcadiaDashboard } from './pages/ArcadiaDashboard';
import { AdminPanel } from './pages/AdminPanel';

type RouteState = 'ALCHEMY' | 'INITIATION' | 'DASHBOARD' | 'ADMIN';

export default function App() {
  const [appState, setAppState] = useState<RouteState>('ALCHEMY');
  const [searchVisible, setSearchVisible] = useState(false);

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* GLOBAL HEADER */}
      {appState === 'ALCHEMY' && (
        <div className="max-w-[1400px] mx-auto w-full">
          <header className="p-8 md:p-12 md:pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div className="space-y-3">
              <button 
                 onClick={() => setSearchVisible(s => !s)}
                 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 hover:text-emerald-500 transition-colors bg-emerald-900/5 hover:bg-emerald-900/10 px-3 py-1.5 rounded-full cursor-pointer text-left inline-block"
              >
                Alchemy
              </button>
              <h1 className="text-5xl md:text-6xl font-serif font-black italic tracking-tighter text-slate-900 leading-none">The Culinary Vault</h1>
              <p className="text-slate-500 font-serif italic text-lg opacity-80 pl-1">Alchemy is where the magic happens.</p>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-4 text-xs font-medium">
              <button onClick={() => setAppState('DASHBOARD')} className="bg-red-500/10 text-red-600 hover:bg-red-500/20 px-4 py-2 rounded-full border border-red-500/20 shadow-sm font-bold tracking-widest uppercase transition-colors">
                 Override (Dev Bypass)
              </button>
              <span className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 shadow-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-100"></div> 
                System Secure
              </span>
            </div>
          </header>
        </div>
      )}

      {/* ROUTING */}
      <main className={`flex-1 relative ${appState === 'ALCHEMY' ? 'max-w-[1400px] mx-auto w-full p-8 md:p-12 pt-0 pb-20' : ''}`}>
        <AnimatePresence mode="wait">
          {appState === 'ALCHEMY' && (
            <AlchemyPage 
              key="alchemy" 
              onTriggerArcadia={() => setAppState('INITIATION')} 
              searchVisible={searchVisible}
            />
          )}
          
          {appState === 'DASHBOARD' && (
            <ArcadiaDashboard 
              key="dashboard"
              onAdminToggle={() => setAppState('ADMIN')} 
              onLogout={() => setAppState('ALCHEMY')} 
            />
          )}

          {appState === 'ADMIN' && (
            <AdminPanel 
              key="admin"
              onBack={() => setAppState('DASHBOARD')} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* OVERLAY ROUTE FOR INITIATION */}
      <AnimatePresence>
        {appState === 'INITIATION' && (
          <InitiationPage 
            onClose={() => setAppState('ALCHEMY')} 
            onSuccess={() => setAppState('DASHBOARD')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
