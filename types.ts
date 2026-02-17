
export interface MathStep {
  title: string;
  description: string;
}

export interface MathAnalysis {
  detectedProblem: string;
  mistakeCorrection?: string;
  steps: MathStep[];
  finalAnswer: string;
  voiceOutput: string;
  tips?: string[];
}

export type SupportedLanguage = 'English' | 'Bangla' | 'Hindi' | 'Urdu' | 'Arabic';

// Added UserStatus type to fix missing export error in SubscriptionTab.tsx
export type UserStatus = 'free' | 'premium';

export interface RecentSolution {
  id: string;
  title: string;
  language: SupportedLanguage;
  date: string;
  image: string;
  analysis: MathAnalysis;
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  audio?: Uint8Array;
}
