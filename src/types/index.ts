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

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
}

export interface AuctionLot {
  id: string;
  originalTitle: string;
  originalDescription: string;
  cipherTitle: string;
  cipherDescription: string;
  startingBid: number;
  highestBid?: number;
  bids: Bid[];
  decryptionKey: string;
  imageUrl: string;
  timestamp: number;
}

export interface EventMetadata {
  id: string;
  originalText: string;
  cipherText: string;
  locationName: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  authorId?: string;
  authorName?: string;
}

export interface MemberIdentity {
  id: string;
  codename: string;
  joinDate: number;
  deviceId: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: number;
}

export interface UserSession {
  role: 'Novice' | 'Archivist' | 'Inner Circle';
  joinedAt: number;
  identity?: MemberIdentity;
}

export type HackerState = 'STANDBY' | 'SCANNING' | 'BREACHED' | 'LOCKED';
