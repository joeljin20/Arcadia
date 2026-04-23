const CHAR_MAP: Record<string, string> = {
  'a': '⍙', 'b': '⍦', 'c': '⎈', 'd': '⎉', 'e': '⎊', 'f': '⍝', 'g': '⍦', 'h': '⍧',
  'i': '⍨', 'j': '⍩', 'k': '⍪', 'l': '⍫', 'm': '⍬', 'n': '⍭', 'o': '⍮', 'p': '⍯',
  'q': '⍰', 'r': '⍱', 's': '⍲', 't': '⍳', 'u': '⍴', 'v': '⍵', 'w': '⍶', 'x': '⍷',
  'y': '⍸', 'z': '⍹', ' ': ' ', '1': '◴', '2': '◵', '3': '◶', '4': '◷', '5': '◰',
  '6': '◱', '7': '◲', '8': '◳', '9': '◨', '0': '◩', '\n': '\n'
};

export const encodeCipher = (text: string): string => {
  return text.toLowerCase().split('').map(char => CHAR_MAP[char] || '⎔').join('');
};
