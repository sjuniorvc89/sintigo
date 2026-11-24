export type PersonalityMode = 'ironico_suave' | 'sarcastico_brutal' | 'sargento_estricto' | 'humillacion_epica';

export type MascotMood = 'neutral' | 'escuchando' | 'burlesco' | 'impresionado' | 'pensando';

export type SiguienteAccion = 'avanzar' | 'repetir_frase' | 'repaso_forzado';

export type AIProvider = 'gemini' | 'groq' | 'openrouter';

export interface EvaluationResult {
  es_correcta: boolean;
  puntaje_precision: number; // 0 to 100
  replica_sarcastica: string;
  explicacion_por_que: string;
  respuesta_correcta_modelo: string;
  categoria_error: string;
  siguiente_accion: SiguienteAccion;
}

export interface MultipleChoiceOption {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
  isCorrect: boolean;
  explanationWhy?: string;
}

export interface QuestionItem {
  id: string;
  moduleId: string;
  prompt: string; // The question or instruction from tutor
  context?: string; // Optional background context
  languageToListen: 'en-US' | 'es-ES'; // Expected response language
  difficulty: 'facil' | 'medio' | 'dificil';
  expectedConcept: string;
  acceptedPatterns?: string[]; // Semantic patterns for fallback verification
  options?: MultipleChoiceOption[]; // Multiple choice options
}

export interface CourseModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badge: string;
  languageQuestion: 'es-ES' | 'en-US';
  languageAnswer: 'en-US' | 'es-ES';
  totalLessons: number;
  completedLessons: number;
  consecutiveErrors: number;
  isGatekeepingActive: boolean;
  gatekeepingStreakRequired: number;
  gatekeepingCurrentStreak: number;
  isCustom?: boolean;
  customTopicText?: string;
}

export interface ErrorLogItem {
  id: string;
  timestamp: number;
  moduleId: string;
  moduleTitle: string;
  question: string;
  userAnswer: string;
  replicaSarcastica: string;
  explicacionPorQue: string;
  respuestaCorrectaModelo: string;
  categoriaError: string;
  practiced: boolean;
}

export interface UserStats {
  streak: number;
  lastActiveDate: string;
  xp: number;
  totalAnswered: number;
  totalCorrect: number;
}

export type TTSProvider = 'browser' | 'elevenlabs' | 'openai';

export type AppTheme = 'dark' | 'light';

export interface AppSettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  personality: PersonalityMode;
  autoSpeakQuestions: boolean;
  soundEffects: boolean;
  voicePitch: number;
  voiceRate: number;
  selectedVoiceURI?: string;
  sarcasmPreset?: 'teatral' | 'esceptico' | 'mordaz' | 'personalizado';
  defaultInputMode?: 'voice' | 'multiple_choice';
  ttsProvider?: TTSProvider;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  openAITtsApiKey?: string;
  openAITtsVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  enableHumanInterjections?: boolean;
  theme?: AppTheme;
  // Per-provider API keys
  geminiApiKey?: string;
  groqApiKey?: string;
  openRouterApiKey?: string;
  // Cloud Database & AWS Amplify configuration
  cloudDbUrl?: string;
  cloudDbApiKey?: string;
  autoSyncCloud?: boolean;
  lastCloudSyncTimestamp?: number;
}
