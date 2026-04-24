import { AuctionLot, EventMetadata, MemberIdentity, DirectMessage } from '../types';

const ADJECTIVES = ["Silent", "Crimson", "Shadow", "Argent", "Cobalt", "Veiled", "Hollow", "Iron"];
const NOUNS = ["Observer", "Cipher", "Hand", "Eye", "Whisper", "Moth", "Raven", "Lotus"];

const getDeviceId = (): string => {
    let id = localStorage.getItem('arcadia_device_id');
    if (!id) {
        // Generate a reasonably unique device fingerprint
        id = 'DEV-' + Math.random().toString(36).substring(2, 15).toUpperCase();
        localStorage.setItem('arcadia_device_id', id);
    }
    return id;
};

export const generateIdentity = (): MemberIdentity => {
    const existing = localStorage.getItem('arcadia_identity');
    const deviceId = getDeviceId();
    
    if (existing) {
        const identity = JSON.parse(existing) as MemberIdentity;
        // Verify this identity belongs to this device
        if (identity.deviceId === deviceId) {
            return identity;
        }
        // If device ID mismatch, we don't return it (security)
    }

    const codename = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
    const identity: MemberIdentity = {
        id: "me_" + Math.random().toString(36).substring(2, 9),
        codename,
        joinDate: Date.now(),
        deviceId: deviceId
    };
    localStorage.setItem('arcadia_identity', JSON.stringify(identity));
    
    // Also save to "known accounts" on this device
    const accounts = getKnownAccounts();
    if (!accounts.find(a => a.codename === codename)) {
        localStorage.setItem('arcadia_device_accounts', JSON.stringify([...accounts, identity]));
    }
    
    return identity;
};

const getKnownAccounts = (): MemberIdentity[] => {
    const saved = localStorage.getItem('arcadia_device_accounts');
    return saved ? JSON.parse(saved) : [];
};

export const loginWithAlias = (codename: string): MemberIdentity | null => {
    const deviceId = getDeviceId();
    const accounts = getKnownAccounts();
    
    const account = accounts.find(a => a.codename.toLowerCase() === codename.toLowerCase());
    if (account && account.deviceId === deviceId) {
        localStorage.setItem('arcadia_identity', JSON.stringify(account));
        return account;
    }
    return null;
};

export const MOCK_MEMBERS: MemberIdentity[] = [
    { id: "mem_1", codename: "Crimson Raven", joinDate: Date.now() - 10000000, deviceId: "SYSTEM" },
    { id: "mem_2", codename: "Silent Observer", joinDate: Date.now() - 20000000, deviceId: "SYSTEM" },
    { id: "mem_3", codename: "Veiled Moth", joinDate: Date.now() - 5000000, deviceId: "SYSTEM" },
];

export const getMembers = (): MemberIdentity[] => {
    const saved = localStorage.getItem('arcadia_members');
    return saved ? JSON.parse(saved) : MOCK_MEMBERS;
};

export const saveMember = (member: MemberIdentity) => {
    const members = getMembers();
    localStorage.setItem('arcadia_members', JSON.stringify([member, ...members]));
};

export const removeMember = (memberId: string) => {
    const members = getMembers().filter(m => m.id !== memberId);
    localStorage.setItem('arcadia_members', JSON.stringify([...members]));
};

export const getMessages = (myId: string): DirectMessage[] => {
    const saved = localStorage.getItem('arcadia_dms_' + myId);
    return saved ? JSON.parse(saved) : [
        {
            id: "msg_1",
            senderId: "mem_1",
            senderName: "Crimson Raven",
            receiverId: myId,
            content: "Welcome to the inner circle. We encrypt our intentions, but our goals align.",
            timestamp: Date.now() - 50000
        }
    ];
};

export const saveMessage = (myId: string, msg: DirectMessage) => {
    const msgs = getMessages(myId);
    localStorage.setItem('arcadia_dms_' + myId, JSON.stringify([...msgs, msg]));
};

export const deleteMessage = (myId: string, msgId: string) => {
    const msgs = getMessages(myId);
    localStorage.setItem('arcadia_dms_' + myId, JSON.stringify(msgs.filter(m => m.id !== msgId)));
};

