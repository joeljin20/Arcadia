import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrialShell } from './TrialShell';
import { playTerminalSuccess, playTerminalError, playAccessGranted, playTerminalClick } from '../../services/audio';

// ----- Puzzle bank -----
// Each puzzle: watch source → read rule → input transformed answer.
// Answers are deterministic from the rule; no ambiguity.
const PUZZLE_BANK = [
  {
    source:     [1, 3, 2, 5, 4],
    ruleText:   'Reverse the sequence',
    cipherHint: 'The first ghost becomes the last. The last assumes the vanguard.',
    answer:     [4, 5, 2, 3, 1],
  },
  {
    source:     [2, 4, 1, 5, 3],
    ruleText:   'Rotate one position forward — last wraps to front',
    cipherHint: 'Each signal advances one station. The rearguard leads.',
    answer:     [3, 2, 4, 1, 5],
  },
  {
    source:     [3, 1, 4, 2, 5],
    ruleText:   'Sort ascending by signal number',
    cipherHint: 'The lowest frequency must precede the highest. Order the static.',
    answer:     [1, 2, 3, 4, 5],
  },
  {
    source:     [5, 3, 1, 4, 2],
    ruleText:   'Mirror — swap first↔last, then second↔fourth',
    cipherHint: 'The tunnel reflects. What enters at one end exits at the other.',
    answer:     [2, 4, 1, 3, 5],
  },
  {
    source:     [4, 2, 5, 1, 3],
    ruleText:   'Odd positions first (1,3,5), then even (2,4)',
    cipherHint: 'Stations of odd standing precede those at even. Reorder the manifest.',
    answer:     [4, 5, 3, 2, 1],
  },
];

const DEMO_STEP_MS  = 680;
const SLOW_STEP_MS  = 1100;
const INPUT_SECS    = 24;
const MAX_MISTAKES  = 3;
const REPLAY_COOLDOWN_S = 5;

// Node positions computed for a geometrically regular pentagon
// inside a 288×240 px container (w-72 h-60), radius 82 px, center at (50%, 50%).
// Formula: x = 50 + (r*sin θ / W)*100, y = 50 - (r*cos θ / H)*100
// where θ = −90° + i×72°, W=288, H=240, r=82
const NODES = [
  { id: 1, x: 50,   y: 15.8 },  // top     θ=−90°
  { id: 2, x: 22.9, y: 39.4 },  // upper-left  θ=−18° (mirrored from upper-right)
  { id: 3, x: 77.1, y: 39.4 },  // upper-right θ=−18°
  { id: 4, x: 33.3, y: 77.5 },  // lower-left  θ= 54°
  { id: 5, x: 66.7, y: 77.5 },  // lower-right θ= 54°
];
const EDGES = [[0,1],[0,2],[1,3],[2,4],[3,4],[1,2]] as [number,number][];

type Phase = 'OBSERVE' | 'DECODE' | 'INPUT';

