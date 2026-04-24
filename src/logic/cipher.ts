const CHAR_MAP: Record<string, string> = {
  'a': '⍙', 'b': '⍦', 'c': '⎈', 'd': '⎉', 'e': '⎊', 'f': '⍝', 'g': '⍦', 'h': '⍧',
  'i': '⍨', 'j': '⍩', 'k': '⍪', 'l': '⍫', 'm': '⍬', 'n': '⍭', 'o': '⍮', 'p': '⍯',
  'q': '⍰', 'r': '⍱', 's': '⍲', 't': '⍳', 'u': '⍴', 'v': '⍵', 'w': '⍶', 'x': '⍷',
  'y': '⍸', 'z': '⍹', ' ': ' ', '1': '◴', '2': '◵', '3': '◶', '4': '◷', '5': '◰',
  '6': '◱', '7': '◲', '8': '◳', '9': '◨', '0': '◩', '\n': '\n'
};

const SYMBOL_MAP: Record<string, string> = {
  park: "🌿", lake: "🌊", palace: "🏛️", garden: "🌹", meeting: "🜁",
  tomorrow: "⏳", night: "🌙", urgent: "🔺", hidden: "🗝️", circle: "👁️",
  crystal: "💎", retiro: "🌳", meet: "🜁", the: "▪️", in: "▪️",
  at: "▪️", a: "▪️", to: "▪️", of: "▪️", and: "▪️",
  oblivion: "🌑", secret: "🌑", password: "🔑", vial: "🧪", rain: "🌧️"
};

export const encodeCipher = (text: string): string => {
  return text.toLowerCase().split('').map(char => CHAR_MAP[char] || '⎔').join('');
};

export const encodeForumCipher = (text: string): string => {
  const words = text.toLowerCase().replace(/[.,!?]/g, '').split(' ');
  return words.map(w => SYMBOL_MAP[w] || '💠').join(' ');
};

export const extractLocation = (text: string): {loc: string, lat: number, lng: number} => {
    let lat = 0; let lng = 0; let loc = "Coordinates Obscured";
    const t = text.toLowerCase();
    if (t.includes("palace") || t.includes("retiro")) {
      loc = "Crystal Palace, Retiro Park"; lat = 40.4138; lng = -3.6824;
    } else if (t.includes("park")) {
      loc = "Central Park Meeting Point"; lat = 40.7812; lng = -73.9665;
    } else if (t.includes("lake")) {
      loc = "The Serpentine Lake"; lat = 51.5055; lng = -0.1656;
    }
    return { loc, lat, lng };
}
