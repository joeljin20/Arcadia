import { motion } from 'motion/react';
import { Utensils } from 'lucide-react';
import { Recipe } from '../types';

export function RecipeCard({ recipe, isFeatured, onClick }: { recipe: Recipe; isFeatured: boolean; onClick: () => void }) {
  if (isFeatured) {
    return (
      <div 
        onClick={onClick}
        className="col-span-1 md:col-span-2 xl:col-span-2 row-span-2 bento-card p-10 flex flex-col justify-between relative overflow-hidden group min-h-[400px] cursor-pointer hover:border-emerald-300 transition-all hover:shadow-xl hover:-translate-y-1"
      >
        <div className="relative z-10 w-full md:w-3/5">
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full mb-6 inline-block tracking-widest">FEATURED RECORD</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold leading-[1.0] tracking-tighter mb-4 group-hover:text-emerald-900 transition-colors">{recipe.title}</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3">{recipe.description}</p>
        </div>
        <div className="absolute right-0 top-0 w-full md:w-1/2 h-full z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent md:bg-gradient-to-r md:from-[#FAF7F2] md:via-[#FAF7F2]/40 md:to-transparent z-10"></div>
          <img src={recipe.image} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-700 pointer-events-none group-hover:scale-105" alt=""/>
        </div>
      </div>
    );
  }
  return (
    <div 
      onClick={onClick}
      className="col-span-1 bento-card p-6 flex flex-col group min-h-[280px] cursor-pointer hover:border-emerald-200 transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden"
    >
      <div className="relative z-10 flex flex-col h-full">
         <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-serif font-bold tracking-tight pr-4 group-hover:text-emerald-800 transition-colors">{recipe.title}</h3>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:rotate-45 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-all text-slate-400 shadow-sm z-10">
               <Utensils className="w-4 h-4" />
            </div>
         </div>
         <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow line-clamp-3">{recipe.description}</p>
         
         <div className="mt-auto flex items-center gap-4 pt-4 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{recipe.category}</span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{recipe.prepTime}</span>
         </div>
      </div>
      <img src={recipe.image} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-5 transition-opacity duration-700 grayscale" alt="" />
    </div>
  );
}