export const getAuctions = (): AuctionLot[] => {
    const saved = localStorage.getItem('arcadia_auctions');
    const lots: AuctionLot[] = saved ? JSON.parse(saved) : [
        {
            id: "lot_1",
            originalTitle: "Vial of the First Rain",
            originalDescription: "A sealed crystalline vessel containing hyper-oxygenated water from the Hadean eon. The liquid exhibits a faint bioluminescent pulse synced to the lunar cycle.",
            cipherTitle: "⍵⍨⍙⍫ ⍮⍝ ⍳⍧⎊ ⍝⍨⍱⍲⍳ ⍱⍙⍨⍭",
            cipherDescription: "⍯⍴⍱⍯⍮⍱⍳⎊⎉ ⍳⍮ ⍦⎊ ⍳⍧⎊ ⍝⍨⍱⍲⍳ ⍯⍱⎊⎈⍨⍯⍨⍳⍙⍳⍨⍮⍭ ⍳⍮ ⍝⍙⍫⍫ ⍮⍭ ⍳⍧⎊ ⍭⎊⍶⍫⍸ ⍝⍮⍱⍬⎊⎉ ⎊⍙⍱⍳⍧⎔ ⍦⍫⍮⍶⍲ ⍝⍙⍨⍭⍳⍫⍸ ⍴⍭⎉⎊⍱ ⍬⍮⍮⍭⍫⍨⍦⍧⍳⎔",
            startingBid: 150000,
            highestBid: 185000,
            bids: [
                { id: "bid_init_1", bidderId: "mem_2", bidderName: "Silent Observer", amount: 185000, timestamp: Date.now() - 1800000 },
                { id: "bid_init_2", bidderId: "mem_1", bidderName: "Crimson Raven", amount: 165000, timestamp: Date.now() - 3600000 }
            ],
            decryptionKey: "secret",
            imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80&w=1200",
            timestamp: Date.now() - 3600000
        },
        {
            id: "lot_2",
            originalTitle: "Neural Interface Circlet",
            originalDescription: "A pre-collapse neuro-link device forged from an unknown silver-iridium alloy. Capable of expanding cognitive bandwidth by 400% at the risk of permanent ego-dissolution.",
            cipherTitle: "⍭⎊⍴⍱⍙⍫ ⍨⍭⍳⎊⍱⍝⍙⎈⎊ ⎈⍨⍱⎈⍫⎊⍳",
            cipherDescription: "⍙ ⍯⍱⎊-⍈⍮⍫⍫⍙⍯⍲⎊ ⍭⎊⍴⍱⍮-⍫⍨⍭⍪ ⍉⎊⍵⍨⎈⎊ ⍝⍮⍱⍦⎊⍉ ⍝⍱⍮⍬ ⍙⍭ ⍴⍭⍪⍭⍮⍶⍭ ⍲⍨⍫⍵⎊⍱-⍨⍱⍨⍉⍨⍴⍬ ⍙⍫⍫⍮⍸⎔",
            startingBid: 420000,
            highestBid: 420000,
            bids: [],
            decryptionKey: "secret",
            imageUrl: "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=1200",
            timestamp: Date.now() - 7200000
        },
        {
            id: "lot_3",
            originalTitle: "Aether-Locked Chronometer",
            originalDescription: "A pocket watch that doesn't track time, but rather the proximity to local temporal fractures. The gears are suspended in a localized zero-gravity field.",
            cipherTitle: "⍙⎊⍳⍧⎊⍱-⍫⍮⎈⍪⎊⍉ ⎈⍧⍱⍮⍭⍮⍬⎊⍳⎊⍱",
            cipherDescription: "⍙ ⍯⍮⎈⍪⎊⍳ ⍶⍙⍳⎈⍧ ⍳⍧⍙⍳ ⍉⍮⎊⍲⍭⍳ ⍳⍱⍙⎈⍪ ⍳⍨⍬⎊⎔ ⍦⍴⍳ ⍱⍙⍳⍧⎊⍱ ⍳⍧⎊ ⍯⍱⍮⍷⍨⍬⍨⍳⍸ ⍳⍮ ⍫⍮⎈⍙⍫ ⍳⎊⍬⍯⍮⍱⍙⍫ ⍝⍱⍙⎈⍳⍴⍱⎊⍲⎔",
            startingBid: 890000,
            highestBid: 1200000,
            bids: [
                { id: "bid_init_3", bidderId: "mem_3", bidderName: "Veiled Moth", amount: 1200000, timestamp: Date.now() - 400000 }
            ],
            decryptionKey: "secret",
            imageUrl: "https://images.unsplash.com/photo-1517420812314-8e84b1173d97?auto=format&fit=crop&q=80&w=1200",
            timestamp: Date.now() - 14400000
        }
    ];
    
    // Ensure all lots have a bids array and highestBid
    return lots.map(l => ({
        ...l,
        bids: l.bids || [],
        highestBid: l.highestBid || l.startingBid
    }));
};

export const saveAuction = (lot: AuctionLot) => {
    const auctions = getAuctions();
    localStorage.setItem('arcadia_auctions', JSON.stringify([lot, ...auctions]));
};

export const placeBid = (lotId: string, bid: Omit<import('../types').Bid, 'id' | 'timestamp'>) => {
    const auctions = getAuctions();
    const lotIndex = auctions.findIndex(l => l.id === lotId);
    if (lotIndex === -1) return;

    const lot = auctions[lotIndex];
    const newBid: import('../types').Bid = {
        ...bid,
        id: "bid_" + Date.now().toString(),
        timestamp: Date.now()
    };

    lot.bids = [newBid, ...(lot.bids || [])];
    lot.highestBid = Math.max(lot.highestBid || lot.startingBid, bid.amount);

    localStorage.setItem('arcadia_auctions', JSON.stringify(auctions));
    return lot;
};

export const clearAuctions = () => {
    localStorage.removeItem('arcadia_auctions');
};

export const getEvents = (): EventMetadata[] => {
    const saved = localStorage.getItem('arcadia_events');
    return saved ? JSON.parse(saved) : [{
        id: "ev_1",
        originalText: "The password for the vial is secret meet at the lake",
        cipherText: "▪️ 🔑 ▪️ ▪️ 🧪 ▪️ 🌑 🜁 ▪️ ▪️ 🌊",
        locationName: "The Serpentine Lake",
        latitude: 51.5055,
        longitude: -0.1656,
        timestamp: Date.now() - 3600000
    }];
};

export const saveEvent = (event: EventMetadata) => {
    const events = getEvents();
    localStorage.setItem('arcadia_events', JSON.stringify([event, ...events]));
};
