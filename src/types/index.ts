export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  duration?: string;
  difficulty?: string;
  popularity?: number;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
}

export interface AuctionLot {
  id: string;
  originalTitle: string;
  originalDescription: string;
  cipherTitle: string;
  cipherDescription: string;
  startingBid: number;
  decryptionKey: string;
  imageUrl: string;
  timestamp: number;
}

export interface UserSession {
  role: 'Novice' | 'Archivist' | 'Inner Circle';
  joinedAt: number;
}
