import { AuctionLot } from '../types';

export const getAuctions = (): AuctionLot[] => {
    const saved = localStorage.getItem('arcadia_auctions');
    return saved ? JSON.parse(saved) : [{
        id: "lot_1",
        originalTitle: "Vial of the First Rain",
        originalDescription: "Purported to be the first precipitation to fall on the newly formed Earth. Glows faintly under moonlight. Contains traces of unidentified organic matter.",
        cipherTitle: "⍵⍨⍙⍫ ⍮⍝ ⍳⍧⎊ ⍝⍨⍱⍲⍳ ⍱⍙⍨⍭",
        cipherDescription: "⍯⍴⍱⍯⍮⍱⍳⎊⎉ ⍳⍮ ⍦⎊ ⍳⍧⎊ ⍝⍨⍱⍲⍳ ⍯⍱⎊⎈⍨⍯⍨⍳⍙⍳⍨⍮⍭ ⍳⍮ ⍝⍙⍫⍫ ⍮⍭ ⍳⍧⎊ ⍭⎊⍶⍫⍸ ⍝⍮⍱⍬⎊⎉ ⎊⍙⍱⍳⍧⎔ ⍦⍫⍮⍶⍲ ⍝⍙⍨⍭⍳⍫⍸ ⍴⍭⎉⎊⍱ ⍬⍮⍮⍭⍫⍨⍦⍧⍳⎔",
        startingBid: 150000,
        decryptionKey: "secreto",
        imageUrl: "https://images.unsplash.com/photo-1616853291583-b78fc438885b?auto=format&fit=crop&q=80&w=800",
        timestamp: Date.now() - 3600000
    }];
};

export const saveAuction = (lot: AuctionLot) => {
    const auctions = getAuctions();
    localStorage.setItem('arcadia_auctions', JSON.stringify([lot, ...auctions]));
};

export const clearAuctions = () => {
    localStorage.removeItem('arcadia_auctions');
};
