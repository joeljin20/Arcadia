import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrialShell } from './TrialShell';
import { playAccessGranted, playTerminalSuccess } from '../../services/audio';

// Stage 1: find the rough azimuth (SSW, ±10° of 231)
// Stage 2: apply magnetic declination offset → fine target 224 (±3°)
const STAGE1_TARGET = 231;
const STAGE1_TOL    = 10;
const STAGE2_TARGET = 224;
const STAGE2_TOL    = 3;

function bearingDiff(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

type Stage = 'ACQUIRE' | 'CORRECT' | 'SEAL';

const CLUES: Record<Stage, { label: string; primary: string; secondary: string }> = {
  ACQUIRE: {
    label: 'ACQUIRE',
    primary: '"The exiled one watches south-southwest, where Europa rises from the plain."',
    secondary: 'Orient the compass toward his gaze. The mark lies between dusk and midnight.',
  },
  CORRECT: {
    label: 'CORRECT',
    primary: '"Even north deceives. The meridian through Retiro drifts seven degrees toward the setting sun. Take seven from what you hold."',
    secondary: 'The line drifts. Reduce seven degrees. The seal will not hold until the correction is made.',
  },
  SEAL: {
    label: 'SEALED',
    primary: '"The bearing is confirmed. The mark is set beneath the iron wings."',
    secondary: '',
  },
};

// HoldBtn lives outside the component so its type is stable across renders
interface HoldBtnProps {
  delta: number;
  label: string;
  onStart: (delta: number) => void;
  onStop: () => void;
}
function HoldBtn({ delta, label, onStart, onStop }: HoldBtnProps) {
  return (
    <button
      onMouseDown={() => onStart(delta)}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      onTouchStart={(e) => { e.preventDefault(); onStart(delta); }}
      onTouchEnd={onStop}
      className="px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 active:bg-emerald-950/40 transition-all rounded font-mono text-sm select-none touch-none"
    >
      {label}
    </button>
  );
}

export function AngelBearingTrial({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [bearing, setBearing] = useState(0);
  const [stage,   setStage]   = useState<Stage>('ACQUIRE');
  const [success, setSuccess] = useState(false);
  const [stageFlash, setStageFlash] = useState(false);

  // Refs to avoid stale closures in hold intervals
  const bearingRef      = useRef(0);
  const stageRef        = useRef<Stage>('ACQUIRE');
  const successRef      = useRef(false);
  const holdRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bearingRef.current = bearing; }, [bearing]);
  useEffect(() => { stageRef.current   = stage;   }, [stage]);

  // Clean up all timers on unmount
  useEffect(() => () => {
    if (holdRef.current)         clearInterval(holdRef.current);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  const doAdjust = useCallback((delta: number) => {
    if (successRef.current) return;
    const next = ((bearingRef.current + delta) % 360 + 360) % 360;
    setBearing(next);

    if (stageRef.current === 'ACQUIRE' && bearingDiff(next, STAGE1_TARGET) <= STAGE1_TOL) {
      stageRef.current = 'CORRECT';
      setStage('CORRECT');
      setStageFlash(true);
      playTerminalSuccess();
    } else if (stageRef.current === 'CORRECT' && bearingDiff(next, STAGE2_TARGET) <= STAGE2_TOL) {
      stageRef.current = 'SEAL';
      successRef.current = true;
      setStage('SEAL');
      setSuccess(true);
      playAccessGranted();
      successTimerRef.current = setTimeout(onSuccess, 2600);
    }
  }, [onSuccess]);

  const startHold = useCallback((delta: number) => {
    if (holdRef.current) clearInterval(holdRef.current);
    doAdjust(delta);
    holdRef.current = setInterval(() => doAdjust(delta * 0.5), 60);
  }, [doAdjust]);

  const stopHold = useCallback(() => {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; }
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (successRef.current) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); doAdjust(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); doAdjust(1);  }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doAdjust]);

  const currentTarget = stage === 'ACQUIRE' ? STAGE1_TARGET : STAGE2_TARGET;
  const diff = bearingDiff(bearing, currentTarget);
  const wobble = !success && diff > 85;

  // Needle bloom radius based on proximity
  const proximity = Math.max(0, 1 - diff / 70);
  const bloomR    = 4 + proximity * 8;

  const bearingLabel = (b: number) => {
    if (b >= 338 || b < 23)  return 'N';
    if (b < 68)  return 'NE';
    if (b < 113) return 'E';
    if (b < 158) return 'SE';
    if (b < 203) return 'S';
    if (b < 248) return 'SW';
    if (b < 293) return 'W';
    return 'NW';
  };

  const clue = CLUES[stage];

  return (
    <TrialShell
      title="Ángel Caído"
      subtitle={clue.secondary || 'The bearing is confirmed.'}
      step={2}
      onClose={onClose}
      onOverride={onSuccess}
      backgroundImage="/assets/trials/angel-caido.jpg"
      backgroundGradient="linear-gradient(160deg,#0d0a04 0%,#070508 60%,#050a0e 100%)"
      imageObjectPosition="center 30%"
      stageLabel={clue.label}
    >
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Clue text block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="max-w-sm text-center"
          >
            <p className="text-base md:text-lg font-serif italic text-zinc-300 leading-relaxed">
              {clue.primary}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Stage flash overlay when ACQUIRE → CORRECT */}
        <AnimatePresence>
          {stageFlash && (
            <motion.div
              key="stage-flash"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              onAnimationComplete={() => setStageFlash(false)}
              className="fixed inset-0 pointer-events-none z-40"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(52,211,153,0.22) 0%, transparent 70%)' }}
            />
          )}
        </AnimatePresence>

        {/* Stage indicator */}
        <div className="flex gap-4 items-center">
          {(['ACQUIRE', 'CORRECT', 'SEAL'] as Stage[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${['CORRECT','SEAL'].includes(stage) && i <= (['ACQUIRE','CORRECT','SEAL'].indexOf(stage)) ? 'bg-emerald-600' : 'bg-zinc-800'}`} />}
              <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${
                s === stage ? 'text-emerald-400' :
                ['ACQUIRE','CORRECT','SEAL'].indexOf(s) < ['ACQUIRE','CORRECT','SEAL'].indexOf(stage) ? 'text-emerald-700' :
                'text-zinc-700'
              }`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Compass + mini-map row */}
        <div className="flex items-center gap-6">
          {/* Compass */}
          <div className="relative w-48 h-48 shrink-0">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              {/* Bloom ring when close */}
              {proximity > 0.3 && (
                <circle cx="110" cy="110" r={90 + proximity * 8}
                  fill="none"
                  stroke={`rgba(52,211,153,${proximity * 0.25})`}
                  strokeWidth="6"
                />
              )}

              {/* Outer ring */}
              <circle cx="110" cy="110" r="98"
                fill="rgba(5,10,18,0.92)"
                stroke="rgba(52,211,153,0.22)"
                strokeWidth="1.5"
              />

              {/* Tick marks */}
              {Array.from({ length: 72 }, (_, i) => {
                const deg = i * 5;
                const rad = (deg * Math.PI) / 180;
                const isCard = deg % 90 === 0;
                const isMaj  = deg % 45 === 0;
                const r1 = isCard ? 78 : isMaj ? 81 : 85;
                return (
                  <line key={deg}
                    x1={110 + r1  * Math.sin(rad)} y1={110 - r1  * Math.cos(rad)}
                    x2={110 + 96  * Math.sin(rad)} y2={110 - 96  * Math.cos(rad)}
                    stroke={isCard ? 'rgba(52,211,153,0.6)' : isMaj ? 'rgba(52,211,153,0.3)' : 'rgba(52,211,153,0.12)'}
                    strokeWidth={isCard ? 1.4 : 0.7}
                  />
                );
              })}

              {/* Cardinal labels */}
              {[['N',0],['E',90],['S',180],['W',270]].map(([lbl, deg]) => {
                const rad = (Number(deg) * Math.PI) / 180;
                return (
                  <text key={lbl}
                    x={110 + 67 * Math.sin(rad)} y={110 - 67 * Math.cos(rad) + 4}
                    textAnchor="middle"
                    fill="rgba(52,211,153,0.45)"
                    fontSize="11" fontFamily="monospace" fontWeight="bold"
                  >
                    {lbl}
                  </text>
                );
              })}

              {/* Outer group handles bearing rotation around exact SVG center (110,110) */}
              <g
                transform={`rotate(${bearing}, 110, 110)`}
                style={{ transition: 'transform 0.12s ease' }}
              >
                {/* Inner group handles wobble — transformBox:fill-box ensures rotation
                    uses the needle's own bounding-box center (110,110), not the SVG origin */}
                <g style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: wobble ? 'needle-wobble 0.7s ease-in-out infinite' : 'none',
                }}>
                  {proximity > 0.4 && (
                    <circle cx="110" cy={110 - 62}
                      r={bloomR * 0.5}
                      fill={`rgba(52,211,153,${proximity * 0.35})`}
                    />
                  )}
                  <polygon
                    points="110,32 106,110 114,110"
                    fill={
                      success ? '#4ade80' :
                      stage === 'ACQUIRE' ? 'rgba(239,68,68,0.75)' : 'rgba(52,211,153,0.85)'
                    }
                  />
                  <polygon points="110,188 106,110 114,110" fill="rgba(52,211,153,0.3)" />
                  <circle cx="110" cy="110" r="5.5" fill={success ? '#4ade80' : '#0d9488'} />
                  <circle cx="110" cy="110" r="2"   fill="#000" />
                </g>
              </g>
            </svg>
          </div>

          {/* Mini-map inset */}
          <div className="w-28 h-28 relative rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 shrink-0">
            <img
              src="/assets/trials/retiro-map.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.35, filter: 'saturate(0.4)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              alt=""
            />
            {/* Fallback gradient */}
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at 50% 60%,rgba(16,185,129,0.08),transparent 70%),linear-gradient(180deg,#0a1520,#050b10)' }}
            />
            {/* Bearing indicator ray on mini-map */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
              <circle cx="50" cy="50" r="4" fill="rgba(52,211,153,0.7)" />
              <line
                x1="50" y1="50"
                x2={50 + 38 * Math.sin((bearing * Math.PI) / 180)}
                y2={50 - 38 * Math.cos((bearing * Math.PI) / 180)}
                stroke="rgba(52,211,153,0.6)"
                strokeWidth="1"
              />
            </svg>
            <p className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-widest text-emerald-600/60">Retiro</p>
          </div>
        </div>

        {/* Bearing display */}
        <div className="text-center">
          <div className={`text-5xl font-mono font-bold tracking-wider transition-colors duration-300 ${success ? 'text-emerald-400' : 'text-zinc-200'}`}>
            {String(bearing).padStart(3, '0')}°
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 mt-1">
            {bearingLabel(bearing)}
            {!success && stage !== 'SEAL' && diff <= 18 && (
              <span className="text-emerald-600 ml-2">· {Math.round(diff)}° off</span>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 items-center">
          <HoldBtn delta={-10} label="-10°" onStart={startHold} onStop={stopHold} />
          <HoldBtn delta={-1}  label="-1°"  onStart={startHold} onStop={stopHold} />
          <HoldBtn delta={1}   label="+1°"  onStart={startHold} onStop={stopHold} />
          <HoldBtn delta={10}  label="+10°" onStart={startHold} onStop={stopHold} />
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-1"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-600">Seal broken</p>
            <p className="breach-glow-text font-mono text-4xl font-bold tracking-[0.4em]">LUX</p>
          </motion.div>
        )}
      </div>
    </TrialShell>
  );
}
