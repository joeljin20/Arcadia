import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cpu, ShieldAlert, X } from 'lucide-react';
import { NUMBER_SEQUENCE } from '../config/constants';
import type { HackerState } from '../types';
import {
  playTerminalBreach,
  playTerminalClick,
  playTerminalError,
  playTerminalSuccess,
} from '../services/audio';

interface HackerConsoleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onBreach: () => void;
}

type InputValidationState =
  | 'IDLE'
  | 'EMPTY'
  | 'FORMAT_INVALID'
  | 'LENGTH_INVALID'
  | 'ORDER_INVALID'
  | 'VALID';

const GRID_NUMBERS = Array.from({ length: 16 }, (_, index) => index + 1);
const WAITING_MESSAGE = '> WAITING_FOR_KEY_SEQUENCE...';

function nextSessionId() {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
}

function parseSequenceInput(raw: string): { state: InputValidationState; values: number[]; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { state: 'EMPTY', values: [], message: 'Enter the full key sequence before verifying.' };
  }

  if (/[a-z]/i.test(trimmed)) {
    return { state: 'FORMAT_INVALID', values: [], message: 'Use numbers only with spaces, commas, or dashes.' };
  }

  const tokens = trimmed
    .split(/[^0-9]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return { state: 'FORMAT_INVALID', values: [], message: 'Input format is invalid. Try 7 2 14 or 7-2-14.' };
  }

  const values = tokens.map((value) => Number(value));
  const allFinite = values.every(Number.isFinite);
  const inRange = values.every((value) => value >= 1 && value <= 16);

  if (!allFinite || !inRange) {
    return { state: 'FORMAT_INVALID', values: [], message: 'Values must be whole numbers between 1 and 16.' };
  }

  if (values.length !== NUMBER_SEQUENCE.length) {
    return {
      state: 'LENGTH_INVALID',
      values,
      message: `Expected ${NUMBER_SEQUENCE.length} numbers. You entered ${values.length}.`,
    };
  }

  const inOrder = values.every((value, index) => value === NUMBER_SEQUENCE[index]);
  if (!inOrder) {
    return { state: 'ORDER_INVALID', values, message: 'Sequence rejected. Order does not match the key.' };
  }

  return { state: 'VALID', values, message: 'Sequence verified. Breaching node...' };
}

