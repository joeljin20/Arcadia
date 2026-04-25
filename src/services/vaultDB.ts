import { VaultItem, VaultCategory, VaultChat, Bid } from '../types';

// ── Pool definition ────────────────────────────────────────────────────────────

type PoolBase = Omit<VaultItem, 'currentPrice' | 'highestBid' | 'bids' | 'endsAt' | 'openedAt' | 'priceOpenedAt'>;

const DARK_IMAGES = [
  'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1517420812314-8e84b1173d97?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=900',
];

const img = (i: number) => DARK_IMAGES[i % DARK_IMAGES.length];

export const VAULT_ITEM_POOL: PoolBase[] = [
  {
    id: 'pool_1',
    originalTitle: 'Obsidian Obelisk of Acolytes',
    alternateName: 'The Midnight Needle',
    cipherTitle: '⍮⍦⍲⍨⍉⍨⍙⍭ ⍮⍦⎊⍫⍨⍲⍪ ⍮⍝ ⍙⎈⍮⍫⍸⍳⎊⍲',
    originalDescription:
      'A 40cm monolith of compressed volcanic obsidian inscribed with pre-Sumerian devotional script on each face. Responds to low-frequency sound with a faint internal luminescence that no spectrometer has yet categorised.',
    cipherDescription:
      '⍙ ⍴⍭⍪⍭⍮⍶⍭ ⍙⍫⍫⍮⍸ ⍮⍝ ⍲⎊⎈⍱⎊⍳ ⍲⍮⎈⍨⎊⍳⍸ ⍩⍭⍮⍶⍫⎊⍉⍦⎊ ⍳⍧⎊ ⍙⍱⎈⍙⍭⎊ ⍯⍱⍮⍳⍮⎈⍮⍫⍲',
    category: 'Relics',
    sellerAlias: 'VELVET SIGNAL',
    startingBid: 380000,
    decryptionKey: 'secret',
    imageUrl: img(0),
  },
  {
    id: 'pool_2',
    originalTitle: 'Codex of the Seventh Seal',
    alternateName: 'Vox Umbra Manuscript',
    cipherTitle: '⎈⍮⍉⎊⍷ ⍮⍝ ⍳⍧⎊ ⍲⎊⍵⎊⍭⍳⍧ ⍲⎊⍙⍫',
    originalDescription:
      'Hand-lettered vellum tome bound in unidentified leather. Contains 312 pages of ciphered doctrine, seven blank pages, and one page that repels ink. Carbon-dated to 1432 CE — twelve years before the documented founding of its purported author.',
    cipherDescription:
      '⍧⍙⍭⍉-⍫⎊⍳⍳⎊⍱⎊⍉ ⍵⎊⍫⍫⍴⍬ ⍳⍮⍬⎊ ⍦⍮⍴⍭⍉ ⍨⍭ ⍴⍭⍨⍉⎊⍭⍳⍨⍝⍨⎊⍉ ⍫⎊⍙⍳⍧⎊⍱',
    category: 'Forbidden Archives',
    sellerAlias: 'IRON GRIMOIRE',
    startingBid: 1100000,
    decryptionKey: 'secret',
    imageUrl: img(1),
  },
  {
    id: 'pool_3',
    originalTitle: 'Verglas Key, Batch 7',
    alternateName: 'The Cryogenic Sigil',
    cipherTitle: '⍵⎊⍱⍦⍫⍙⍲ ⍪⎊⍸⎔ ⍦⍙⍳⎈⍧ ⍲⎊⍵⎊⍭',
    originalDescription:
      'One of eleven keys produced by the disbanded Verglas Programme. Capable of cold-opening any magnetic-lock system manufactured before 2019. The remaining six are unaccounted for.',
    cipherDescription:
      '⍮⍭⎊ ⍮⍝ ⎊⍫⎊⍵⎊⍭ ⍪⎊⍸⍲ ⍯⍱⍮⍉⍴⎈⎊⍉ ⍦⍸ ⍳⍧⎊ ⍉⍨⍲⍦⍙⍭⍉⎊⍉ ⍵⎊⍱⍦⍫⍙⍲ ⍯⍱⍮⍦⍱⍙⍬⍬⎊',
    category: 'Cipher Keys',
    sellerAlias: 'COBALT SPECTER',
    startingBid: 220000,
    decryptionKey: 'secret',
    imageUrl: img(2),
  },
  {
    id: 'pool_4',
    originalTitle: 'Contract of the Pale Council',
    cipherTitle: '⎈⍮⍭⍳⍱⍙⎈⍳ ⍮⍝ ⍳⍧⎊ ⍯⍙⍫⎊ ⎈⍮⍴⍭⎈⍨⍫',
    originalDescription:
      'A notarised agreement between seven unnamed signatories and an entity referred to only as "the Pallor." Clauses 11 through 18 are written in a script that shifts when photographed. Legal enforceability: unconfirmed.',
    cipherDescription:
      '⍙ ⍭⍮⍳⍙⍱⍨⍲⎊⍉ ⍙⍦⍱⎊⎊⍬⎊⍭⍳ ⍦⎊⍳⍶⎊⎊⍭ ⍲⎊⍵⎊⍭ ⍴⍭⍭⍙⍬⎊⍉ ⍲⍨⍦⍭⍙⍳⍮⍱⍨⎊⍲',
    category: 'Black Ledger',
    sellerAlias: 'PALE HAND',
    startingBid: 760000,
    decryptionKey: 'secret',
    imageUrl: img(3),
  },
  {
    id: 'pool_5',
    originalTitle: 'Astral Compass of the Dreaming Eye',
    alternateName: "Navigator's Third Eye",
    cipherTitle: '⍙⍲⍳⍱⍙⍫ ⎈⍮⍬⍯⍙⍲⍲ ⍮⍝ ⍳⍧⎊ ⍉⍱⎊⍙⍬⍨⍭⍦ ⎊⍸⎊',
    originalDescription:
      'A brass navigational instrument calibrated not to magnetic north but to a fixed point 11.4 degrees outside the solar system. Needle reacts to proximity of individuals who have undergone third-degree initiation.',
    cipherDescription:
      '⍙ ⍦⍱⍙⍲⍲ ⍭⍙⍵⍨⍦⍙⍳⍨⍮⍭⍙⍫ ⍨⍭⍲⍳⍱⍴⍬⎊⍭⍳ ⎈⍙⍫⍨⍦⍱⍙⍳⎊⍉ ⍳⍮ ⍙⍭ ⎊⍷⍳⍱⍙⍲⍮⍫⍙⍱ ⍝⍨⍷⎊⍉ ⍯⍮⍨⍭⍳',
    category: 'Oracular Signals',
    sellerAlias: 'MERIDIAN GATE',
    startingBid: 540000,
    decryptionKey: 'secret',
    imageUrl: img(4),
  },
  {
    id: 'pool_6',
    originalTitle: 'Initiation Vial — Rite of Dissolution',
    cipherTitle: '⍨⍭⍨⍳⍨⍙⍳⍨⍮⍭ ⍵⍨⍙⍫ ⍱⍨⍳⎊ ⍮⍝ ⍉⍨⍲⍲⍮⍫⍴⍳⍨⍮⍭',
    originalDescription:
      'A sealed ampule containing a solution used in the Third Grade admission ceremony of a pre-war European lodge. The compound is non-toxic but produces synesthetic hallucinations lasting precisely 33 minutes.',
    cipherDescription:
      '⍙ ⍲⎊⍙⍫⎊⍉ ⍙⍬⍯⍴⍫⎊ ⎈⍮⍭⍳⍙⍨⍭⍨⍭⍦ ⍙ ⍲⍮⍫⍴⍳⍨⍮⍭ ⍴⍲⎊⍉ ⍨⍭ ⍳⍧⎊ ⍳⍧⍨⍱⍉ ⍦⍱⍙⍉⎊ ⍙⍉⍬⍨⍲⍲⍨⍮⍭',
    category: 'Initiation Artifacts',
    sellerAlias: 'HOLLOW WITNESS',
    startingBid: 95000,
    decryptionKey: 'secret',
    imageUrl: img(5),
  },
  {
    id: 'pool_7',
    originalTitle: 'Bone Chronicle of House Ashen',
    cipherTitle: '⍦⍮⍭⎊ ⎈⍧⍱⍮⍭⍨⎈⍫⎊ ⍮⍝ ⍧⍮⍴⍲⎊ ⍙⍲⍧⎊⍭',
    originalDescription:
      "A bound record of House Ashen's membership rolls from 1798-1943, etched on treated bone tablets. The final 40 entries are written in a different hand, dated 2031.",
    cipherDescription:
      '⍙ ⍦⍮⍴⍭⍉ ⍱⎊⎈⍮⍱⍉ ⍮⍝ ⍧⍮⍴⍲⎊ ⍙⍲⍧⎊⍭⍲ ⍬⎊⍬⍦⎊⍱⍲⍧⍨⍯ ⍱⍮⍫⍫⍲ ⎊⍳⎈⍧⎊⍉ ⍮⍭ ⍦⍮⍭⎊',
    category: 'Forbidden Archives',
    sellerAlias: 'ASH HERALD',
    startingBid: 330000,
    decryptionKey: 'secret',
    imageUrl: img(0),
  },
  {
    id: 'pool_8',
    originalTitle: 'Vitreous Sigil Disc',
    alternateName: 'The Glass Mandala',
    cipherTitle: '⍵⍨⍳⍱⎊⍮⍴⍲ ⍲⍨⍦⍨⍫ ⍉⍨⍲⎈',
    originalDescription:
      'A 22cm disc of fused volcanic glass bearing a 48-point sigil etched with a laser predating the technology by sixty years. Centre point emits a reading of absolute zero on thermal imaging regardless of ambient temperature.',
    cipherDescription:
      '⍙ ⍵⍮⍫⎈⍙⍭⍨⎈ ⍦⍫⍙⍲⍲ ⍉⍨⍲⎈ ⍦⎊⍙⍱⍨⍭⍦ ⍙ ⍝⍮⍱⍳⍸-⎊⍨⍦⍧⍳ ⍯⍮⍨⍭⍳ ⍲⍨⍦⍨⍫ ⎊⍳⎈⍧⎊⍉ ⍶⍨⍳⍧ ⍙⍭ ⍙⍭⍙⎈⍧⍱⍮⍭⍨⍲⍳⍨⎈ ⍫⍙⍲⎊⍱',
    category: 'Relics',
    sellerAlias: 'CRYSTAL VEIL',
    startingBid: 290000,
    decryptionKey: 'secret',
    imageUrl: img(1),
  },
  {
    id: 'pool_9',
    originalTitle: 'Seven-Fold Cipher Wheel',
    cipherTitle: '⍲⎊⍵⎊⍭-⍝⍮⍫⍉ ⎈⍨⍯⍧⎊⍱ ⍶⍧⎊⎊⍫',
    originalDescription:
      'A mechanical cipher device with seven concentric brass rings and an internal spring mechanism of unknown purpose. Alignment of all rings simultaneously produces a sequence that has never been repeated in documented testing.',
    cipherDescription:
      '⍙ ⍬⎊⎈⍧⍙⍭⍨⎈⍙⍫ ⎈⍨⍯⍧⎊⍱ ⍉⎊⍵⍨⎈⎊ ⍶⍨⍳⍧ ⍲⎊⍵⎊⍭ ⎈⍮⍭⎈⎊⍭⍳⍱⍨⎈ ⍦⍱⍙⍲⍲ ⍱⍨⍭⍦⍲',
    category: 'Cipher Keys',
    sellerAlias: 'NULL ARCHITECT',
    startingBid: 175000,
    decryptionKey: 'secret',
    imageUrl: img(2),
  },
  {
    id: 'pool_10',
    originalTitle: 'Ledger of the Unseen Hand',
    cipherTitle: '⍫⎊⍉⍦⎊⍱ ⍮⍝ ⍳⍧⎊ ⍴⍭⍲⎊⎊⍭ ⍧⍙⍭⍉',
    originalDescription:
      'Double-entry accounts of 312 transactions between 1919 and 1977 in a currency with no ISO code. All entries are in the same hand. Counterparty names are consistent but match no known individual in any public record.',
    cipherDescription:
      '⍉⍮⍴⍦⍫⎊-⎊⍭⍳⍱⍸ ⍙⎈⎈⍮⍴⍭⍳⍲ ⍮⍝ ⍳⍧⍱⎊⎊ ⍧⍴⍭⍉⍱⎊⍉ ⍳⍱⍙⍭⍲⍙⎈⍳⍨⍮⍭⍲ ⍨⍭ ⍙ ⎈⍴⍱⍱⎊⍭⎈⍸ ⍶⍨⍳⍧ ⍭⍮ ⍨⍲⍮ ⎈⍮⍉⎊',
    category: 'Black Ledger',
    sellerAlias: 'GREY EMISSARY',
    startingBid: 920000,
    decryptionKey: 'secret',
    imageUrl: img(3),
  },
  {
    id: 'pool_11',
    originalTitle: 'Shard of the Oracle Mirror',
    alternateName: 'Cassandra Fragment',
    cipherTitle: '⍲⍧⍙⍱⍉ ⍮⍝ ⍳⍧⎊ ⍮⍱⍙⎈⍫⎊ ⍬⍨⍱⍱⍮⍱',
    originalDescription:
      'A 14cm shard of a larger object catalogued only as "Mirror IX" in the Rosicrucian inventory of 1922. Reflective surface shows the viewer at an age between 8 and 14 years younger, regardless of angle or lighting.',
    cipherDescription:
      '⍙ ⍲⍧⍙⍱⍉ ⍮⍝ ⍙ ⍫⍙⍱⍦⎊⍱ ⍮⍦⎒⎊⎈⍳ ⍱⎊⍝⍫⎊⎈⍳⍨⍵⎊ ⍲⍴⍱⍝⍙⎈⎊ ⍲⍧⍮⍶⍲ ⍳⍧⎊ ⍵⍨⎊⍶⎊⍱ ⍸⍮⍴⍭⍦⎊⍱',
    category: 'Oracular Signals',
    sellerAlias: 'MIRRORED ORACLE',
    startingBid: 680000,
    decryptionKey: 'secret',
    imageUrl: img(4),
  },
  {
    id: 'pool_12',
    originalTitle: 'Rite of Passage Token — Red Degree',
    cipherTitle: '⍱⍨⍳⎊ ⍮⍝ ⍯⍙⍲⍲⍙⍦⎊ ⍳⍮⍪⎊⍭ ⍱⎊⍉ ⍉⎊⍦⍱⎊⎊',
    originalDescription:
      "A cast-iron medallion issued upon completion of the Red Degree initiation. The reverse bears the recipient's name in a cipher that has never been broken. This token belongs to someone who completed the rite in 2019.",
    cipherDescription:
      '⍙ ⎈⍙⍲⍳-⍨⍱⍮⍭ ⍬⎊⍉⍙⍫⍫⍨⍮⍭ ⍨⍲⍲⍴⎊⍉ ⍴⍯⍮⍭ ⎈⍮⍬⍯⍫⎊⍳⍨⍮⍭ ⍮⍝ ⍳⍧⎊ ⍱⎊⍉ ⍉⎊⍦⍱⎊⎊',
    category: 'Initiation Artifacts',
    sellerAlias: 'CRIMSON LODGE',
    startingBid: 55000,
    decryptionKey: 'secret',
    imageUrl: img(5),
  },
  {
    id: 'pool_13',
    originalTitle: 'Lacunae Map, Edition IX',
    cipherTitle: '⍫⍙⎈⍴⍭⍙⎊ ⍬⍙⍯⎔ ⎊⍉⍨⍳⍨⍮⍭ ⍨⍷',
    originalDescription:
      'A cartographic work depicting an archipelago that does not correspond to any known geography. Ninth in a series; only three editions are publicly acknowledged to exist. Coordinates, when entered into any mapping system, produce consistent results.',
    cipherDescription:
      '⍙ ⎈⍙⍱⍳⍮⍦⍱⍙⍯⍧⍨⎈ ⍶⍮⍱⍪ ⍉⎊⍯⍨⎈⍳⍨⍭⍦ ⍙⍭ ⍙⍱⎈⍧⍨⍯⎊⍫⍙⍦⍮ ⍳⍧⍙⍳ ⍉⍮⎊⍲ ⍭⍮⍳ ⎈⍮⍱⍱⎊⍲⍯⍮⍭⍉',
    category: 'Forbidden Archives',
    sellerAlias: 'VOID CARTOGRAPHER',
    startingBid: 440000,
    decryptionKey: 'secret',
    imageUrl: img(0),
  },
  {
    id: 'pool_14',
    originalTitle: 'Aetheric Resonance Fork',
    alternateName: 'The Tuning Instrument',
    cipherTitle: '⍙⎊⍳⍧⎊⍱⍨⎈ ⍱⎊⍲⍮⍭⍙⍭⎈⎊ ⍝⍮⍱⍪',
    originalDescription:
      'A two-pronged instrument of unknown alloy that, when struck, produces a tone at 432Hz — then holds it indefinitely without decay. A second tone at 528Hz begins after 33 seconds, producing a harmonic convergence associated with third-degree lodge ceremonies.',
    cipherDescription:
      '⍙ ⍳⍶⍮-⍯⍱⍮⍭⍦⎊⍉ ⍨⍭⍲⍳⍱⍴⍬⎊⍭⍳ ⍮⍝ ⍴⍭⍪⍭⍮⍶⍭ ⍙⍫⍫⍮⍸ ⍳⍧⍙⍳ ⍧⍮⍫⍉⍲ ⍙ ⍳⍮⍭⎊ ⍨⍭⍉⎊⍝⍨⍭⍨⍳⎊⍫⍸',
    category: 'Relics',
    sellerAlias: 'HARMONIC GHOST',
    startingBid: 210000,
    decryptionKey: 'secret',
    imageUrl: img(1),
  },
  {
    id: 'pool_15',
    originalTitle: 'Nullified Key of the Inner Chamber',
    cipherTitle: '⍭⍴⍫⍫⍨⍝⍨⎊⍉ ⍪⎊⍸ ⍮⍝ ⍳⍧⎊ ⍨⍭⍭⎊⍱ ⎈⍧⍙⍬⍦⎊⍱',
    originalDescription:
      'A physical key that has been ceremonially voided — struck three times with a ritual hammer and submerged in salt water for 40 days. Possession grants access to the pre-nullification records of the chamber it once opened.',
    cipherDescription:
      '⍙ ⍯⍧⍸⍲⍨⎈⍙⍫ ⍪⎊⍸ ⍳⍧⍙⍳ ⍧⍙⍲ ⍦⎊⎊⍭ ⎈⎊⍱⎊⍬⍮⍭⍨⍙⍫⍫⍸ ⍵⍮⍨⍉⎊⍉ ⍙⍭⍉ ⍲⍴⍦⍬⎊⍱⍦⎊⍉',
    category: 'Cipher Keys',
    sellerAlias: 'SEALED WARDEN',
    startingBid: 130000,
    decryptionKey: 'secret',
    imageUrl: img(2),
  },
  {
    id: 'pool_16',
    originalTitle: 'Covenant of the Eclipse Vow',
    cipherTitle: '⎈⍮⍵⎊⍭⍙⍭⍳ ⍮⍝ ⍳⍧⎊ ⎊⎈⍫⍨⍯⍲⎊ ⍵⍮⍶',
    originalDescription:
      'A binding agreement between the Inner Sanctum and a third party redacted in all copies. Terms include a reciprocal silence clause and a 72-year automatic renewal. Current active cycle: 2019–2091.',
    cipherDescription:
      '⍙ ⍦⍨⍭⍉⍨⍭⍦ ⍙⍦⍱⎊⎊⍬⎊⍭⍳ ⍦⎊⍳⍶⎊⎊⍭ ⍳⍧⎊ ⍨⍭⍭⎊⍱ ⍲⍙⍭⎈⍳⍴⍬ ⍙⍭⍉ ⍙ ⍱⎊⍉⍙⎈⍳⎊⍉ ⍳⍧⍨⍱⍉ ⍯⍙⍱⍳⍸',
    category: 'Black Ledger',
    sellerAlias: 'PENUMBRA BROKER',
    startingBid: 580000,
    decryptionKey: 'secret',
    imageUrl: img(3),
  },
  {
    id: 'pool_17',
    originalTitle: 'Prophetic Scroll: Event Horizon',
    cipherTitle: '⍯⍱⍮⍯⍧⎊⍳⍨⎈ ⍲⎈⍱⍮⍫⍫ ⎊⍵⎊⍭⍳ ⍧⍮⍱⍨⎈⍮⍭',
    originalDescription:
      'A 3-metre vellum scroll in near-perfect condition. The text describes a sequence of geopolitical events in chronological order. The last confirmed event described occurred in October 2024. Sixteen entries remain.',
    cipherDescription:
      '⍙ ⍵⎊⍫⍫⍴⍬ ⍲⎈⍱⍮⍫⍫ ⍉⎊⍲⎈⍱⍨⍦⎊⍲ ⍦⎊⍮⍯⍮⍫⍨⍳⍨⎈⍙⍫ ⎊⍵⎊⍭⍳⍲ ⍨⍭ ⎈⍧⍱⍮⍭⍮⍫⍮⍦⍨⎈⍙⍫ ⍮⍱⍉⎊⍱',
    category: 'Oracular Signals',
    sellerAlias: 'FARSEER NODE',
    startingBid: 1400000,
    decryptionKey: 'secret',
    imageUrl: img(4),
  },
  {
    id: 'pool_18',
    originalTitle: "Initiator's Hood — Solstice Grade",
    cipherTitle: '⍨⍭⍨⍳⍨⍙⍳⍮⍱⍲ ⍧⍮⍮⍉ ⍲⍮⍫⍲⍳⍨⎈⎊ ⍦⍱⍙⍉⎊',
    originalDescription:
      'Full-length ceremonial hood worn by the presiding Initiator at the Winter Solstice elevation. Hand-sewn from blackout silk with embroidered sigils corresponding to each degree. The stitching on the left temple contains an encoded name.',
    cipherDescription:
      '⍝⍴⍫⍫-⍫⎊⍭⍦⍳⍧ ⎈⎊⍱⎊⍬⍮⍭⍨⍙⍫ ⍧⍮⍮⍉ ⍶⍮⍱⍭ ⍦⍸ ⍳⍧⎊ ⍯⍱⎊⍲⍨⍉⍨⍭⍦ ⍨⍭⍨⍳⍨⍙⍳⍮⍱',
    category: 'Initiation Artifacts',
    sellerAlias: 'TWILIGHT USHER',
    startingBid: 88000,
    decryptionKey: 'secret',
    imageUrl: img(5),
  },
  {
    id: 'pool_19',
    originalTitle: 'Forbidden Treatise on Signal Ghosts',
    cipherTitle: '⍝⍮⍱⍦⍨⍉⍉⎊⍭ ⍳⍱⎊⍙⍳⍨⍲⎊ ⍮⍭ ⍲⍨⍦⍭⍙⍫ ⍦⍧⍮⍲⍳⍲',
    originalDescription:
      'A 77-page internal document from a signals intelligence division — author and originating agency unknown. Details persistent anomalous transmissions on frequencies that do not appear in any public spectrum allocation chart.',
    cipherDescription:
      '⍙ ⍲⎊⍵⎊⍭⍳⍸-⍲⎊⍵⎊⍭ ⍯⍙⍦⎊ ⍉⍮⎈⍴⍬⎊⍭⍳ ⍝⍱⍮⍬ ⍙ ⍲⍨⍦⍭⍙⍫⍲ ⍨⍭⍳⎊⍫⍫⍨⍦⎊⍭⎈⎊ ⍉⍨⍵⍨⍲⍨⍮⍭',
    category: 'Forbidden Archives',
    sellerAlias: 'PHANTOM ARCHIVIST',
    startingBid: 270000,
    decryptionKey: 'secret',
    imageUrl: img(0),
  },
  {
    id: 'pool_20',
    originalTitle: 'Sigil Stone of the Wandering Lodge',
    alternateName: 'The Vagrant Mark',
    cipherTitle: '⍲⍨⍦⍨⍫ ⍲⍳⍮⍭⎊ ⍮⍝ ⍳⍧⎊ ⍶⍙⍭⍉⎊⍱⍨⍭⍦ ⍫⍮⍉⍦⎊',
    originalDescription:
      'A palm-sized heliodor crystal carved with a nine-point sigil used by a lodge with no fixed address. The lodge convenes at a different location each solstice. Holder of this stone receives an invitation fourteen days prior.',
    cipherDescription:
      '⍙ ⍯⍙⍫⍬-⍲⍨⎈⎊⍉ ⍧⎊⍫⍨⍮⍉⍮⍱ ⎈⍱⍸⍲⍳⍙⍫ ⎈⍙⍱⍵⎊⍉ ⍶⍨⍳⍧ ⍙ ⍭⍨⍭⎊-⍯⍮⍨⍭⍳ ⍲⍨⍦⍨⍫ ⍝⍮⍱ ⍙ ⍫⍮⍉⍦⎊ ⍶⍨⍳⍧ ⍭⍮ ⍝⍨⍷⎊⍉ ⍙⍉⍉⍱⎊⍲⍲',
    category: 'Relics',
    sellerAlias: 'DRIFTING ORDER',
    startingBid: 310000,
    decryptionKey: 'secret',
    imageUrl: img(1),
  },
];

