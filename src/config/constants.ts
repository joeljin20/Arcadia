export const SECRET_PHRASE = "et in arcadia ego";

export const PRD_RECIPES = [
  {
    id: 'sourdough',
    title: "Philosopher's Sourdough",
    description: 'A 72-hour fermented loaf with a crispy crust. The starter was passed down through ancient alchemical lineages.',
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=1200',
    duration: '72h',
    difficulty: 'Expert',
    popularity: 98,
    category: 'Artisan Breads',
    prepTime: '45 mins',
    cookTime: '45 mins',
    servings: 1,
    ingredients: [
      "100g active mature sourdough starter (100% hydration)",
      "375g filtered water (at 78°F/25°C)",
      "500g strong bread flour (preferably stone-ground)",
      "10g fine sea salt"
    ],
    steps: [
      "In a large earthen or glass bowl, dissolve the active starter in the warm filtered water. Mix until it forms a milky liquid.",
      "Add the flour and mix by hand until a shaggy dough forms, ensuring no dry flour remains. Cover and let rest (autolyse) for 45 minutes.",
      "Sprinkle the sea salt over the dough. Using wet hands, pinch and fold the salt into the dough until fully integrated.",
      "Over the next 3 hours, perform 4 sets of stretch and folds spaced 45 minutes apart, pulling the dough upwards and folding it over itself.",
      "Cover the bowl tightly and leave it at room temperature until the dough has increased by 40-50% in volume and shows active bubbles.",
      "Turn the dough onto a lightly floured surface. Pre-shape into a loose round and let rest for 20 minutes before performing the final shaping.",
      "Place the shaped dough seam-side up in a dusted banneton. Retard in the refrigerator for 12 to 24 hours.",
      "Preheat a cast-iron Dutch oven to 500°F (260°C) for 1 hour. Turn out the dough seamlessly and score deeply.",
      "Bake covered for 20 minutes. Remove lid, drop temperature to 450°F (230°C), and bake for 25 more minutes until mahogany."
    ]
  },
  {
    id: 'galette',
    title: 'Crimson Berry Galette',
    description: 'Rustic pastry filled with seasonal berries, a hint of lavender, and a dash of cinnabar spice.',
    image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=1200',
    duration: '2h',
    difficulty: 'Medium',
    popularity: 88,
    category: 'Confections',
    prepTime: '20 mins',
    cookTime: '35 mins',
    servings: 6,
    ingredients: [
      "1 1/4 cups all-purpose flour",
      "1/2 teaspoon kosher salt",
      "1/2 cup cold unsalted butter, cubed",
      "1/4 cup ice water",
      "3 cups mixed berries (blackberries, raspberries, blueberries)",
      "1/4 cup granulated sugar",
      "1 teaspoon fresh lavender buds",
      "1 egg (for egg wash)"
    ],
    steps: [
      "Whisk flour and salt together in a large chilled bowl.",
      "Cut in the cold butter until the mixture resembles coarse meal with pea-sized butter lumps.",
      "Drizzle ice water evenly and fold gently until the dough just comes together. Form a disc, wrap, and chill for 1 hour.",
      "In a separate bowl, toss the berries with sugar and crushed lavender buds. Allow them to macerate slightly.",
      "Roll the dough out onto parchment paper into a 12-inch rustic circle.",
      "Mound the berry mixture in the center, leaving a 2-inch border bare.",
      "Fold the border over the fruit, pleating the edges naturally as you go round.",
      "Brush the pastry border with beaten egg and sprinkle with coarse sugar.",
      "Bake at 400°F (200°C) for 35 to 40 minutes until pastry is golden and fruit is bubbling."
    ]
  },
  {
    id: 'miso',
    title: "Golden Miso Elixir",
    description: 'A deeply aromatic, life-restoring broth infused with black garlic and toasted chili oil.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=1200',
    duration: '4h',
    difficulty: 'Hard',
    popularity: 94,
    category: 'Soups & Broths',
    prepTime: '30 mins',
    cookTime: '3h 30 mins',
    servings: 4,
    ingredients: [
      "2 liters high-quality vegetable or chicken stock",
      "3 tablespoons white miso paste",
      "1 tablespoon red miso paste",
      "4 cloves black garlic, mashed to a paste",
      "1 piece kombu (dried kelp)",
      "1/2 cup dried shiitake mushrooms",
      "2 inches fresh ginger, sliced thin",
      "Toasted sesame chili oil (for serving)",
      "Scallions, finely chopped"
    ],
    steps: [
      "In a heavy bottomed pot, combine the stock, kombu, dried mushrooms, and ginger.",
      "Bring the mixture to a bare simmer (do not let it boil vigorously) and hold for 2 hours to extract all umami flavors.",
      "Remove the pot from the heat. Carefully retrieve and discard the kombu and ginger. Save the hydrated mushrooms for garnish if desired.",
      "In a smaller bowl, whisk together the white miso, red miso, and black garlic paste with a ladle of the hot broth until completely smooth.",
      "Stir the miso slurry back into the main pot. From this point on, ensure the broth does not boil, as this will destroy the miso's probiotics and delicate flavor.",
      "Ladle the hot elixir into warm bowls.",
      "Garnish with thinly sliced scallions and a generous drizzle of toasted sesame chili oil."
    ]
  },
  {
    id: 'macarons',
    title: 'Midnight Blue Macarons',
    description: 'Almond shells tinted with butterfly pea flower, filled with a rich, dark chocolate ganache.',
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&q=80&w=1200',
    duration: '1.5h',
    difficulty: 'Expert',
    popularity: 91,
    category: 'Confections',
    prepTime: '45 mins',
    cookTime: '15 mins',
    servings: 12,
    ingredients: [
      "100g egg whites (aged at room temperature)",
      "100g granulated sugar",
      "105g almond flour (fine sifted)",
      "105g powdered sugar",
      "1 tablespoon butterfly pea flower powder",
      "150g dark chocolate (70% cacao), chopped",
      "100ml heavy cream"
    ],
    steps: [
      "Sift the almond flour, powdered sugar, and butterfly pea flower powder together three times. Discard large almond pieces.",
      "Whip the egg whites on medium speed. Once frothy, slowly stream in the granulated sugar until stiff peaks form (Glossy meringue).",
      "Fold the dry ingredients into the meringue in thirds. Perform 'macaronage' by pressing the batter against the bowl to deflate slightly.",
      "Stop folding when the batter flows off the spatula in an unbroken ribbon (like lava).",
      "Pipe rounds onto a silicone mat or parchment. Tap the tray firmly to release air bubbles.",
      "Let the shells rest for 30-45 minutes until a dry skin forms.",
      "Bake at 300°F (150°C) for 14-16 minutes. Cool completely.",
      "For the ganache, heat the cream until simmering and pour over the chopped chocolate. Let sit for 2 minutes, then stir until smooth. Cool until pipeable.",
      "Pipe ganache onto half the shells and sandwich with the other half. Let mature in the fridge for 24 hours before serving."
    ]
  },
  {
    id: 'focaccia',
    title: 'Sun-Dried Tomato Focaccia',
    description: 'Soft, olive oil-rich dough dimpled with herbs and tomatoes, capturing the essence of the summer sun.',
    image: 'https://images.unsplash.com/photo-1594943714247-a859cff2e78f?auto=format&fit=crop&q=80&w=1200',
    duration: '4h',
    difficulty: 'Easy',
    popularity: 85,
    category: 'Artisan Breads',
    prepTime: '20 mins',
    cookTime: '25 mins',
    servings: 8,
    ingredients: [
      "500g strong bread flour",
      "400g warm water",
      "7g instant yeast",
      "10g fine sea salt",
      "1/4 cup extra-virgin olive oil (plus more for pan and dimpling)",
      "1/2 cup sun-dried tomatoes (oil-packed), chopped",
      "2 sprigs fresh rosemary, leaves stripped",
      "Coarse flaky sea salt"
    ],
    steps: [
      "In a large bowl, mix the flour, water, yeast, and fine salt until a sticky dough forms. No kneading required.",
      "Cover the bowl with a damp cloth and let it rise at room temperature until doubled in size, about 2 hours.",
      "Generously oil a 9x13 inch baking pan with extra-virgin olive oil.",
      "Gently scrape the dough into the prepared pan. Do not flatten it immediately. Let it rest for 20 minutes to relax the gluten.",
      "Lightly oil your fingers. Stretch the dough gently to the corners of the pan. If it resists, let it rest another 10 minutes.",
      "Cover and let the dough proof in the pan for 1 hour until puffy and jiggly.",
      "Drizzle more olive oil over the top. Press your fingers deep into the dough to create characteristic dimples.",
      "Press the chopped sun-dried tomatoes and rosemary leaves gently into the dimples. Sprinkle generously with flaky sea salt.",
      "Bake at 425°F (220°C) for 25-30 minutes until deeply golden brown and crisp on the edges."
    ]
  },
  {
    id: 'honey_cake',
    title: 'Lavender Honey Cake',
    description: 'A light, floral sponge cake sweetened with nectar harvested during the spring equinox.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1200',
    duration: '1.5h',
    difficulty: 'Medium',
    popularity: 89,
    category: 'Confections',
    prepTime: '30 mins',
    cookTime: '45 mins',
    servings: 10,
    ingredients: [
      "2 1/2 cups all-purpose flour",
      "2 teaspoons baking powder",
      "1/2 teaspoon baking soda",
      "1/2 teaspoon salt",
      "1 cup unsalted butter, softened",
      "1/2 cup granulated sugar",
      "3/4 cup high-quality wildflower honey",
      "3 large eggs",
      "1/2 cup buttermilk",
      "1 tablespoon culinary lavender (steeped in 2 tbsp hot water)",
      "Vanilla bean glaze"
    ],
    steps: [
      "Preheat the oven to 350°F (175°C). Butter and flour a 9-inch bundt pan.",
      "Whisk together the flour, baking powder, baking soda, and salt in a medium bowl.",
      "In a stand mixer, cream the softened butter and sugar until light and fluffy (about 4 minutes).",
      "Gradually stream in the honey while continuing to beat on medium speed.",
      "Add the eggs one at a time, mixing well after each addition. Mix in the steeped lavender water (including buds if desired).",
      "Alternate adding the dry ingredients and buttermilk into the batter, starting and ending with the dry ingredients. Mix until just combined.",
      "Pour the batter into the prepared bundt pan and smooth the top.",
      "Bake for 40-45 minutes, or until a wooden skewer inserted comes out clean.",
      "Cool in the pan for 15 minutes before inverting onto a wire rack. Drizzle with vanilla bean glaze once cooled completely."
    ]
  }
];