export function ChamberiSignalTrial({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  // Pick puzzle deterministically by day-of-year mod 5
  const puzzle = PUZZLE_BANK[new Date().getDate() % PUZZLE_BANK.length];

  const [phase,       setPhase]       = useState<Phase>('OBSERVE');
  const [demoNodeId,  setDemoNodeId]  = useState<number | null>(null);
  const [demoActive,  setDemoActive]  = useState(false);
  const [clickStep,   setClickStep]   = useState(0);
  const [activated,   setActivated]   = useState<number[]>([]);
  const [wrongId,     setWrongId]     = useState<number | null>(null);
  const [mistakes,    setMistakes]    = useState(0);
  const [success,     setSuccess]     = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(INPUT_SECS);
  const [replayCd,    setReplayCd]    = useState(0);
  const [slowMode,    setSlowMode]    = useState(false);
  const [usedSlow,    setUsedSlow]    = useState(false);

  const tRef            = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successRef      = useRef(false);

  const clearAll = useCallback(() => {
    tRef.current.forEach(clearTimeout);
    tRef.current = [];
    if (timerRef.current)        clearInterval(timerRef.current);
    if (cdRef.current)           clearInterval(cdRef.current);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  useEffect(() => () => clearAll(), [clearAll]);

  // ----- run demo sequence -----
  const runDemo = useCallback((stepMs = DEMO_STEP_MS) => {
    clearAll();
    setDemoActive(true);
    setDemoNodeId(null);

    puzzle.source.forEach((nodeId, idx) => {
      tRef.current.push(
        setTimeout(() => {
          setDemoNodeId(nodeId);
          try { playTerminalClick(); } catch { /* ok */ }
        }, 420 + idx * stepMs)
      );
    });
    tRef.current.push(
      setTimeout(() => {
        setDemoNodeId(null);
        setDemoActive(false);
        setPhase('DECODE');
      }, 420 + puzzle.source.length * stepMs + 420)
    );
  }, [clearAll, puzzle.source]);

  useEffect(() => { runDemo(); }, []);

  // ----- start input timer when phase switches -----
  useEffect(() => {
    if (phase !== 'INPUT') return;
    setTimeLeft(INPUT_SECS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Time's up: go back to OBSERVE
          resetToObserve();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ----- replay cooldown ticker -----
  const startCooldown = () => {
    setReplayCd(REPLAY_COOLDOWN_S);
    cdRef.current = setInterval(() => {
      setReplayCd(c => {
        if (c <= 1) { clearInterval(cdRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const resetToObserve = useCallback(() => {
    clearAll();
    setPhase('OBSERVE');
    setClickStep(0);
    setActivated([]);
    setWrongId(null);
    setTimeLeft(INPUT_SECS);
    tRef.current.push(setTimeout(() => runDemo(slowMode ? SLOW_STEP_MS : DEMO_STEP_MS), 100));
  }, [clearAll, runDemo, slowMode]);

  const handleReplay = () => {
    if (replayCd > 0 || demoActive || success) return;
    startCooldown();
    resetToObserve();
  };

  const handleSlowReplay = () => {
    if (replayCd > 0 || demoActive || success) return;
    setSlowMode(true);
    setUsedSlow(true);
    startCooldown();
    resetToObserve();
  };

  const handleNodeClick = (nodeId: number) => {
    if (demoActive || success || phase !== 'INPUT') return;

    const expected = puzzle.answer[clickStep];
    if (nodeId === expected) {
      playTerminalSuccess();
      const next = clickStep + 1;
      setActivated(prev => [...prev, nodeId]);
      setClickStep(next);
      if (next >= puzzle.answer.length) {
        clearAll();
        successRef.current = true;
        setSuccess(true);
        playAccessGranted();
        successTimerRef.current = setTimeout(onSuccess, 2300);
      }
    } else {
      playTerminalError();
      setWrongId(nodeId);
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      tRef.current.push(setTimeout(() => {
        setWrongId(null);
        setClickStep(0);
        setActivated([]);
        if (nextMistakes >= MAX_MISTAKES) {
          setMistakes(0);
          resetToObserve();
        }
      }, 500));
    }
  };

  const handleStartInput = () => {
    if (phase !== 'DECODE' || demoActive) return;
    setPhase('INPUT');
  };

  const progressPct = (timeLeft / INPUT_SECS) * 100;
  const timerColor  =
    progressPct > 60 ? '#4ade80' :
    progressPct > 30 ? '#fbbf24' : '#ef4444';

  return (
    <TrialShell
      title="Chamberí Ghost Station"
      subtitle={
        phase === 'OBSERVE' ? 'Five signals pulse in the dark. Observe the sequence.' :
        phase === 'DECODE'  ? 'Decode the transformation rule. Then activate.' :
        'Enter the transformed sequence before the signal fades.'
      }
      step={3}
      onClose={onClose}
      onOverride={onSuccess}
      backgroundImage="/assets/trials/chamberi-platform.jpg"
      backgroundGradient="linear-gradient(180deg,#060810 0%,#040608 50%,#040a06 100%)"
      imageObjectPosition="center 60%"
      stageLabel={
        phase === 'OBSERVE' ? 'Observe' :
        phase === 'DECODE'  ? 'Decode' :
        'Input'
      }
    >
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Source sequence display (during OBSERVE) */}
        <AnimatePresence mode="wait">
          {phase === 'OBSERVE' && (
            <motion.div
              key="observe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 items-center"
            >
              {puzzle.source.map((n, i) => (
                <motion.div
                  key={i}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold transition-all ${
                    demoNodeId === n
                      ? 'bg-emerald-400 border-emerald-300 text-black shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                  }`}
                  animate={demoNodeId === n ? { scale: [1, 1.35, 1.1] } : {}}
                  transition={{ duration: 0.35 }}
                >
                  {n}
                </motion.div>
              ))}
            </motion.div>
          )}

          {(phase === 'DECODE' || phase === 'INPUT') && (
            <motion.div
              key="rule"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm bg-zinc-950/80 border border-emerald-900/30 p-5 space-y-3 rounded-xl"
            >
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-emerald-600">Transform Rule</p>
              <p className="text-base font-mono text-zinc-200 font-semibold">{puzzle.ruleText}</p>
              <p className="text-[11px] font-serif italic text-zinc-500 leading-relaxed border-t border-zinc-800 pt-3">
                "{puzzle.cipherHint}"
              </p>
              <div className="flex gap-2 flex-wrap pt-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">Source:</span>
                {puzzle.source.map((n, i) => (
                  <span key={i} className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{n}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Node graph */}
        <div className="relative w-72 h-60 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl overflow-hidden">
          {/* Metro track lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {EDGES.map(([a, b], i) => (
              <line key={i}
                x1={NODES[a].x} y1={NODES[a].y}
                x2={NODES[b].x} y2={NODES[b].y}
                stroke="rgba(52,211,153,0.10)"
                strokeWidth="0.7"
                strokeDasharray="2.5,2"
              />
            ))}
          </svg>

          {/* Nodes */}
          {NODES.map(({ id, x, y }) => {
            const isDemo    = demoNodeId === id;
            const isActive  = activated.includes(id);
            const isWrong   = wrongId === id;
            const nextExpected = phase === 'INPUT' && puzzle.answer[clickStep] === id;
            const canClick  = phase === 'INPUT' && !demoActive && !success;

            return (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.button
                  onClick={() => handleNodeClick(id)}
                  disabled={!canClick}
                  animate={
                    isWrong ? { scale: [1, 1.5, 0.9, 1] } :
                    isDemo  ? { scale: [0.9, 1.65, 1.2]  } :
                    {}
                  }
                  transition={{ duration: 0.32 }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    isWrong  ? 'bg-red-500   border-red-400   shadow-[0_0_14px_rgba(239,68,68,0.8)]   cursor-pointer' :
                    isDemo   ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.95)] cursor-default' :
                    isActive || success
                             ? 'bg-emerald-600 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]  cursor-pointer' :
                    nextExpected
                             ? 'bg-zinc-800 border-emerald-500/40 animate-pulse cursor-pointer' :
                    canClick ? 'bg-zinc-800 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-700 cursor-pointer' :
                               'bg-zinc-900 border-zinc-800 cursor-default'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full transition-colors ${
                    isDemo || isActive || success ? 'bg-white' :
                    isWrong ? 'bg-white' :
                    'bg-zinc-500'
                  }`} />
                </motion.button>
              </div>
            );
          })}

          {/* Timer bar (INPUT phase) */}
          {phase === 'INPUT' && !success && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-800">
              <div
                className="h-full transition-none"
                style={{
                  width: `${progressPct}%`,
                  background: timerColor,
                  boxShadow: `0 0 6px ${timerColor}`,
                  transition: 'width 1s linear',
                }}
              />
            </div>
          )}
        </div>

        {/* Progress pips + mistake dots */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {puzzle.answer.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i < clickStep
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                  : 'bg-zinc-800'
              }`} />
            ))}
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">
            {success ? 'Complete' :
             phase === 'OBSERVE' ? (demoActive ? 'Observe...' : 'Processing...') :
             phase === 'DECODE'  ? 'Decode + activate' :
             `${clickStep} / ${puzzle.answer.length}`}
          </span>
          {/* Mistake indicators */}
          <div className="flex gap-1">
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < mistakes ? 'bg-red-500' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          {phase === 'DECODE' && (
            <button
              onClick={handleStartInput}
              className="px-6 py-2.5 bg-emerald-900/30 border border-emerald-600/50 text-emerald-400 font-mono text-[11px] uppercase tracking-widest hover:bg-emerald-900/50 transition-all rounded"
            >
              Begin Input
            </button>
          )}

          {phase !== 'OBSERVE' && !success && (
            <button
              onClick={replayCd > 0 ? undefined : handleReplay}
              disabled={replayCd > 0 || demoActive}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest border rounded transition-all ${
                replayCd > 0
                  ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  : 'border-zinc-700 text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400'
              }`}
            >
              {replayCd > 0 ? `Replay (${replayCd}s)` : 'Replay sequence'}
            </button>
          )}

          {phase !== 'OBSERVE' && !success && !usedSlow && (
            <button
              onClick={replayCd > 0 ? undefined : handleSlowReplay}
              disabled={replayCd > 0 || demoActive}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest border rounded transition-all ${
                replayCd > 0
                  ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  : 'border-zinc-700/60 text-zinc-600 hover:border-amber-500/30 hover:text-amber-500/60'
              }`}
            >
              Slow replay
            </button>
          )}
        </div>

        {success && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-400 font-mono text-sm tracking-[0.2em] uppercase"
          >
            Presence accepted. Arcadia yields.
          </motion.p>
        )}
      </div>
    </TrialShell>
  );
}
