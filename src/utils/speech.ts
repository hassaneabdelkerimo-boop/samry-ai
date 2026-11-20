// Speech synthesis and recognition helpers for SAMRY AI

export interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  isSupported: boolean;
}

export function detectLanguage(text: string): string {
  // Simple heuristic for Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) {
    return 'ar-SA';
  }
  // Check common English words vs French words
  const englishWords = ['the', 'is', 'and', 'to', 'in', 'that', 'you', 'with', 'what', 'how'];
  const lower = text.toLowerCase();
  const hasEnglish = englishWords.some(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `));
  if (hasEnglish) {
    return 'en-US';
  }
  // Default to French
  return 'fr-FR';
}

export function speakText(
  text: string,
  options?: {
    lang?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Synthèse vocale non supportée sur ce navigateur.');
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean markdown syntax for cleaner audio reading
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' [Bloc de code] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  if (!cleanText) return null;

  const lang = options?.lang || detectLanguage(cleanText);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to pick a natural voice matching the language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium')));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