// ── Activation helpers ─────────────────────────────────────────────────────────

const MIN_DURATION_MS = 2 * 60 * 1000;  // 2 min
const MAX_DURATION_MS = 5 * 60 * 1000;  // 5 min

function randomDuration(): number {
  return MIN_DURATION_MS + Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS);
}

// Give each item a staggered start so they don't all expire at once
function activateItem(base: PoolBase, staggerMs = 0): VaultItem {
  const now = Date.now();
  return {
    ...base,
    currentPrice: base.startingBid,
    highestBid: base.startingBid,
    bids: [],
    endsAt: now + randomDuration() + staggerMs,
    openedAt: now,
    priceOpenedAt: base.startingBid,
  };
}

// ── Active items ───────────────────────────────────────────────────────────────

const ACTIVE_KEY = 'arcadia_vault_active';

export const getActiveVaultItems = (): VaultItem[] => {
  const now = Date.now();
  const raw = localStorage.getItem(ACTIVE_KEY);
  let active: VaultItem[] = raw ? JSON.parse(raw) : [];

  // Remove expired
  active = active.filter(i => i.endsAt > now);

  // On first load (or full expiry), activate all 20 pool items with staggered timers
  if (active.length === 0) {
    const shuffled = [...VAULT_ITEM_POOL].sort(() => Math.random() - 0.5);
    active = shuffled.map((base, idx) => activateItem(base, idx * 12000)); // 12s stagger
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    return active;
  }

  // For each expired item, replace it with a random pool item (fresh instance, reset state)
  const activePoolIds = new Set(active.map(i => i.id));
  const available = VAULT_ITEM_POOL.filter(p => !activePoolIds.has(p.id));

  // Determine how many items expired since last check
  const expiredCount = VAULT_ITEM_POOL.length - active.length;
  for (let i = 0; i < expiredCount; i++) {
    let replacement: PoolBase;
    if (available.length > 0) {
      // Pick a truly random item from those not currently shown
      const idx = Math.floor(Math.random() * available.length);
      replacement = available.splice(idx, 1)[0];
    } else {
      // All pool items are active — pick any random pool item and restart it fresh
      replacement = VAULT_ITEM_POOL[Math.floor(Math.random() * VAULT_ITEM_POOL.length)];
    }
    active.push(activateItem(replacement));
  }

  localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
  return active;
};

