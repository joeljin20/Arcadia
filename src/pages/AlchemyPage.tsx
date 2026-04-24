import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Volume2, VolumeX } from 'lucide-react';
import { PRD_RECIPES, SECRET_PHRASE, SECRET_RECIPE } from '../config/constants';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeDetail } from '../components/RecipeDetail';
import { HackerConsoleOverlay } from '../components/HackerConsoleOverlay';
import type { Recipe, UnlockStage } from '../types';
import { playArcaneShimmer } from '../services/audio';

type BubbleSlot = { x: number; y: number; width: number; height: number; featured: boolean };
type VaultView = 'DEFAULT' | 'UNLOCKED';
type BubbleMetrics = {
  columns: number;
  cardHeight: number;
  gap: number;
  padding: number;
  maxFieldHeight: number;
};

function getViewportFallbackWidth(): number {
  if (typeof window === 'undefined') {
    return 1200;
  }
  return Math.max(320, Math.min(window.innerWidth - 96, 1920));
}

function getBubbleMetrics(containerWidth: number): BubbleMetrics {
  if (containerWidth < 700) {
    return { columns: 1, cardHeight: 210, gap: 14, padding: 10, maxFieldHeight: 900 };
  }
  if (containerWidth < 980) {
    return { columns: 2, cardHeight: 212, gap: 16, padding: 12, maxFieldHeight: 940 };
  }
  if (containerWidth < 1380) {
    return { columns: 3, cardHeight: 180, gap: 18, padding: 14, maxFieldHeight: 1000 };
  }
  return { columns: 4, cardHeight: 228, gap: 18, padding: 16, maxFieldHeight: 1040 };
}

function computeCleanSlots(
  containerWidth: number,
  maxFieldHeight: number,
  columns: number,
  cardHeight: number,
  gap: number,
  padding: number
): { slots: BubbleSlot[]; fieldHeight: number } {
  const safeColumns = Math.max(1, columns);
  const innerWidth = Math.max(280, containerWidth - padding * 2);
  const cardWidth = Math.floor((innerWidth - (safeColumns - 1) * gap) / safeColumns);
  const maxRows = Math.max(2, Math.floor((maxFieldHeight - padding * 2 + gap) / (cardHeight + gap)));
  const featuredSpanCols = safeColumns >= 2 ? 2 : 1;
  const featuredSpanRows = safeColumns >= 3 ? 2 : safeColumns === 1 ? 2 : 1;
  const featuredCellCount = featuredSpanCols * featuredSpanRows;

  const preferredRows = safeColumns >= 4 ? 4 : safeColumns === 3 ? 4 : safeColumns === 2 ? 5 : 10;
  const minRowsForTen = Math.ceil((10 + featuredCellCount - 1) / safeColumns);
  const minRows = featuredSpanRows + 1;
  let rows = Math.min(maxRows, Math.max(minRows, preferredRows));
  if (maxRows >= minRowsForTen) {
    rows = Math.max(rows, minRowsForTen);
  }

  const getSmallRowCount = (row: number) => {
    if (row < featuredSpanRows) {
      return Math.max(0, safeColumns - featuredSpanCols);
    }
    return safeColumns;
  };

  while (rows > featuredSpanRows + 1 && getSmallRowCount(rows - 1) === 1) {
    rows -= 1;
  }

  const totalCells = safeColumns * rows;
  const capacity = totalCells - featuredCellCount + 1;
  const requiredMin = maxRows >= minRowsForTen ? 10 : Math.max(1, capacity);
  while (rows > minRows) {
    const nextCapacity = safeColumns * (rows - 1) - featuredCellCount + 1;
    if (nextCapacity < requiredMin) {
      break;
    }
    if (getSmallRowCount(rows - 2) === 1) {
      break;
    }
    rows -= 1;
  }

  const occupied = new Set<string>();
  for (let row = 0; row < featuredSpanRows; row += 1) {
    for (let col = 0; col < featuredSpanCols; col += 1) {
      occupied.add(`${row}-${col}`);
    }
  }

  const featuredSlot: BubbleSlot = {
    x: padding,
    y: padding,
    width: featuredSpanCols * cardWidth + (featuredSpanCols - 1) * gap,
    height: featuredSpanRows * cardHeight + (featuredSpanRows - 1) * gap,
    featured: true,
  };

  const smallSlots: BubbleSlot[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < safeColumns; col += 1) {
      if (occupied.has(`${row}-${col}`)) {
        continue;
      }
      smallSlots.push({
        x: padding + col * (cardWidth + gap),
        y: padding + row * (cardHeight + gap),
        width: cardWidth,
        height: cardHeight,
        featured: false,
      });
    }
  }

  const slots = [featuredSlot, ...smallSlots];
  const usedHeight = rows * cardHeight + (rows - 1) * gap + padding * 2;
  return { slots, fieldHeight: usedHeight };
}

