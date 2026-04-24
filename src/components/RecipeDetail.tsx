import { motion } from 'motion/react';
import { ChevronLeft, Clock, Users, Flame, Utensils, Award, Lock } from 'lucide-react';
import { Recipe } from '../types';
import { NUMBER_SEQUENCE } from '../config/constants';

const CIPHER_SET = new Set(NUMBER_SEQUENCE);

function IngredientText({ ing, isSecret }: { ing: string; isSecret: boolean }) {
  if (!isSecret) {
    return <span className="text-slate-700 leading-relaxed font-medium">{ing}</span>;
  }

  const match = ing.match(/^(\d+)/);
  const num = match ? parseInt(match[1], 10) : null;

  if (num === null || !CIPHER_SET.has(num)) {
    return <span className="text-slate-700 leading-relaxed font-medium">{ing}</span>;
  }

  const spaceIdx = ing.indexOf(' ');
  const quantity = ing.slice(0, spaceIdx);
  const rest = ing.slice(spaceIdx);

  return (
    <span className="leading-relaxed font-medium">
      <span className="text-emerald-500 font-bold cipher-pulse">{quantity}</span>
      <span className="text-slate-700">{rest}</span>
    </span>
  );
}

export function RecipeDetail({
  recipe,
  onBack,
  showCipherClue = false,
  onInitiateDecryption,
}: {
  recipe: Recipe;
  onBack: () => void;
  showCipherClue?: boolean;
  onInitiateDecryption?: () => void;
}) {
  const isSecret = recipe.id === 'obsidian_cipher_torte';

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="w-full pb-16">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors mb-6 text-xs font-bold uppercase tracking-widest pl-2"
      >
        <ChevronLeft className="w-4 h-4" /> Return to Archives
      </button>

      <div className="w-full h-[350px] md:h-[500px] rounded-[2rem] overflow-hidden relative mb-12 shadow-2xl">
        <img src={recipe.image} className="w-full h-full object-cover" alt={recipe.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/90 via-[#111827]/30 to-transparent flex flex-col justify-end p-8 md:p-16">
          <motion.span initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: 0.2}} className="text-emerald-400 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-4">
            {recipe.category}
          </motion.span>
          <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="text-5xl md:text-7xl font-serif text-white font-bold tracking-tighter leading-tight max-w-4xl">
            {recipe.title}
          </motion.h1>
          <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.4}} className="text-slate-300 mt-4 max-w-3xl text-lg md:text-xl font-serif italic">
            "{recipe.description}"
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center gap-2 group hover:border-emerald-200 transition-colors">
          <Clock className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Preparation</p>
            <p className="text-lg font-serif text-slate-800">{recipe.prepTime}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center gap-2 group hover:border-emerald-200 transition-colors">
          <Flame className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cooking</p>
            <p className="text-lg font-serif text-slate-800">{recipe.cookTime}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center gap-2 group hover:border-emerald-200 transition-colors">
          <Users className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Yield</p>
            <p className="text-lg font-serif text-slate-800">{recipe.servings} Servings</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center gap-2 group hover:border-emerald-200 transition-colors">
          <Award className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Difficulty</p>
            <p className="text-lg font-serif text-slate-800">{recipe.difficulty}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4">
          <div className="sticky top-12 bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100/50">
            <h3 className="text-2xl font-serif font-bold text-slate-900 mb-8 flex items-center gap-3">
              <Utensils className="w-5 h-5 text-emerald-600" />
              Ingredients
            </h3>
            <ul className="space-y-4">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex gap-4 border-b border-emerald-900/5 pb-4 last:border-0 last:pb-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                  <IngredientText ing={ing} isSecret={isSecret} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8">
          <h3 className="text-3xl font-serif font-bold text-slate-900 mb-10 tracking-tight">The Alchemical Process</h3>
          <div className="space-y-12">
            {recipe.steps.map((step, idx) => (
              <div key={idx} className="flex gap-6 md:gap-8 group">
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-200 bg-white flex items-center justify-center text-emerald-700 font-serif font-bold text-xl group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                    {idx + 1}
                  </div>
                  {idx !== recipe.steps.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-200 mt-4 group-hover:bg-emerald-200 transition-colors"></div>
                  )}
                </div>
                <div className="pb-4 pt-2">
                  <p className="text-slate-700 text-lg md:text-xl leading-relaxed font-serif">{step}</p>
                </div>
              </div>
            ))}
          </div>

          {showCipherClue && onInitiateDecryption ? (
            <div className="mt-16 p-8 bg-[#060d06] border border-emerald-900/60 rounded-3xl text-center space-y-5">
              <div className="flex justify-center mb-2">
                <Lock className="w-5 h-5 text-emerald-500/60" />
              </div>
              <p className="text-emerald-500/60 font-mono text-[10px] uppercase tracking-[0.25em]">Cipher Fragments</p>
              <h4 className="text-xl font-serif text-emerald-200/80 italic">
                The archive answers only to aligned fragments. Continue the rite in the console.
              </h4>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
                <span className="w-2 h-2 rounded-full bg-emerald-400/45" />
                <span className="w-2 h-2 rounded-full bg-emerald-400/30" />
              </div>
              <button
                onClick={onInitiateDecryption}
                className="mt-2 px-8 py-3 bg-emerald-950 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] font-mono"
              >
                Initiate Decryption
              </button>
            </div>
          ) : (
            <div className="mt-16 p-8 bg-slate-900 rounded-3xl text-center space-y-4">
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Transmission Complete</p>
              <h4 className="text-2xl font-serif text-white italic">"Patience is the truest catalyst of any great working."</h4>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