export const refreshVaultRotation = (): VaultItem[] => {
  localStorage.removeItem(ACTIVE_KEY);
  return getActiveVaultItems();
};

export const saveActiveVaultItems = (items: VaultItem[]) => {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(items));
};

export const placeVaultBid = (lotId: string, bid: Omit<Bid, 'id' | 'timestamp'>): VaultItem[] => {
  const items = getActiveVaultItems();
  const idx = items.findIndex(i => i.id === lotId);
  if (idx === -1) return items;

  const newBid: Bid = { ...bid, id: 'vbid_' + Date.now(), timestamp: Date.now() };
  items[idx].bids = [newBid, ...(items[idx].bids ?? [])];
  items[idx].highestBid = Math.max(items[idx].highestBid, bid.amount);
  items[idx].currentPrice = items[idx].highestBid;

  saveActiveVaultItems(items);
  return items;
};

// ── Chat ───────────────────────────────────────────────────────────────────────

const chatKey = (lotId: string) => `arcadia_vault_chat_${lotId}`;

export const getVaultChat = (lotId: string): VaultChat[] => {
  const raw = localStorage.getItem(chatKey(lotId));
  return raw ? JSON.parse(raw) : [];
};

export const saveVaultChat = (lotId: string, msg: VaultChat) => {
  const msgs = getVaultChat(lotId);
  localStorage.setItem(chatKey(lotId), JSON.stringify([msg, ...msgs]));
};

