import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AlchemyPage } from './pages/AlchemyPage';
import { InitiationPage } from './pages/InitiationPage';
import { ArcadiaDashboard } from './pages/ArcadiaDashboard';
import { AdminPanel } from './pages/AdminPanel';

type RouteState = 'ALCHEMY' | 'INITIATION' | 'DASHBOARD' | 'ADMIN';

export default function App() {
  const [appState, setAppState] = useState<RouteState>('ALCHEMY');

  return (
    <div className="min-h-screen flex flex-col max-w-[1400px] mx-auto overflow-x-hidden">
      {/* GLOBAL HEADER */}
      <header className="p-8 md:p-12 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Alchemy</p>
          <h1 className="text-5xl font-serif font-black italic tracking-tighter">The Culinary Vault</h1>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
          <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className={`w-2 h-2 rounded-full bg-emerald-500 ${appState !== 'ALCHEMY' && appState !== 'INITIATION' ? 'opacity-100' : 'animate-pulse'}`}></div> 
            {appState === 'ALCHEMY' ? "System Secure" : "Syndicate Auction Active"}
          </span>
          <span className="text-slate-400 font-mono text-[10px]">v3.0.0-alchemy</span>
        </div>
      </header>

      {/* ROUTING */}
      <main className="flex-1 p-8 md:p-12 pt-0 pb-20 relative">
        <AnimatePresence mode="wait">
          {appState === 'ALCHEMY' && (
            <AlchemyPage 
              key="alchemy" 
              onTriggerArcadia={() => setAppState('INITIATION')} 
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
