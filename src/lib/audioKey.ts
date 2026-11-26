/**
 * Every Persian text that can be spoken maps to one audio file: public/audio/<key>.mp3.
 * The key is a hash of the normalised text, shared by the generator script and the app.
 */
export function normSpeech(text: string): string {
  return text.normalize('NFC').replace(/‍/g, '').replace(/\s+/g, ' ').trim()
}

/** cyrb53: a fast 53-bit string hash, written as base-36 (about 10 characters). */
export function audioKey(text: string): string {
  const str = normSpeech(text)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}