// ── Credits ────────────────────────────────────────────────────────────────────

const CREDITS_KEY = 'arcadia_vault_credits';
const STARTING_CREDITS = 2_000_000 + Math.floor(Math.random() * 3_000_000);

export const getCredits = (): number => {
  const raw = localStorage.getItem(CREDITS_KEY);
  if (raw === null) {
    localStorage.setItem(CREDITS_KEY, String(STARTING_CREDITS));
    return STARTING_CREDITS;
  }
  return parseInt(raw, 10);
};

export const deductCredits = (amount: number): number => {
  const current = getCredits();
  const next = Math.max(0, current - amount);
  localStorage.setItem(CREDITS_KEY, String(next));
  return next;
};

// ── NDA ────────────────────────────────────────────────────────────────────────

const NDA_KEY = 'arcadia_vault_nda';
export const hasAcceptedNDA = (): boolean => localStorage.getItem(NDA_KEY) === '1';
export const acceptNDA = () => localStorage.setItem(NDA_KEY, '1');

// ── Category colours ───────────────────────────────────────────────────────────

export const CATEGORY_STYLES: Record<string, { badge: string; border: string; glow: string }> = {
  'Relics':                { badge: 'text-amber-400 bg-amber-950/30 border-amber-900/40',    border: 'border-amber-900/20',   glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]' },
  'Cipher Keys':           { badge: 'text-cyan-400 bg-cyan-950/30 border-cyan-900/40',       border: 'border-cyan-900/20',    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.15)]' },
  'Black Ledger':          { badge: 'text-red-400 bg-red-950/30 border-red-900/40',          border: 'border-red-900/20',     glow: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]' },
  'Oracular Signals':      { badge: 'text-purple-400 bg-purple-950/30 border-purple-900/40', border: 'border-purple-900/20',  glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]' },
  'Initiation Artifacts':  { badge: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40', border: 'border-emerald-900/20', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]' },
  'Forbidden Archives':    { badge: 'text-orange-400 bg-orange-950/30 border-orange-900/40', border: 'border-orange-900/20',  glow: 'shadow-[0_0_12px_rgba(249,115,22,0.15)]' },
};
