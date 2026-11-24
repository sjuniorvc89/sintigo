import { AppSettings, CourseModule, ErrorLogItem, QuestionItem, UserStats } from '../types';
import { CURATED_QUESTIONS, geminiService } from './geminiService';
import { amplifyDataService } from './amplifyDataService';

const STORAGE_KEYS = {
  SETTINGS: 'migolab_settings_v1',
  STATS: 'migolab_stats_v1',
  MODULES: 'migolab_modules_v1',
  ERROR_LOG: 'migolab_error_log_v1',
  CUSTOM_QUESTIONS: 'migolab_custom_questions_v1',
  CLOUD_CONFIG: 'migolab_cloud_config_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.0-flash',
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
  },

  /**
   * Retrieves all questions for a module (either custom saved or built-in curated)
   */
  getQuestionsForModule(moduleId: string): QuestionItem[] {
    const customMap = this.getCustomQuestions();
    if (customMap[moduleId] && customMap[moduleId].length > 0) {
      return customMap[moduleId];
    }
    const builtIn = CURATED_QUESTIONS[moduleId];
    if (builtIn && builtIn.length > 0) {
      return [...builtIn];
    }
    return [];
  },

  /**
   * Overwrites/updates all questions for a specific module
   */
  saveQuestionsForModule(moduleId: string, questions: QuestionItem[]): void {
    const map = this.getCustomQuestions();
    map[moduleId] = [...questions];
    this.saveCustomQuestions(map);
    geminiService.setQuestionsForModule(moduleId, questions);
  },

  /**
   * Updates an existing course module or appends it
   */
  updateModule(updatedModule: CourseModule): void {
    const list = this.getModules();
    const exists = list.some((m) => m.id === updatedModule.id);
    const nextList = exists
      ? list.map((m) => (m.id === updatedModule.id ? updatedModule : m))
      : [...list, updatedModule];
    this.saveModules(nextList);
  },

  /**
   * Generates a complete JSON database dump for backup or AWS Amplify migration
   */
  exportDatabaseBackup(): { filename: string; json: string } {
    const backupData = {
      app: 'MigoLab',
      version: 2,
      exportTimestamp: Date.now(),
      exportDate: new Date().toISOString(),
      modules: this.getModules(),
      customQuestions: this.getCustomQuestions(),
      stats: this.getStats(),
      settings: this.getSettings(),
      errorLog: this.getErrorLog(),
    };

    const json = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `migolab_database_backup_${dateStr}.json`;

    // Trigger browser download
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Could not auto-download JSON file:', e);
    }

    return { filename, json };
  },

  /**
   * Imports and restores the database from a JSON backup file
   */
  importDatabaseBackup(jsonString: string): {
    success: boolean;
    message: string;
    counts?: { modules: number; questions: number; errors: number };
  } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'El archivo JSON no tiene un formato válido.' };
      }

      let restoredModules = 0;
      let restoredQuestions = 0;
      let restoredErrors = 0;

      if (Array.isArray(data.modules)) {
        this.saveModules(data.modules);
        restoredModules = data.modules.length;
      }

      if (data.customQuestions && typeof data.customQuestions === 'object') {
        this.saveCustomQuestions(data.customQuestions);
        Object.entries(data.customQuestions).forEach(([modId, qs]) => {
          if (Array.isArray(qs)) {
            geminiService.setQuestionsForModule(modId, qs as QuestionItem[]);
            restoredQuestions += qs.length;
          }
        });
      }

      if (Array.isArray(data.errorLog)) {
        this.saveErrorLog(data.errorLog);
        restoredErrors = data.errorLog.length;
      }

      if (data.stats && typeof data.stats === 'object') {
        this.saveStats({ ...INITIAL_STATS, ...data.stats });
      }

      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }

      return {
        success: true,
        message: `Base de datos restaurada: ${restoredModules} temas, ${restoredQuestions} preguntas personalizadas y ${restoredErrors} errores.`,
        counts: {
          modules: restoredModules,
          questions: restoredQuestions,
          errors: restoredErrors,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al leer la base de datos: ${err.message || 'Formato JSON corrupto'}`,
      };
    }
  },

  /**
   * Syncs database state with AWS Amplify Gen 2 DynamoDB or a custom Cloud endpoint
   */
  async syncWithCloud(
    endpointUrl?: string,
    apiKey?: string
  ): Promise<{ success: boolean; message: string; updatedRemote?: boolean }> {
    // 1. If Amplify Gen 2 is configured with outputs, sync directly to DynamoDB
    if (amplifyDataService.isConfigured()) {
      const res = await amplifyDataService.syncAllToDynamo(
        this.getModules(),
        this.getCustomQuestions(),
        this.getStats(),
        this.getErrorLog()
      );
      if (res.success) {
        const settings = this.getSettings();
        settings.lastCloudSyncTimestamp = Date.now();
        this.saveSettings(settings);
      }
      return res;
    }

    // 2. Otherwise use the HTTP endpoint if provided
    if (!endpointUrl || !endpointUrl.trim()) {
      return {
        success: false,
        message: 'No se detectó amplify_outputs.json ni se configuró una URL de endpoint en la nube.',
      };
    }

    const payload = {
      app: 'MigoLab',
      clientTimestamp: Date.now(),
      action: 'sync',
      data: {
        modules: this.getModules(),
        customQuestions: this.getCustomQuestions(),
        stats: this.getStats(),
        errorLog: this.getErrorLog(),
      },
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        headers['x-api-key'] = apiKey.trim();
      }

      const res = await fetch(endpointUrl.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor de base de datos (${res.status} ${res.statusText})`);
      }

      const resData = await res.json().catch(() => ({}));

      // Update sync timestamp in settings
      const settings = this.getSettings();
      settings.lastCloudSyncTimestamp = Date.now();
      this.saveSettings(settings);

      // If server returned synced or updated modules/questions, optionally merge
      if (resData.remoteData?.modules && Array.isArray(resData.remoteData.modules)) {
        this.saveModules(resData.remoteData.modules);
      }
      if (resData.remoteData?.customQuestions) {
        this.saveCustomQuestions(resData.remoteData.customQuestions);
      }

      return {
        success: true,
        message: '¡Base de datos sincronizada con éxito en AWS / Nube!',
        updatedRemote: true,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Fallo de sincronización: ${err.message || 'No se pudo contactar el endpoint'}`,
      };
    }
  },

  /**
   * Summary of local & cloud database status
   */
  getDatabaseSummary() {
    const modules = this.getModules();
    const customQuestions = this.getCustomQuestions();
    let totalQuestions = 0;

    // Count questions across all modules
    modules.forEach((m) => {
      if (customMapHasQuestions(customQuestions, m.id)) {
        totalQuestions += customQuestions[m.id].length;
      } else if (CURATED_QUESTIONS[m.id]) {
        totalQuestions += CURATED_QUESTIONS[m.id].length;
      }
    });

    const errorLog = this.getErrorLog();
    const stats = this.getStats();
    const settings = this.getSettings();
    const isAmplifyConnected = amplifyDataService.isConfigured();

    return {
      totalModules: modules.length,
      totalQuestions,
      totalErrors: errorLog.length,
      streak: stats.streak,
      xp: stats.xp,
      isAmplifyConnected,
      hasCloudEndpoint: Boolean(isAmplifyConnected || (settings.cloudDbUrl && settings.cloudDbUrl.trim())),
      cloudDbUrl: settings.cloudDbUrl || '',
      lastSyncTimestamp: settings.lastCloudSyncTimestamp || null,
    };
  },
};

function customMapHasQuestions(map: Record<string, QuestionItem[]>, id: string): boolean {
  return Array.isArray(map[id]) && map[id].length > 0;
}