function createPermutation(previous: number[]): number[] {
  const n = previous.length;
  if (n <= 1) {
    return [...previous];
  }

  const base = Array.from({ length: n }, (_, index) => index);
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const shuffled = [...base];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const fixedPoints = shuffled.reduce((acc, value, index) => (value === previous[index] ? acc + 1 : acc), 0);
    if (fixedPoints === 0) {
      return shuffled;
    }
  }

  return base.map((_, index) => base[(index + 1) % n]);
}

export function AlchemyPage({ onTriggerArcadia, searchVisible }: { onTriggerArcadia: () => void; searchVisible: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All Archives');
  const [showHacker, setShowHacker] = useState(false);
  const [unlockStage, setUnlockStage] = useState<UnlockStage>('LOCKED_GRID_HINT');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isEnergyMuted, setIsEnergyMuted] = useState<boolean>(() => {
    const stored = localStorage.getItem('arcadia_energy_audio_muted');
    return stored ? stored === 'true' : false;
  });
  const [isSecretHovered, setIsSecretHovered] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersReducedSound, setPrefersReducedSound] = useState(false);
  const [isGridHovered, setIsGridHovered] = useState(false);
  const [bubbleContainerWidth, setBubbleContainerWidth] = useState(() => getViewportFallbackWidth());
  const [slotAssignment, setSlotAssignment] = useState<number[]>([]);
  const bubbleContainerRef = useRef<HTMLDivElement | null>(null);
  const bubbleResizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeDebounceRef = useRef<number | null>(null);
  const measureBurstTimersRef = useRef<number[]>([]);
  const bubbleWidthRef = useRef(0);
  const previousRecipeId = useRef<string | null>(null);
  const isSecretUnlocked = unlockStage === 'UNLOCKED';
  const vaultView: VaultView = isSecretUnlocked ? 'UNLOCKED' : 'DEFAULT';

  const catalog = useMemo(() => {
    const shuffled = [...PRD_RECIPES].sort(() => Math.random() - 0.5);
    const pos = Math.floor(Math.random() * shuffled.length) + 1;
    shuffled.splice(pos, 0, SECRET_RECIPE);
    return shuffled;
  }, []);

  const categories = useMemo(() => {
    const source = isSecretUnlocked ? catalog : PRD_RECIPES;
    return ['All Archives', ...Array.from(new Set(source.map((recipe) => recipe.category)))];
  }, [catalog, isSecretUnlocked]);

  const filteredRecipes = useMemo(() => {
    return catalog.filter((recipe) => {
      if (recipe.id === SECRET_RECIPE.id && !isSecretUnlocked) {
        return activeCategory === 'All Archives' && searchQuery.trim() === '';
      }

      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All Archives' || recipe.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, catalog, isSecretUnlocked, searchQuery]);

  const measureBubbleWidth = useCallback(() => {
    const node = bubbleContainerRef.current;
    if (!node) {
      setBubbleContainerWidth(getViewportFallbackWidth());
      return;
    }

    const measuredWidth = Math.round(node.getBoundingClientRect().width || node.clientWidth || 0);
    const parentWidth = Math.round(node.parentElement?.getBoundingClientRect().width || 0);
    const viewportFallback = getViewportFallbackWidth();

    if (measuredWidth <= 0) {
      setBubbleContainerWidth(parentWidth > 0 ? parentWidth : viewportFallback);
      return;
    }

    if (
      measuredWidth < 420 &&
      window.innerWidth >= 1100
    ) {
      const stabilizedWidth = Math.max(parentWidth, viewportFallback, bubbleWidthRef.current);
      setBubbleContainerWidth(stabilizedWidth);
      return;
    }
    setBubbleContainerWidth(measuredWidth);
  }, []);

  const clearMeasureBurst = useCallback(() => {
    if (measureBurstTimersRef.current.length === 0) {
      return;
    }
    measureBurstTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    measureBurstTimersRef.current = [];
  }, []);

  const scheduleMeasureBurst = useCallback(() => {
    clearMeasureBurst();
    const delays = [0, 80, 180, 320];
    measureBurstTimersRef.current = delays.map((delay) =>
      window.setTimeout(() => {
        measureBubbleWidth();
      }, delay)
    );
  }, [clearMeasureBurst, measureBubbleWidth]);

  const attachBubbleContainerRef = useCallback((node: HTMLDivElement | null) => {
    bubbleResizeObserverRef.current?.disconnect();
    bubbleContainerRef.current = node;
    clearMeasureBurst();

    if (!node) {
      return;
    }
    measureBubbleWidth();
    scheduleMeasureBurst();

    bubbleResizeObserverRef.current = new ResizeObserver(() => {
      if (resizeDebounceRef.current) {
        window.clearTimeout(resizeDebounceRef.current);
      }
      resizeDebounceRef.current = window.setTimeout(measureBubbleWidth, 120);
    });

    bubbleResizeObserverRef.current.observe(node);
  }, [clearMeasureBurst, measureBubbleWidth, scheduleMeasureBurst]);

  useEffect(() => {
    bubbleWidthRef.current = bubbleContainerWidth;
  }, [bubbleContainerWidth]);

  useEffect(() => {
    if (!selectedRecipe) {
      window.requestAnimationFrame(() => {
        measureBubbleWidth();
      });
      scheduleMeasureBurst();
    }
  }, [measureBubbleWidth, scheduleMeasureBurst, searchVisible, selectedRecipe, isSecretUnlocked]);

  useEffect(() => {
    return () => {
      bubbleResizeObserverRef.current?.disconnect();
      if (resizeDebounceRef.current) {
        window.clearTimeout(resizeDebounceRef.current);
      }
      clearMeasureBurst();
    };
  }, [clearMeasureBurst]);

  const bubbleMetrics = useMemo(() => getBubbleMetrics(Math.max(320, bubbleContainerWidth)), [bubbleContainerWidth]);
  const bubbleLayout = useMemo(
    () =>
      computeCleanSlots(
        Math.max(320, bubbleContainerWidth),
        bubbleMetrics.maxFieldHeight,
        bubbleMetrics.columns,
        bubbleMetrics.cardHeight,
        bubbleMetrics.gap,
        bubbleMetrics.padding
      ),
    [bubbleContainerWidth, bubbleMetrics]
  );
  const bubbleSlots = bubbleLayout.slots;
  const activeBubbleSlots = bubbleSlots;
  const featuredSpan = useMemo(() => {
    const columns = bubbleMetrics.columns;
    return {
      cols: columns >= 2 ? 2 : 1,
      rows: columns >= 3 ? 2 : columns === 1 ? 2 : 1,
    };
  }, [bubbleMetrics.columns]);
  const activeFieldHeight = useMemo(() => {
    if (!activeBubbleSlots || activeBubbleSlots.length === 0) {
      return bubbleLayout.fieldHeight;
    }
    const maxBottom = activeBubbleSlots.reduce((max, slot) => Math.max(max, slot.y + slot.height), 0);
    return Math.max(bubbleLayout.fieldHeight, maxBottom + bubbleMetrics.padding);
  }, [activeBubbleSlots, bubbleLayout.fieldHeight, bubbleMetrics.padding]);

  const displayRecipes = useMemo(() => {
    if (activeBubbleSlots.length === 0) {
      return [];
    }

    const secretRecipeFromCatalog = catalog.find((recipe) => recipe.id === SECRET_RECIPE.id) ?? SECRET_RECIPE;
    const layoutRecipeSource = filteredRecipes.length > 0 ? filteredRecipes : catalog;
    const visibleUnique = layoutRecipeSource.filter(
      (recipe, index, array) => array.findIndex((candidate) => candidate.id === recipe.id) === index
    );
    if (visibleUnique.length === 0) {
      return [];
    }

    const featuredFromVisible =
      visibleUnique.find((recipe) => recipe.id !== SECRET_RECIPE.id) ??
      catalog.find((recipe) => recipe.id !== SECRET_RECIPE.id) ??
      secretRecipeFromCatalog;

    const nonFeaturedPool = [...visibleUnique, ...catalog]
      .filter((recipe, index, array) => array.findIndex((candidate) => candidate.id === recipe.id) === index)
      .filter((recipe) => recipe.id !== featuredFromVisible.id);

    if (nonFeaturedPool.length === 0) {
      return [{ recipe: featuredFromVisible, instanceKey: `${featuredFromVisible.id}-0` }];
    }

    const targetCount = activeBubbleSlots.length;
    const filled = Array.from({ length: targetCount }, (_, index) => {
      if (index === 0) {
        return {
          recipe: featuredFromVisible,
          instanceKey: `${featuredFromVisible.id}-0`,
        };
      }

      const offset = index - 1;
      const recipe = nonFeaturedPool[offset % nonFeaturedPool.length];
      const instance = Math.floor(offset / nonFeaturedPool.length);
      return {
        recipe,
        instanceKey: `${recipe.id}-${instance}`,
      };
    });

    const secretCount = filled.filter(({ recipe }) => recipe.id === SECRET_RECIPE.id).length;
    if (secretCount === 0) {
      const replaceIndex = Math.max(1, filled.length - 1);
      filled[replaceIndex] = {
        recipe: secretRecipeFromCatalog,
        instanceKey: `${secretRecipeFromCatalog.id}-0`,
      };
    } else if (secretCount > 1) {
      let secretSeen = false;
      let poolCursor = 0;
      for (let index = 0; index < filled.length; index += 1) {
        const current = filled[index];
        if (current.recipe.id !== SECRET_RECIPE.id) {
          continue;
        }
        if (!secretSeen) {
          secretSeen = true;
          continue;
        }
        while (poolCursor < nonFeaturedPool.length && nonFeaturedPool[poolCursor].id === SECRET_RECIPE.id) {
          poolCursor += 1;
        }
        const replacement = nonFeaturedPool[poolCursor % nonFeaturedPool.length];
        filled[index] = {
          recipe: replacement,
          instanceKey: `${replacement.id}-dedupe-${index}`,
        };
        poolCursor += 1;
      }
    }

    return filled;
  }, [activeBubbleSlots.length, catalog, filteredRecipes]);

  useEffect(() => {
    if (displayRecipes.length === 0) {
      setSlotAssignment([]);
      return;
    }
    setSlotAssignment(Array.from({ length: displayRecipes.length }, (_, index) => index));
  }, [displayRecipes.length]);

  const normalizedSlotAssignment = useMemo(() => {
    if (displayRecipes.length === 0) {
      return [];
    }
    if (slotAssignment.length !== displayRecipes.length) {
      return Array.from({ length: displayRecipes.length }, (_, index) => index);
    }
    const isValid = slotAssignment.every((slotIndex) => slotIndex >= 0 && slotIndex < displayRecipes.length);
    const isUnique = new Set(slotAssignment).size === slotAssignment.length;
    if (!isValid || !isUnique) {
      return Array.from({ length: displayRecipes.length }, (_, index) => index);
    }
    return slotAssignment;
  }, [displayRecipes.length, slotAssignment]);

  const recipeBySlot = useMemo(() => {
    const slotCount = activeBubbleSlots.length;
    if (slotCount === 0 || displayRecipes.length === 0) {
      return [];
    }

    const mapped: Array<(typeof displayRecipes)[number] | null> = Array.from({ length: slotCount }, () => null);
    displayRecipes.forEach((entry, recipeIndex) => {
      const assignedSlot = normalizedSlotAssignment[recipeIndex] ?? recipeIndex;
      if (assignedSlot >= 0 && assignedSlot < slotCount) {
        mapped[assignedSlot] = entry;
      }
    });

    return mapped.map((entry, slotIndex) => entry ?? displayRecipes[slotIndex % displayRecipes.length]);
  }, [activeBubbleSlots.length, displayRecipes, normalizedSlotAssignment]);

  useEffect(() => {
    if (displayRecipes.length < 2 || prefersReducedMotion || selectedRecipe) {
      return;
    }

    const interval = window.setInterval(() => {
      setSlotAssignment((previous) => {
        if (previous.length < 2) {
          return previous;
        }
        return createPermutation(previous);
      });
    }, 10000);

    return () => window.clearInterval(interval);
  }, [displayRecipes.length, prefersReducedMotion, selectedRecipe]);

  const secretCardVisible =
    !selectedRecipe &&
    !isSecretUnlocked &&
    displayRecipes.some(({ recipe }) => recipe.id === SECRET_RECIPE.id);
  const sweepAudioAllowed = hasInteracted && !isEnergyMuted;
  const orbRotationPaused = !isPageVisible || isGridHovered || prefersReducedMotion;

  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('arcadia_energy_audio_muted', String(isEnergyMuted));
  }, [isEnergyMuted]);

  useEffect(() => {
    const onVisibilityChange = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setPrefersReducedMotion(reducedMotionQuery.matches);
    updateMotionPreference();
    reducedMotionQuery.addEventListener('change', updateMotionPreference);

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveDataEnabled = Boolean(connection?.saveData);
    setPrefersReducedSound(saveDataEnabled || reducedMotionQuery.matches);

    return () => {
      reducedMotionQuery.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (!sweepAudioAllowed) {
      return;
    }

    if (!secretCardVisible || !isPageVisible || isSecretHovered) {
      return;
    }

    const intervalMs = prefersReducedMotion ? 5600 : 2800;
    const volume = prefersReducedSound ? 0.06 : 0.14;

    const interval = window.setInterval(() => {
      playArcaneShimmer({ volume, duration: prefersReducedMotion ? 0.28 : 0.42 });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [
    isPageVisible,
    isSecretHovered,
    prefersReducedMotion,
    prefersReducedSound,
    secretCardVisible,
    sweepAudioAllowed,
  ]);

  useEffect(() => {
    const recipeId = selectedRecipe?.id ?? null;
    const recipeChanged = previousRecipeId.current !== recipeId;
    previousRecipeId.current = recipeId;

    if (!recipeChanged || !recipeId || !sweepAudioAllowed) {
      return;
    }

    playArcaneShimmer({ volume: prefersReducedSound ? 0.05 : 0.12, duration: 0.34 });
  }, [prefersReducedSound, selectedRecipe, sweepAudioAllowed]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (selectedRecipe) {
      setSelectedRecipe(null);
    }

    if (value.toLowerCase().trim() === SECRET_PHRASE) {
      setSearchQuery('');
      if (!isSecretUnlocked) {
        setSelectedRecipe(SECRET_RECIPE);
        setActiveCategory('All Archives');
        setUnlockStage('DETAIL_CLUE');
        return;
      }
      onTriggerArcadia();
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    if (recipe.id === SECRET_RECIPE.id && !isSecretUnlocked) {
      setUnlockStage('DETAIL_CLUE');
    }
    setSelectedRecipe(recipe);
  };

  const handleInitiateDecryption = () => {
    setUnlockStage('CONSOLE_CHALLENGE');
    setShowHacker(true);
  };

  const handleBreachComplete = () => {
    setUnlockStage('UNLOCKED');
    setShowHacker(false);
    setSearchQuery('');
    setActiveCategory('All Archives');
    setSelectedRecipe(null);
    window.requestAnimationFrame(() => {
      measureBubbleWidth();
    });
    scheduleMeasureBurst();
  };

  const handleDetailBack = () => {
    if (selectedRecipe?.id === SECRET_RECIPE.id && !isSecretUnlocked) {
      setUnlockStage('LOCKED_GRID_HINT');
    }
    setSelectedRecipe(null);
  };

  const renderVaultRecipes = () => (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setIsEnergyMuted((prev) => !prev)}
          className={`px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] transition-all border flex items-center gap-1.5 ${
            isEnergyMuted
              ? 'bg-white/80 text-slate-500 border-slate-200/70 hover:text-emerald-700 hover:border-emerald-300'
              : 'bg-emerald-900 text-white border-emerald-900 shadow-emerald-900/20'
          }`}
          aria-pressed={!isEnergyMuted}
          title={prefersReducedSound ? 'Reduced-sound mode is active' : 'Toggle energy ring sound'}
        >
          {isEnergyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {isEnergyMuted ? 'Energy Sound Off' : 'Energy Sound On'}
        </button>
        {categories.map((cat, index) => (
          <motion.button
            key={cat}
            layout
            onClick={() => setActiveCategory(cat)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.025 }}
            className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all shadow-sm ${
              activeCategory === cat
                ? 'bg-emerald-900 text-white shadow-emerald-900/20'
                : 'bg-white/80 backdrop-blur-md border border-slate-200/60 text-slate-500 hover:border-emerald-300 hover:text-emerald-800'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {displayRecipes.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          ref={attachBubbleContainerRef}
          style={{
            minHeight: `${activeFieldHeight}px`,
            gridTemplateColumns: `repeat(${bubbleMetrics.columns}, minmax(0, 1fr))`,
            gridAutoRows: `${bubbleMetrics.cardHeight}px`,
            gap: `${bubbleMetrics.gap}px`,
            padding: `${bubbleMetrics.padding}px`,
          }}
          key={`${bubbleMetrics.columns}-${bubbleMetrics.cardHeight}-${bubbleMetrics.gap}-${bubbleMetrics.padding}-${activeCategory}-${searchQuery.trim().toLowerCase()}`}
          onMouseEnter={() => setIsGridHovered(true)}
          onMouseLeave={() => setIsGridHovered(false)}
          className="relative w-full overflow-hidden rounded-[2rem] border border-slate-200/50 bg-white/35 backdrop-blur-sm grid grid-flow-row-dense"
        >
          <AnimatePresence mode="popLayout">
            {activeBubbleSlots.map((slot, slotIndex) => {
            const entry = recipeBySlot[slotIndex];
            if (!entry) {
              return null;
            }
            const { recipe, instanceKey } = entry;
            const isFeaturedSlot = slot.featured;
            const spanStyle = isFeaturedSlot
              ? { gridColumn: `span ${featuredSpan.cols}`, gridRow: `span ${featuredSpan.rows}` }
              : undefined;

            const cardKey = `${slotIndex}-${instanceKey}-${isFeaturedSlot ? 'f' : 's'}`;
            if (slotIndex >= recipeBySlot.length) {
              return null;
            }

            const renderCard = (
              <div className="h-full">
                <RecipeCard
                  recipe={recipe}
                  isFeatured={isFeaturedSlot}
                  isHidden={recipe.id === SECRET_RECIPE.id && !isSecretUnlocked}
                  orbActive={false}
                  energyPaused={!isPageVisible || isSecretHovered || prefersReducedMotion}
                  onHiddenHoverChange={setIsSecretHovered}
                  onCardHoverChange={setIsGridHovered}
                  onClick={() => handleRecipeClick(recipe)}
                />
              </div>
            );

            if (prefersReducedMotion) {
              return (
                <div key={cardKey} style={spanStyle} className={`min-w-0 min-h-0 ${isFeaturedSlot ? 'z-10' : 'z-0'}`}>
                  {renderCard}
                </div>
              );
            }

            return (
              <motion.div
                key={cardKey}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 230, damping: 24 } },
                }}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.2 } }}
                style={spanStyle}
                className={`min-w-0 min-h-0 ${isFeaturedSlot ? 'z-10' : 'z-0'}`}
                transition={{ type: 'spring', stiffness: 180, damping: 28, mass: 0.9 }}
              >
                {renderCard}
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-xl font-serif text-slate-400 italic">The archives hold no record of your inquiry...</p>
        </div>
      )}
    </>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col space-y-8">
      <AnimatePresence>
        {searchVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="relative max-w-2xl mx-auto w-full mb-8"
          >
            <div className="absolute inset-0 bg-white/40 blur-xl rounded-full z-0 pointer-events-none" />
            <div className="relative z-10 alchemy-search-shell rounded-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700/60" />
              <input
                type="text"
                placeholder="Search the archives, ingredients, or hidden truths..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-full py-4 pl-16 pr-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent text-lg font-serif italic placeholder:not-italic placeholder:text-slate-400/80 placeholder:font-sans placeholder:text-sm placeholder:tracking-wide transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedRecipe && !searchQuery ? (
          <RecipeDetail
            key="detail"
            recipe={selectedRecipe}
            onBack={handleDetailBack}
            showCipherClue={selectedRecipe?.id === SECRET_RECIPE.id && !isSecretUnlocked && unlockStage !== 'LOCKED_GRID_HINT'}
            onInitiateDecryption={selectedRecipe?.id === SECRET_RECIPE.id && !isSecretUnlocked ? handleInitiateDecryption : undefined}
          />
        ) : (
          vaultView === 'DEFAULT' ? (
            <motion.div key="vault-default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 lg:space-y-12">
              {renderVaultRecipes()}
            </motion.div>
          ) : (
            <motion.div key="vault-unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 lg:space-y-12">
              {renderVaultRecipes()}
            </motion.div>
          )
        )}
      </AnimatePresence>

      <HackerConsoleOverlay
        isOpen={showHacker}
        onClose={() => {
          setShowHacker(false);
          if (!isSecretUnlocked) {
            setUnlockStage('DETAIL_CLUE');
          }
        }}
        onBreach={handleBreachComplete}
      />
    </motion.div>
  );
}
