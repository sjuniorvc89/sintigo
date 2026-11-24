import { AppSettings, CourseModule, ErrorLogItem, QuestionItem, UserStats } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'migolab_settings_v1',
  STATS: 'migolab_stats_v1',
  MODULES: 'migolab_modules_v1',
  ERROR_LOG: 'migolab_error_log_v1',
  CUSTOM_QUESTIONS: 'migolab_custom_questions_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-1.5-flash',
  personality: 'sarcastico_brutal',
  autoSpeakQuestions: true,
  soundEffects: true,
  voicePitch: 1.15,
  voiceRate: 1.05,
  selectedVoiceURI: '',
  sarcasmPreset: 'teatral',
  ttsProvider: 'browser',
  enableHumanInterjections: true,
};

export const INITIAL_MODULES: CourseModule[] = [
  {
    id: 'ingles_conversacional',
    title: 'Inglés Conversacional: Tiempos y Vida Real',
    subtitle: 'Pregunta en español → Habla en inglés',
    description: 'Enfrenta situaciones cotidianas: restaurantes, viajes y anécdotas en pasado y presente continuo.',
    icon: 'MessageCircle',
    badge: 'Popular',
    languageQuestion: 'es-ES',
    languageAnswer: 'en-US',
    totalLessons: 10,
    completedLessons: 0,
    consecutiveErrors: 0,
    isGatekeepingActive: false,
    gatekeepingStreakRequired: 2,
    gatekeepingCurrentStreak: 0,
  },
  {
    id: 'ingles_supervivencia',
    title: 'Inglés de Supervivencia: Entrevistas y Trabajo',
    subtitle: '100% Inmersivo en inglés (Q&A en inglés)',
    description: 'Defiende tu currículum, resuelve objeciones de clientes y habla con soltura corporativa.',
    icon: 'Briefcase',
    badge: 'Desafiante',
    languageQuestion: 'en-US',
    languageAnswer: 'en-US',
    totalLessons: 8,
    completedLessons: 0,
    consecutiveErrors: 0,
    isGatekeepingActive: false,
    gatekeepingStreakRequired: 2,
    gatekeepingCurrentStreak: 0,
  },
  {
    id: 'matematicas_logica',
    title: 'Fundamentos de Matemáticas y Lógica',
    subtitle: 'Razonamiento conceptual explicado en voz alta',
    description: 'Explica con tus propias palabras teoremas, deducciones lógicas y trucos de cálculo mental.',
    icon: 'Binary',
    badge: 'Lógica',
    languageQuestion: 'es-ES',
    languageAnswer: 'es-ES',
    totalLessons: 8,
    completedLessons: 0,
    consecutiveErrors: 0,
    isGatekeepingActive: false,
    gatekeepingStreakRequired: 2,
    gatekeepingCurrentStreak: 0,
  },
  {
    id: 'tema_libre',
    title: 'Tema Libre / Apuntes Personalizados',
    subtitle: 'Pega tus apuntes y la IA te interrogará',
    description: 'Genera simulacros orales instantáneos para cualquier materia o examen que tengas que rendir.',
    icon: 'Sparkles',
    badge: 'Custom IA',
    languageQuestion: 'es-ES',
    languageAnswer: 'es-ES',
    totalLessons: 6,
    completedLessons: 0,
    consecutiveErrors: 0,
    isGatekeepingActive: false,
    gatekeepingStreakRequired: 2,
    gatekeepingCurrentStreak: 0,
    isCustom: true,
    customTopicText: 'Historia de la computación y arquitectura de sistemas distribuidos.',
  },
];

export const INITIAL_STATS: UserStats = {
  streak: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  xp: 140,
  totalAnswered: 8,
  totalCorrect: 6,
};

export const INITIAL_ERROR_LOG: ErrorLogItem[] = [
  {
    id: 'err_demo_1',
    timestamp: Date.now() - 3600000,
    moduleId: 'ingles_conversacional',
    moduleTitle: 'Inglés Conversacional: Tiempos y Vida Real',
    question: 'Dile al camarero: "Ayer pedí una ensalada pero no la he recibido todavía".',
    userAnswer: 'Yesterday I order a salad but I didn\'t received it yet',
    replicaSarcastica: '¡Vaya! Rompiste dos reglas gramaticales en solo nueve palabras. ¿Te cobran por conjugar verbos en pasado?',
    explicacionPorQue: 'Usaste "order" en presente en lugar de "ordered", y pusiste "didn\'t received" con pasado doble; el auxiliar "did" ya absorbe el pasado, por lo que el verbo principal debe ir en infinitivo ("receive").',
    respuestaCorrectaModelo: 'Yesterday I ordered a salad, but I haven\'t received it yet.',
    categoriaError: 'Tiempo verbal',
    practiced: false,
  }
];

export const storageService = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },

  getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? { ...INITIAL_STATS, ...JSON.parse(data) } : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  },

  saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Error saving stats', e);
    }
  },

  getModules(): CourseModule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MODULES);
      return data ? JSON.parse(data) : INITIAL_MODULES;
    } catch {
      return INITIAL_MODULES;
    }
  },

  saveModules(modules: CourseModule[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    } catch (e) {
      console.error('Error saving modules', e);
    }
  },

  getErrorLog(): ErrorLogItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ERROR_LOG);
      return data ? JSON.parse(data) : INITIAL_ERROR_LOG;
    } catch {
      return INITIAL_ERROR_LOG;
    }
  },

  saveErrorLog(log: ErrorLogItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ERROR_LOG, JSON.stringify(log));
    } catch (e) {
      console.error('Error saving error log', e);
    }
  },

  addErrorLog(item: Omit<ErrorLogItem, 'id' | 'timestamp' | 'practiced'>): ErrorLogItem {
    const list = this.getErrorLog();
    const newItem: ErrorLogItem = {
      ...item,
      id: 'err_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      practiced: false,
    };
    list.unshift(newItem);
    this.saveErrorLog(list.slice(0, 100)); // Keep up to 100 errors
    return newItem;
  },

  markErrorAsPracticed(id: string): void {
    const list = this.getErrorLog().map((item) =>
      item.id === id ? { ...item, practiced: true } : item
    );
    this.saveErrorLog(list);
  },

  clearErrorLog(): void {
    this.saveErrorLog([]);
  },

  getCustomQuestions(): Record<string, QuestionItem[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_QUESTIONS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveCustomQuestions(map: Record<string, QuestionItem[]>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_QUESTIONS, JSON.stringify(map));
    } catch (e) {
      console.error('Error saving custom questions', e);
    }
  },

  addCustomQuestions(moduleId: string, questions: QuestionItem[]): void {
    const map = this.getCustomQuestions();
    const existing = map[moduleId] || [];
    map[moduleId] = [...existing, ...questions];
    this.saveCustomQuestions(map);
  }
};