export function HackerConsoleOverlay({ isOpen, onClose, onBreach }: HackerConsoleOverlayProps) {
  const [status, setStatus] = useState<HackerState>('STANDBY');
  const [terminalMessage, setTerminalMessage] = useState(WAITING_MESSAGE);
  const [typedMessage, setTypedMessage] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wrongNumber, setWrongNumber] = useState<number | null>(null);
  const [integrity, setIntegrity] = useState(0);
  const [integrityError, setIntegrityError] = useState(false);
  const [breachCelebration, setBreachCelebration] = useState(false);
  const [sessionId, setSessionId] = useState(nextSessionId());
  const [sequenceInput, setSequenceInput] = useState('');
  const [typedValidationState, setTypedValidationState] = useState<InputValidationState>('IDLE');
  const [typedValidationMessage, setTypedValidationMessage] = useState('');
  const [booted, setBooted] = useState(false);
  const [sparkedNum, setSparkedNum] = useState<number | null>(null);
  const [showStatic, setShowStatic] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [egoVisible, setEgoVisible] = useState(false);
  const timeoutRefs = useRef<number[]>([]);
  const logDumpRef = useRef<HTMLDivElement | null>(null);

  const dataColumns = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => {
      const len = 64 + Math.floor(Math.random() * 28);
      const stream = Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join(' ');
      return {
        id: idx,
        stream,
        duration: 12 + Math.random() * 10,
        delay: Math.random() * 6,
      };
    });
  }, []);

  const logLines = useMemo(() => {
    const progress = Math.round((currentIndex / NUMBER_SEQUENCE.length) * 100);
    const lines = [
      '> SOURCE: The_Obsidian_Cipher_Torte.blog',
      '> NODE_GRID: [1..16]',
      '> PROTOCOL: SEQUENCE_LOCK_ACTIVE',
      `> SEGMENTS_CONFIRMED: ${currentIndex} / ${NUMBER_SEQUENCE.length}`,
      `> BREACH_PROBABILITY: ${progress}%`,
      `> CURRENT_INPUT: [${selectedNumbers.join(', ')}]`,
    ];
    if (hintRevealed) {
      lines.push(`> [CLASSIFIED] SEQUENCE_KEY: [${NUMBER_SEQUENCE.join(', ')}]`);
    }
    if (status === 'BREACHED') {
      lines.push('>> ACCESS_GRANTED // PAYLOAD_UNLOCKED', '>> ET IN ARCADIA EGO');
    }
    return lines;
  }, [currentIndex, hintRevealed, selectedNumbers, status]);

  const clearScheduledTimeouts = () => {
    timeoutRefs.current.forEach((id) => window.clearTimeout(id));
    timeoutRefs.current = [];
  };

  const schedule = (callback: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter((existing) => existing !== id);
      callback();
    }, delayMs);
    timeoutRefs.current.push(id);
  };

  useEffect(() => {
    if (!isOpen) {
      clearScheduledTimeouts();
      return;
    }

    clearScheduledTimeouts();
    setStatus('STANDBY');
    setTerminalMessage(WAITING_MESSAGE);
    setTypedMessage('');
    setSelectedNumbers([]);
    setCurrentIndex(0);
    setWrongNumber(null);
    setIntegrity(0);
    setIntegrityError(false);
    setBreachCelebration(false);
    setSessionId(nextSessionId());
    setSequenceInput('');
    setTypedValidationState('IDLE');
    setTypedValidationMessage('');
    setBooted(false);
    setShowStatic(false);
    setSparkedNum(null);
    setIsShaking(true);
    setHintRevealed(false);
    setEgoVisible(false);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      clearScheduledTimeouts();
    };
  }, []);

  useEffect(() => {
    if (!breachCelebration) { setEgoVisible(false); return; }
    const id = window.setTimeout(() => setEgoVisible(true), 1500);
    return () => window.clearTimeout(id);
  }, [breachCelebration]);

  const inputPlaceholder = useMemo(() => {
    const safe = [3, 11, 8, 2, 14, 7, 5, 9];
    return `e.g. ${safe.slice(0, NUMBER_SEQUENCE.length).join('-')}`;
  }, []);

  useEffect(() => {
    if (!logDumpRef.current) {
      return;
    }
    logDumpRef.current.scrollTo({
      top: logDumpRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [logLines, terminalMessage]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let index = 0;
    setTypedMessage('');

    const interval = window.setInterval(() => {
      index += 1;
      setTypedMessage(terminalMessage.slice(0, index));

      if (index >= terminalMessage.length) {
        window.clearInterval(interval);
      }
    }, 18);

    return () => window.clearInterval(interval);
  }, [isOpen, terminalMessage]);

  const resetAfterFailure = () => {
    clearScheduledTimeouts();
    setStatus('STANDBY');
    setTerminalMessage(WAITING_MESSAGE);
    setSelectedNumbers([]);
    setCurrentIndex(0);
    setWrongNumber(null);
    setIntegrity(0);
    setIntegrityError(false);
    setBreachCelebration(false);
    setSequenceInput('');
    setTypedValidationState('IDLE');
    setTypedValidationMessage('');
  };

  const triggerBreach = () => {
    // Shared success path for both node-click and typed-sequence verification.
    playTerminalBreach();
    setBreachCelebration(true);
    setStatus('BREACHED');
    setIntegrity(100);
    setSelectedNumbers([...NUMBER_SEQUENCE]);
    setCurrentIndex(NUMBER_SEQUENCE.length);
    setTerminalMessage('> ACCESS_GRANTED // DECRYPTING_PAYLOAD...');

    schedule(() => {
      setTerminalMessage('> PAYLOAD: THE_OBSIDIAN_CIPHER_TORTE');
    }, 700);

    schedule(() => {
      setTerminalMessage('> TRANSMISSION: ET_IN_ARCADIA_EGO');
    }, 1500);

    schedule(() => {
      onBreach();
    }, 3200);
  };

  const handleNumberClick = (value: number) => {
    if (!isOpen || status === 'LOCKED' || status === 'BREACHED') {
      return;
    }

    playTerminalClick();

    const expected = NUMBER_SEQUENCE[currentIndex];

    if (value !== expected) {
      playTerminalError();
      setWrongNumber(value);
      setStatus('LOCKED');
      setIntegrityError(true);
      setShowStatic(true);
      setTerminalMessage('> ERROR: ACCESS_DENIED // TRACE_ACTIVE');

      schedule(() => {
        resetAfterFailure();
      }, 1500);
      return;
    }

    playTerminalSuccess();
    setSparkedNum(value);

    const nextIndex = currentIndex + 1;
    const nextSelectedNumbers = [...selectedNumbers, value];

    setSelectedNumbers(nextSelectedNumbers);
    setCurrentIndex(nextIndex);
    setIntegrity(nextIndex * 10);
    setStatus(nextIndex === NUMBER_SEQUENCE.length ? 'BREACHED' : 'SCANNING');
    setTerminalMessage(`> SEGMENT_${nextIndex} VERIFIED`);

    if (nextIndex < NUMBER_SEQUENCE.length) {
      schedule(() => {
        setStatus('STANDBY');
        setTerminalMessage(WAITING_MESSAGE);
      }, 420);
      return;
    }

    triggerBreach();
  };

  const handleTypedSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!isOpen || status === 'LOCKED' || status === 'BREACHED') {
      return;
    }

    const parsed = parseSequenceInput(sequenceInput);
    setTypedValidationState(parsed.state);
    setTypedValidationMessage(parsed.message);

    if (parsed.state !== 'VALID') {
      playTerminalError();
      setStatus('LOCKED');
      setIntegrityError(true);
      setTerminalMessage('> ERROR: ACCESS_DENIED // TRACE_ACTIVE');
      setWrongNumber(null);
      schedule(() => {
        resetAfterFailure();
      }, 1500);
      return;
    }

    playTerminalSuccess();
    setSelectedNumbers([...NUMBER_SEQUENCE]);
    setCurrentIndex(NUMBER_SEQUENCE.length);
    setIntegrity(100);
    setTerminalMessage(`> SEGMENT_${NUMBER_SEQUENCE.length} VERIFIED`);

    schedule(() => {
      triggerBreach();
    }, 420);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="hacker-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[90] bg-black/95 p-4 md:p-8 flex items-center justify-center ${integrityError || breachCelebration ? 'violent-glitch' : ''}`}
        >
          <div className="crt-overlay" />
          {!booted && (
            <div
              className="fx-boot-scan absolute inset-0 z-30 pointer-events-none"
              onAnimationEnd={() => setBooted(true)}
            />
          )}
          {showStatic && (
            <div
              className="fx-static-burst absolute inset-0 z-[100] pointer-events-none"
              onAnimationEnd={() => setShowStatic(false)}
            />
          )}

          <div
            className={`w-full max-w-6xl${isShaking ? ' modal-shake' : ''}`}
            onAnimationEnd={() => setIsShaking(false)}
          >
          <motion.div
            initial={{ y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.98 }}
            className="relative w-full h-[88vh] border border-[#22c55e]/40 bg-black shadow-[0_0_40px_rgba(34,197,94,0.25)] overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
              {dataColumns.map((column) => (
                <motion.div
                  key={column.id}
                  className="absolute top-0 text-[9px] leading-5 font-mono text-[#22c55e]/70 whitespace-nowrap"
                  style={{ left: `${(column.id / dataColumns.length) * 100}%` }}
                  animate={{ y: ['-110%', '110%'] }}
                  transition={{
                    duration: column.duration,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: column.delay,
                  }}
                >
                  {column.stream}
                </motion.div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#22c55e]/5 to-transparent pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col">
              <header className="h-12 border-b border-[#22c55e]/30 flex items-center justify-between px-4 md:px-6 bg-[#22c55e]/10 terminal-text text-[#22c55e]">
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>882.GATE.NETWORK // NODE_HACKER_CONSOLE</span>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-[10px] md:text-xs font-bold">STATUS: {status}</p>
                  <button
                    onClick={onClose}
                    className="p-1.5 border border-[#22c55e]/50 hover:bg-[#22c55e]/20 transition-colors"
                    aria-label="Close hacker console"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </header>

              <div className="flex-1 min-h-0 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-6 text-[#22c55e] terminal-text">
                <section className="border border-[#22c55e]/30 bg-[#0a0a0a] p-4 md:p-5 flex flex-col gap-5 min-h-0">
                  <div>
                    <p className="text-[11px] opacity-90 typewriter inline-block">{typedMessage}</p>
                    <p className="text-[10px] opacity-60 mt-1">INPUT EXPECTED: {NUMBER_SEQUENCE.length} NODES</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 md:gap-4 border border-dashed border-[#22c55e]/25 p-3 md:p-4">
                    {GRID_NUMBERS.map((num) => {
                      const isSelected = selectedNumbers.includes(num);
                      const isWrong = wrongNumber === num;

                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleNumberClick(num)}
                          disabled={status === 'LOCKED' || status === 'BREACHED'}
                          className={`number-circle hacker-grid-cell-subdivide h-12 md:h-14 rounded-full border text-xs md:text-sm font-bold relative overflow-hidden ${
                            isWrong
                              ? 'wrong'
                              : isSelected
                                ? 'selected correct'
                                : 'border-[#22c55e]/40 hover:border-[#22c55e]'
                          }`}
                        >
                          {num}
                          {sparkedNum === num && (
                            <span
                              className="fx-spark absolute inset-0 pointer-events-none"
                              onAnimationEnd={() => setSparkedNum(null)}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleTypedSubmit} className="border border-[#22c55e]/25 bg-[#061006] p-3 md:p-4 space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#22c55e]/75 block">
                      Type Sequence
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sequenceInput}
                        onChange={(event) => {
                          setSequenceInput(event.target.value);
                          if (typedValidationState !== 'IDLE') {
                            setTypedValidationState('IDLE');
                            setTypedValidationMessage('');
                          }
                        }}
                        disabled={status === 'LOCKED' || status === 'BREACHED'}
                        placeholder={inputPlaceholder}
                        className="flex-1 bg-black border border-[#22c55e]/30 px-3 py-2 text-xs md:text-sm font-mono text-[#22c55e] focus:outline-none focus:border-[#22c55e] placeholder:text-[#22c55e]/40"
                      />
                      <button
                        type="submit"
                        disabled={status === 'LOCKED' || status === 'BREACHED'}
                        className="px-3 md:px-4 py-2 border border-[#22c55e]/45 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-[#22c55e]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify
                      </button>
                    </div>
                    {typedValidationState !== 'IDLE' ? (
                      <p
                        className={`text-[10px] md:text-xs ${
                          typedValidationState === 'VALID' ? 'text-[#22c55e]' : 'text-red-400'
                        }`}
                      >
                        {typedValidationMessage}
                      </p>
                    ) : null}
                  </form>

                  <div className={`${integrityError ? 'violent-glitch' : ''}`}>
                    <div className="flex items-center justify-between text-[10px] mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>SYSTEM_INTEGRITY</span>
                      </div>
                      <span>{integrity}%</span>
                    </div>
                    <div className="h-2.5 border border-[#22c55e]/35 bg-[#031005] overflow-hidden px-1 py-[2px] grid grid-cols-10 gap-1">
                      {Array.from({ length: 10 }, (_, index) => {
                        const isActive = index < Math.round(integrity / 10);
                        return (
                          <motion.span
                            key={`integrity-segment-${index}`}
                            className={`integrity-segment ${integrityError ? 'error' : isActive ? 'active' : ''}`}
                            initial={false}
                            animate={{ opacity: isActive ? 1 : 0.65, scaleY: isActive ? 1 : 0.92 }}
                            transition={{ duration: 0.16 }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-1">
                    {!hintRevealed ? (
                      <button
                        type="button"
                        onClick={() => setHintRevealed(true)}
                        className="text-[10px] uppercase tracking-[0.18em] text-[#22c55e]/25 hover:text-amber-400/80 border border-[#22c55e]/12 hover:border-amber-500/40 px-3 py-1.5 transition-all w-full"
                      >
                        ⚠ Request Classified Intel
                      </button>
                    ) : (
                      <p className="text-[10px] text-amber-400/70 font-mono tracking-widest text-center py-1">
                        ▶ SEQUENCE_KEY TRANSMITTED TO LOG
                      </p>
                    )}
                  </div>
                </section>

                <section className="border border-[#22c55e]/30 bg-[#050505] p-4 md:p-5 flex flex-col min-h-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#22c55e]/80 mb-3">Log_Dump</p>

                  <div ref={logDumpRef} className="flex-1 overflow-y-auto text-[11px] space-y-1 leading-relaxed pr-1">
                    {logLines.map((line, index) => (
                      <motion.p
                        key={`${line}-${index}`}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className={line.startsWith('>>') ? 'text-[#22c55e] font-bold tracking-widest' : ''}
                      >
                        {line}
                      </motion.p>
                    ))}
                  </div>

                  <footer className="pt-4 mt-4 border-t border-[#22c55e]/20 flex items-center justify-between text-[10px] text-[#22c55e]/70">
                    <span>SESSION: {sessionId}</span>
                    <span>882.GATE.NETWORK</span>
                  </footer>
                </section>
              </div>
            </div>

            {/* ET IN ARCADIA EGO breach overlay */}
            <AnimatePresence>
              {egoVisible && (
                <motion.div
                  key="ego-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm"
                >
                  <div className="scanline pointer-events-none" />

                  <motion.p
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-[10px] uppercase tracking-[0.55em] text-[#22c55e]/50 mb-10 font-mono"
                  >
                    ◈ &nbsp; TRANSMISSION RECEIVED &nbsp; ◈
                  </motion.p>

                  <motion.h2
                    initial={{ opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    className="breach-glow-text font-mono text-center px-6 terminal-text"
                    style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.8rem)', letterSpacing: '0.14em' }}
                  >
                    ET IN ARCADIA EGO
                  </motion.h2>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.0, duration: 0.7, ease: 'easeOut' }}
                    className="h-px w-64 my-10 bg-gradient-to-r from-transparent via-[#22c55e]/55 to-transparent"
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.25, duration: 0.5 }}
                    className="text-center space-y-3"
                  >
                    <p className="text-[11px] font-mono text-[#22c55e]/70 tracking-[0.32em] uppercase">
                      Access Granted &nbsp;//&nbsp; Payload Unlocked
                    </p>
                    <p className="text-[9px] font-mono text-[#22c55e]/30 tracking-[0.25em] uppercase">
                      Session: {sessionId}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
