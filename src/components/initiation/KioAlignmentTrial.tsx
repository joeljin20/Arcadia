import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { TrialShell } from './TrialShell';
import { playAccessGranted, playTerminalSuccess } from '../../services/audio';

const T = { yaw: 0, left: 15, right: -15 } as const;
const TOL = { yaw: 2.5, cant: 3.5 };
// Drift is smoother: more frequent, smaller step
const DRIFT_INTERVAL_MS = 2000;
const DRIFT_MAG = 0.6;
// User must hold all three axes in tolerance for this long to seal
const LOCK_HOLD_MS = 1000;

function rnd(mag: number) { return (Math.random() - 0.5) * mag * 2; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function score(actual: number, target: number, span: number) {
  return Math.max(0, 1 - Math.abs(actual - target) / span);
}

type Axis = 'yaw' | 'left' | 'right';
type SealState = 'none' | 'sealing' | 'sealed';

interface HoldBtnProps {
  axis: Axis;
  delta: number;
  label: string;
  onStart: (axis: Axis, delta: number) => void;
  onStop: () => void;
}
function HoldBtn({ axis, delta, label, onStart, onStop }: HoldBtnProps) {
  return (
    <button
      onMouseDown={() => onStart(axis, delta)}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      onTouchStart={(e) => { e.preventDefault(); onStart(axis, delta); }}
      onTouchEnd={onStop}
      className="flex-1 h-10 bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 active:bg-emerald-950/40 transition-all rounded font-mono text-sm select-none touch-none"
    >
      {label}
    </button>
  );
}

export function KioAlignmentTrial({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [yaw,   setYaw]   = useState(() => T.yaw   + rnd(7));
  const [left,  setLeft]  = useState(() => T.left  + rnd(9));
  const [right, setRight] = useState(() => T.right + rnd(9));
  const [success,     setSuccess]     = useState(false);
  const [coarse,      setCoarse]      = useState(false);
  const [flash,       setFlash]       = useState(false);
  const [sealState,   setSealState]   = useState<SealState>('none');

  const successRef      = useRef(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yawRef   = useRef(yaw);
  const leftRef  = useRef(left);
  const rightRef = useRef(right);
  useEffect(() => { yawRef.current   = yaw;   }, [yaw]);
  useEffect(() => { leftRef.current  = left;  }, [left]);
  useEffect(() => { rightRef.current = right; }, [right]);

  const holdRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const driftRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (holdRef.current)         clearInterval(holdRef.current);
    if (driftRef.current)        clearInterval(driftRef.current);
    if (lockTimerRef.current)    clearTimeout(lockTimerRef.current);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  const triggerSuccess = useCallback(() => {
    if (successRef.current) return;
    successRef.current = true;
    setSealState('sealed');
    setSuccess(true);
    setFlash(true);
    if (driftRef.current)     clearInterval(driftRef.current);
    if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null; }
    playAccessGranted();
    successTimerRef.current = setTimeout(onSuccess, 2800);
  }, [onSuccess]);

  // Checks whether all axes are currently in tolerance using latest refs
  const allInTol = useCallback(() =>
    Math.abs(yawRef.current   - T.yaw)   <= TOL.yaw &&
    Math.abs(leftRef.current  - T.left)  <= TOL.cant &&
    Math.abs(rightRef.current - T.right) <= TOL.cant
  , []);

  const startLockTimer = useCallback(() => {
    if (lockTimerRef.current || successRef.current) return;
    setSealState('sealing');
    lockTimerRef.current = setTimeout(() => {
      lockTimerRef.current = null;
      if (allInTol() && !successRef.current) {
        triggerSuccess();
      } else {
        setSealState('none');
      }
    }, LOCK_HOLD_MS);
  }, [allInTol, triggerSuccess]);

  const cancelLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    setSealState('none');
  }, []);

  // Drift: smooth small nudges; updates refs inline so lock check is immediate
  useEffect(() => {
    driftRef.current = setInterval(() => {
      if (successRef.current) return;
      setYaw(v => {
        const n = clamp(v + rnd(DRIFT_MAG), -22, 22);
        yawRef.current = n;
        return n;
      });
      setLeft(v => {
        const n = clamp(v + rnd(DRIFT_MAG), -27, 27);
        leftRef.current = n;
        return n;
      });
      setRight(v => {
        const n = clamp(v + rnd(DRIFT_MAG), -27, 27);
        rightRef.current = n;
        return n;
      });
      // If drift knocked an axis out of the lock window, cancel countdown
      if (lockTimerRef.current && !allInTol()) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
        setSealState('none');
      }
    }, DRIFT_INTERVAL_MS);
    return () => { if (driftRef.current) clearInterval(driftRef.current); };
  }, [allInTol]);

  const doAdjust = useCallback((axis: Axis, delta: number) => {
    if (successRef.current) return;
    const [getter, setter, lo, hi] =
      axis === 'yaw'   ? [yawRef,   setYaw,   -22, 22] :
      axis === 'left'  ? [leftRef,  setLeft,  -27, 27] :
                         [rightRef, setRight, -27, 27];
    const next = clamp((getter as React.MutableRefObject<number>).current + delta, lo, hi);
    (getter as React.MutableRefObject<number>).current = next;
    (setter as React.Dispatch<React.SetStateAction<number>>)(next);

    const y = axis === 'yaw'   ? next : yawRef.current;
    const l = axis === 'left'  ? next : leftRef.current;
    const r = axis === 'right' ? next : rightRef.current;

    const ok =
      Math.abs(y - T.yaw)   <= TOL.yaw &&
      Math.abs(l - T.left)  <= TOL.cant &&
      Math.abs(r - T.right) <= TOL.cant;

    if (ok) {
      startLockTimer();
    } else {
      cancelLockTimer();
    }
  }, [startLockTimer, cancelLockTimer]);

  const startHold = useCallback((axis: Axis, delta: number) => {
    if (holdRef.current) clearInterval(holdRef.current);
    doAdjust(axis, delta);
    holdRef.current = setInterval(() => doAdjust(axis, delta * 0.55), 55);
  }, [doAdjust]);

  const stopHold = useCallback(() => {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (successRef.current) return;
      const d = coarse ? 3 : 1;
      const map: Record<string, [Axis, number]> = {
        ArrowLeft:  ['yaw',   -d],
        ArrowRight: ['yaw',    d],
        q:          ['left',  -d],
        e:          ['left',   d],
        a:          ['right', -d],
        d:          ['right',  d],
      };
      const action = map[e.key];
      if (action) { e.preventDefault(); doAdjust(action[0], action[1]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [coarse, doAdjust]);

  const sy = score(yaw,   T.yaw,   18);
  const sl = score(left,  T.left,  22);
  const sr = score(right, T.right, 22);
  const conv = Math.round((sy + sl + sr) / 3 * 100);

  const yawOk   = Math.abs(yaw   - T.yaw)   <= TOL.yaw;
  const leftOk  = Math.abs(left  - T.left)  <= TOL.cant;
  const rightOk = Math.abs(right - T.right) <= TOL.cant;

  const statusLabel =
    success       ? 'Sealed' :
    sealState === 'sealing' ? 'Hold — Sealing' :
    conv < 33 ? 'Divergent' :
    conv < 58 ? 'Initialising' :
    conv < 80 ? 'Near Lock' :
    conv < 96 ? 'Acquiring' :
    'Lock';

  // Guide line geometry: both lines converge at the SVG crosshair center (200,130)
  // when axes are at target. rightTopX sign corrected: positive scale so right cant
  // increasing (toward 0) moves the anchor rightward, matching physical intuition.
  const leftTopX  = 200 + (left  - T.left)  *  3.5;
  const rightTopX = 200 + (right - T.right) *  3.5;

  return (
    <TrialShell
      title="Gate of Europe"
      subtitle="Three optical axes must converge simultaneously. Hold all locked to seal."
      step={1}
      onClose={onClose}
      onOverride={onSuccess}
      backgroundImage="/assets/trials/kio-towers.jpg"
      backgroundGradient="linear-gradient(160deg,#060d15 0%,#030608 60%,#071210 100%)"
      imageObjectPosition="50% 35%"
      stageLabel="Optical Calibration"
    >
      <div className="w-full flex flex-col items-center gap-5">
        {/* Viewport */}
        <div className="relative w-full max-w-md h-52 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 80% at 50% 110%,rgba(16,185,129,0.06) 0%,transparent 70%),' +
                'linear-gradient(180deg,#0a1520 0%,#050b10 100%)',
            }}
          />

          {/* Reticle SVG — rotates with yaw */}
          <svg
            viewBox="0 0 400 260"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: `rotate(${yaw * 0.22}deg)`,
              transition: 'transform 0.12s ease',
            }}
          >
            {/* Outer dashed ring contracts with convergence */}
            <circle
              cx="200" cy="130"
              r={26 + (1 - conv / 100) * 34}
              fill="none"
              stroke={`rgba(52,211,153,${0.12 + conv / 280})`}
              strokeWidth="0.6"
              strokeDasharray={`${conv * 0.24} 4`}
            />
            <circle
              cx="200" cy="130"
              r={14 + (1 - conv / 100) * 20}
              fill="none"
              stroke={`rgba(52,211,153,${0.28 + conv / 220})`}
              strokeWidth="0.8"
            />
            {conv > 55 && (
              <circle
                cx="200" cy="130"
                r={4 + (1 - conv / 100) * 10}
                fill="none"
                stroke={`rgba(52,211,153,${conv / 100})`}
                strokeWidth="1"
              />
            )}

            {/* Crosshair at visual center */}
            <line x1="192" y1="130" x2="208" y2="130" stroke="rgba(52,211,153,0.65)" strokeWidth="0.5" />
            <line x1="200" y1="122" x2="200" y2="138" stroke="rgba(52,211,153,0.65)" strokeWidth="0.5" />

            {/* Vanishing point */}
            <circle
              cx="200" cy="130"
              r={success ? 4 : 2.5}
              fill={sealState === 'sealing' ? '#fbbf24' : success ? '#4ade80' : 'rgba(52,211,153,0.85)'}
              style={{ filter: success ? 'drop-shadow(0 0 6px #4ade80)' : sealState === 'sealing' ? 'drop-shadow(0 0 4px #fbbf24)' : 'none' }}
            />

            {/* Left cant guide — converges at (200,130) when left=15 */}
            <line
              x1="55" y1="260"
              x2={leftTopX} y2="130"
              stroke={leftOk ? (sealState === 'sealing' ? '#fbbf24' : '#4ade80') : 'rgba(52,211,153,0.22)'}
              strokeWidth={leftOk ? 1.2 : 0.5}
              style={{ transition: 'all 0.12s ease', filter: leftOk ? `drop-shadow(0 0 3px ${sealState === 'sealing' ? '#fbbf24' : '#4ade80'})` : 'none' }}
            />
            {/* Right cant guide — converges at (200,130) when right=−15 */}
            <line
              x1="345" y1="260"
              x2={rightTopX} y2="130"
              stroke={rightOk ? (sealState === 'sealing' ? '#fbbf24' : '#4ade80') : 'rgba(52,211,153,0.22)'}
              strokeWidth={rightOk ? 1.2 : 0.5}
              style={{ transition: 'all 0.12s ease', filter: rightOk ? `drop-shadow(0 0 3px ${sealState === 'sealing' ? '#fbbf24' : '#4ade80'})` : 'none' }}
            />

            {/* Yaw lock bands */}
            <line x1="0" y1="130" x2={200 - 44} y2="130" stroke={yawOk ? (sealState === 'sealing' ? '#fbbf24' : '#4ade80') : 'rgba(52,211,153,0.08)'} strokeWidth="0.4" />
            <line x1={200 + 44} y1="130" x2="400" y2="130" stroke={yawOk ? (sealState === 'sealing' ? '#fbbf24' : '#4ade80') : 'rgba(52,211,153,0.08)'} strokeWidth="0.4" />

            {success && <>
              <circle cx="200" cy="130" r="24" fill="none" stroke="rgba(74,222,128,0.55)" strokeWidth="1.8" />
              <circle cx="200" cy="130" r="9"  fill="none" stroke="rgba(74,222,128,0.85)" strokeWidth="1.2" />
            </>}
          </svg>

          {/* Status pill */}
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border transition-all duration-300 whitespace-nowrap ${
            success               ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-300' :
            sealState === 'sealing' ? 'bg-amber-950/80  border-amber-400/60   text-amber-300'  :
            conv > 80             ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-500' :
                                    'bg-black/70       border-zinc-700/60    text-zinc-500'
          } text-[10px] font-mono uppercase tracking-widest`}>
            {statusLabel}{sealState !== 'sealing' && !success && ` · ${conv}%`}
          </div>

          {/* Sealing countdown bar */}
          {sealState === 'sealing' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-zinc-800">
              <div
                key="seal-bar"
                className="h-full"
                style={{
                  background: '#fbbf24',
                  boxShadow: '0 0 6px #fbbf24',
                  animation: `seal-countdown ${LOCK_HOLD_MS}ms linear forwards`,
                }}
              />
            </div>
          )}

          {/* Per-axis lock dots */}
          <div className={`absolute ${sealState === 'sealing' ? 'bottom-5' : 'bottom-3'} left-1/2 -translate-x-1/2 flex gap-2.5 transition-all`}>
            {([['Y', yawOk], ['L', leftOk], ['R', rightOk]] as [string, boolean][]).map(([lbl, ok]) => (
              <div key={lbl} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full transition-all ${ok ? (sealState === 'sealing' ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]') : 'bg-zinc-700'}`} />
                <span className={`text-[8px] font-mono ${ok ? (sealState === 'sealing' ? 'text-amber-500' : 'text-emerald-500') : 'text-zinc-600'}`}>{lbl}</span>
              </div>
            ))}
          </div>

          {/* Flash on seal */}
          {flash && (
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: 'rgba(52,211,153,0.15)', animation: 'pass-flash 0.5s ease-out forwards' }}
              onAnimationEnd={() => setFlash(false)}
            />
          )}
        </div>

        {/* Controls */}
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              ← → yaw · Q/E left cant · A/D right cant
            </span>
            <button
              onClick={() => setCoarse(c => !c)}
              className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-all rounded ${
                coarse ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
              }`}
            >
              {coarse ? 'Coarse ×3' : 'Fine ×1'}
            </button>
          </div>

          {([
            ['YAW',        'yaw',   yaw,   yawOk,   sy],
            ['LEFT CANT',  'left',  left,  leftOk,  sl],
            ['RIGHT CANT', 'right', right, rightOk, sr],
          ] as [string, Axis, number, boolean, number][]).map(([label, axis, , ok, s]) => (
            <div key={axis} className="flex items-center gap-3">
              <span className={`shrink-0 text-[10px] font-mono uppercase tracking-widest w-24 transition-colors ${
                ok ? (sealState === 'sealing' ? 'text-amber-400' : 'text-emerald-400') : 'text-zinc-600'
              }`}>
                {label}
              </span>
              <div className="flex gap-1.5 flex-1">
                <HoldBtn axis={axis} delta={-(coarse ? 3 : 1)} label="◀" onStart={startHold} onStop={stopHold} />
                <HoldBtn axis={axis} delta={coarse ? 3 : 1}    label="▶" onStart={startHold} onStop={stopHold} />
              </div>
              <div className="w-14 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.max(4, s * 100)}%`,
                    background: ok ? (sealState === 'sealing' ? '#fbbf24' : '#4ade80') : '#52525b',
                    boxShadow: ok ? `0 0 5px ${sealState === 'sealing' ? 'rgba(251,191,36,0.7)' : 'rgba(74,222,128,0.7)'}` : 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1 pt-2"
          >
            <p className="breach-glow-text font-mono text-sm tracking-[0.2em] uppercase">
              Convergence Achieved
            </p>
            <p className="text-zinc-500 font-mono text-[10px] tracking-widest">
              The gate opens toward Retiro
            </p>
          </motion.div>
        )}
      </div>
    </TrialShell>
  );
}
