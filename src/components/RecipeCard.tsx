import { motion } from 'motion/react';
import { Utensils } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  isFeatured: boolean;
  onClick: () => void;
  isHidden?: boolean;
  orbActive?: boolean;
  energyPaused?: boolean;
  onHiddenHoverChange?: (hovering: boolean) => void;
  onCardHoverChange?: (hovering: boolean) => void;
}

export function RecipeCard({
  recipe,
  isFeatured,
  onClick,
  isHidden = false,
  orbActive = false,
  energyPaused = false,
  onHiddenHoverChange,
  onCardHoverChange,
}: RecipeCardProps) {
  if (isFeatured) {
    return (
      <motion.div
        layoutId={`card-${recipe.id}`}
        onClick={onClick}
        onMouseEnter={() => onCardHoverChange?.(true)}
        onMouseLeave={() => onCardHoverChange?.(false)}
        className="h-full bento-card p-7 md:p-10 lg:p-12 flex flex-col justify-end relative overflow-hidden group cursor-pointer border-emerald-500/25 bg-[#0b1111] hover:border-emerald-300/60 transition-all hover:shadow-[0_24px_70px_rgb(0,0,0,0.28)] hover:-translate-y-1"
      >
        <div className={`recipe-orb ${orbActive ? 'recipe-orb-active' : ''}`}>
          <Utensils className="w-4 h-4" />
        </div>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={recipe.image} className="w-full h-full object-cover opacity-88 transition-all duration-700 group-hover:scale-105" alt="" />
          <div className="absolute inset-0 bg-[#020706]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(100%_140%_at_80%_10%,rgba(16,185,129,0.14),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020705]/92 via-[#05110d]/70 to-[#020705]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010302]/72 via-transparent to-[#010302]/20" />
        </div>
        <div className="relative z-10 w-full max-w-[min(70%,560px)]">
          <span className="bg-emerald-500/18 text-emerald-100 text-[10px] font-bold px-3 py-1.5 rounded-full mb-5 inline-block tracking-[0.2em] border border-emerald-200/35">
            FEATURED ARCHIVE
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-[0.94] tracking-tighter mb-4 text-white drop-shadow-[0_3px_16px_rgba(0,0,0,0.65)]">
            {recipe.title}
          </h2>
          <p className="text-slate-100/90 font-medium leading-relaxed mb-2 line-clamp-3 md:line-clamp-4 text-base md:text-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
            {recipe.description}
          </p>
        </div>
      </motion.div>
    );
  }

  // Secret card: outer wrapper provides the beam border, inner card is normal
  if (isHidden) {
    return (
      <div
        className={`h-full p-[2px] rounded-[2rem] relative overflow-hidden secret-beam-outer ${
          energyPaused ? 'energy-paused' : ''
        }`}
        onMouseEnter={() => {
          onHiddenHoverChange?.(true);
          onCardHoverChange?.(true);
        }}
        onMouseLeave={() => {
          onHiddenHoverChange?.(false);
          onCardHoverChange?.(false);
        }}
        onFocus={() => {
          onHiddenHoverChange?.(true);
          onCardHoverChange?.(true);
        }}
        onBlur={() => {
          onHiddenHoverChange?.(false);
          onCardHoverChange?.(false);
        }}
      >
        {/* Rotating conic-gradient beam */}
        <div className="beam-ring" />
        <div className="beam-aura" />
        <div className="corner-pulse corner-pulse-tl" />
        <div className="corner-pulse corner-pulse-tr" />
        <div className="corner-pulse corner-pulse-br" />
        <div className="corner-pulse corner-pulse-bl" />
        {/* Normal card content, inset by the 2px padding */}
        <motion.div
          layoutId={`card-${recipe.id}`}
          onClick={onClick}
          className="relative h-full rounded-[calc(2rem-2px)] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col group cursor-pointer transition-all overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)]"
        >
          <div className="relative z-10 flex flex-col h-full p-2 -m-2 rounded-2xl transition-all bg-white/60 backdrop-blur-[2px] group-hover:bg-transparent group-hover:backdrop-blur-none">
            <div className="flex justify-between items-start mb-5">
              <h3 className="text-2xl font-serif font-bold tracking-tight pr-4 transition-colors leading-[1.1] group-hover:text-emerald-800">
                {recipe.title}
              </h3>
              <div className={`recipe-orb recipe-orb-inline ${orbActive ? 'recipe-orb-active' : ''}`}>
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <p className="text-sm mb-6 leading-relaxed flex-grow line-clamp-3 text-slate-500">
              {recipe.description}
            </p>
            <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100/80">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{recipe.category}</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded border text-emerald-700 bg-emerald-50 border-emerald-100">
                {recipe.prepTime}
              </span>
            </div>
          </div>
          <img
            src={recipe.image}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0 group-hover:opacity-[0.08] grayscale mix-blend-multiply"
            alt=""
          />
        </motion.div>
      </div>
    );
  }

  // Normal card
  return (
    <motion.div
      layoutId={`card-${recipe.id}`}
      onClick={onClick}
      onMouseEnter={() => onCardHoverChange?.(true)}
      onMouseLeave={() => onCardHoverChange?.(false)}
      className="h-full bento-card p-6 md:p-7 flex flex-col group cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden hover:border-emerald-200 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)]"
    >
      <div className="relative z-10 flex flex-col h-full p-2 -m-2 rounded-2xl transition-all bg-white/60 backdrop-blur-[2px] group-hover:bg-transparent group-hover:backdrop-blur-none">
        <div className="flex justify-between items-start mb-5">
          <h3 className="text-2xl font-serif font-bold tracking-tight pr-4 transition-colors leading-[1.1] group-hover:text-emerald-800">
            {recipe.title}
          </h3>
          <div className={`recipe-orb recipe-orb-inline ${orbActive ? 'recipe-orb-active' : ''}`}>
            <Utensils className="w-4 h-4" />
          </div>
        </div>
        <p className="text-sm mb-6 leading-relaxed flex-grow line-clamp-3 text-slate-500">
          {recipe.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100/80">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{recipe.category}</span>
          <span className="text-[10px] font-mono px-2 py-1 rounded border text-emerald-700 bg-emerald-50 border-emerald-100">
            {recipe.prepTime}
          </span>
        </div>
      </div>
      <img
        src={recipe.image}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0 group-hover:opacity-[0.08] grayscale mix-blend-multiply"
        alt=""
      />
    </motion.div>
  );
}
