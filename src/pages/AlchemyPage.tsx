import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';
import { PRD_RECIPES, SECRET_PHRASE } from '../config/constants';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeDetail } from '../components/RecipeDetail';
import { Recipe } from '../types';

export function AlchemyPage({ onTriggerArcadia }: { onTriggerArcadia: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All Archives");

  const categories = ["All Archives", ...Array.from(new Set(PRD_RECIPES.map(r => r.category)))];

  const filteredRecipes = useMemo(() => {
    return PRD_RECIPES.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All Archives" || recipe.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (selectedRecipe) {
        setSelectedRecipe(null); // Return to grid organically on searching
    }
    if (value.toLowerCase().trim() === SECRET_PHRASE) {
      setSearchQuery("");
      onTriggerArcadia();
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col space-y-8">
      {/* Global Search Bar */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search the archives, ingredients, or hidden truths..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-full py-4 pl-16 pr-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-serif italic placeholder:not-italic placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm transition-all"
        />
      </div>

      <AnimatePresence mode="wait">
        {selectedRecipe && !searchQuery ? (
          <RecipeDetail 
             key="detail" 
             recipe={selectedRecipe} 
             onBack={() => setSelectedRecipe(null)} 
          />
        ) : (
          <motion.div key="grid" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8">
             {/* Categories Filter */}
             <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                   <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700 shadow-sm'}`}
                   >
                     {cat}
                   </button>
                ))}
             </div>

             {/* Grid */}
             {filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full min-h-[600px]">
                  {filteredRecipes.map((recipe, index) => (
                    <RecipeCard 
                       key={recipe.id} 
                       recipe={recipe} 
                       isFeatured={index === 0 && searchQuery === "" && activeCategory === "All Archives"} 
                       onClick={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </div>
             ) : (
               <div className="h-[400px] flex items-center justify-center">
                  <p className="text-xl font-serif text-slate-400 italic">The archives hold no record of your inquiry...</p>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
