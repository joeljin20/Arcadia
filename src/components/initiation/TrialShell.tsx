import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface TrialShellProps {
  title: string;
  subtitle: string;
  step: 1 | 2 | 3;
  onClose: () => void;
  onOverride: () => void;
  children: ReactNode;
  backgroundImage?: string;
  /** CSS gradient used as the base background layer */
  backgroundGradient?: string;
  stageLabel?: string;
  /** CSS object-position for the background image, e.g. "center 30%" */
  imageObjectPosition?: string;
}

export function TrialShell({
  title,
  subtitle,
  step,
  onClose,
  onOverride,
  children,
  backgroundImage,
  backgroundGradient,
  stageLabel,
  imageObjectPosition = 'center center',
}: TrialShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
    >
      {/* Background layer — stacking order: gradient base → photo → dark overlay → scanlines */}
      <div className="fixed inset-0 -z-0">
        {/* 1. Colour base */}
        <div
          className="absolute inset-0"
          style={{ background: backgroundGradient ?? 'linear-gradient(160deg,#070d14 0%,#050a0f 100%)' }}
        />
        {/* 2. Photo — visible enough to establish setting, dark enough for text */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: 0.52,
              objectPosition: imageObjectPosition,
              filter: 'saturate(0.82) brightness(1.02) contrast(1.02)',
              transition: 'opacity 0.6s ease',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
            alt=""
          />
        )}
        {/* 3. Veil: preserve readability while allowing more scene detail through */}
        <div className="absolute inset-0 bg-black/20" />
        {/* 4. Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)',
          }}
        />
      </div>

      <button
        onClick={onClose}
        className="fixed top-8 right-8 p-3 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full z-20 transition-colors border border-white/5"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center gap-8 py-14 px-6">
        {/* Step progress */}
        <div className="flex items-center gap-2">
          {([1, 2, 3] as const).map(n => (
            <div
              key={n}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                n < step
                  ? 'w-10 bg-emerald-500'
                  : n === step
                  ? 'w-14 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                  : 'w-10 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <div className="text-center space-y-2.5">
          {stageLabel ? (
            <p className="text-[10px] font-mono uppercase tracking-[0.45em] text-emerald-500 border border-emerald-900/40 bg-emerald-950/25 inline-block px-4 py-1.5">
              {stageLabel}
            </p>
          ) : (
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-emerald-600">
              Trial {step} of 3
            </p>
          )}
          <h2 className="text-3xl md:text-4xl font-serif italic text-white">{title}</h2>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
        </div>

        {children}

        <button
          onClick={onOverride}
          className="text-emerald-500/25 hover:text-emerald-400 font-mono uppercase tracking-[0.2em] text-[10px] transition-colors border border-transparent hover:border-emerald-500/20 px-6 py-2 rounded-full mt-2"
        >
          [DEV] Override Trial
        </button>
      </div>
    </motion.div>
  );
}
