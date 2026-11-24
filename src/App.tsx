import React, { useState, useEffect, useRef } from 'react';
import {
  AppSettings,
  AppTheme,
  CourseModule,
  ErrorLogItem,
  QuestionItem,
  UserStats,
} from './types';
import { storageService } from './services/storageService';
import { speechService } from './services/speechService';
import { geminiService } from './services/geminiService';
import { HeaderStats } from './components/HeaderStats';
import { LessonMap } from './components/LessonMap';
import { VoiceEvaluator } from './components/VoiceEvaluator';
import { ErrorLogDrawer } from './components/ErrorLogDrawer';
import { SettingsModal } from './components/SettingsModal';
import { CustomTopicModal } from './components/CustomTopicModal';
import { ImportModal } from './components/ImportModal';
import { AddTopicModal } from './components/AddTopicModal';
import { EditTopicModal } from './components/EditTopicModal';
import { AlertTriangle, Key, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // App persistent states
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [stats, setStats] = useState<UserStats>(() => storageService.getStats());
  const [modules, setModules] = useState<CourseModule[]>(() => storageService.getModules());
  const [errorLog, setErrorLog] = useState<ErrorLogItem[]>(() => storageService.getErrorLog());

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<AppTheme>(() => settings.theme || 'dark');

  // Scroll ref to immediately center on quiz when module is clicked
  const quizRef = useRef<HTMLDivElement>(null);

  // Active navigation: null on initial load so user chooses module first!
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Modals & Drawers
  const [isErrorLogOpen, setIsErrorLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomTopicOpen, setIsCustomTopicOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // Remediation forced question from Error Log
  const [forcedQuestion, setForcedQuestion] = useState<QuestionItem | null>(null);

  // Browser check
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  useEffect(() => {
    setIsSpeechSupported(speechService.isRecognitionSupported());
    const storedCustomQuestions = storageService.getCustomQuestions();
    Object.entries(storedCustomQuestions).forEach(([modId, qs]) => {
      geminiService.addCustomQuestions(modId, qs);
    });
  }, []);

  // Sync theme class to <html> and <body>
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('theme-light');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('theme-light');
      document.body.classList.add('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const updatedSettings = { ...settings, theme: nextTheme };
    setSettings(updatedSettings);
    storageService.saveSettings(updatedSettings);
  };

  const handleSelectModule = (mod: CourseModule) => {
    setActiveModuleId(mod.id);
    setForcedQuestion(null);
    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeModule = activeModuleId ? modules.find((m) => m.id === activeModuleId) || null : null;

  const handleStatsUpdate = (newStats: UserStats) => {
    setStats(newStats);
    storageService.saveStats(newStats);
  };

  const handleModuleUpdate = (updatedModule: CourseModule) => {
    const updatedList = modules.map((m) => (m.id === updatedModule.id ? updatedModule : m));
    setModules(updatedList);
    storageService.saveModules(updatedList);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    if (newSettings.theme && newSettings.theme !== theme) {
      setTheme(newSettings.theme);
    }
  };

  const handleErrorLogged = (err: Omit<ErrorLogItem, 'id' | 'timestamp' | 'practiced'>) => {
    const item = storageService.addErrorLog(err);
    setErrorLog([item, ...errorLog]);
  };

  const handleClearErrorLog = () => {
    storageService.clearErrorLog();
    setErrorLog([]);
  };

  const handlePracticeError = (errItem: ErrorLogItem, question: QuestionItem) => {
    // Mark as practiced
    storageService.markErrorAsPracticed(errItem.id);
    setErrorLog(storageService.getErrorLog());

    // Switch to module if needed and scroll
    setActiveModuleId(errItem.moduleId);
    setForcedQuestion(question);
    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveCustomTopic = (topicText: string) => {
    const updated = modules.map((m) =>
      m.id === 'tema_libre' ? { ...m, customTopicText: topicText } : m
    );
    setModules(updated);
    storageService.saveModules(updated);
    setActiveModuleId('tema_libre');
    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuestionsImported = (
    importedQuestions: QuestionItem[],
    targetModuleId: string,
    customModuleName?: string
  ) => {
    let finalModuleId = targetModuleId;

    if (customModuleName && customModuleName.trim()) {
      finalModuleId = 'mod_' + Date.now();
      const newModule: CourseModule = {
        id: finalModuleId,
        title: customModuleName.trim(),
        subtitle: `Módulo con ${importedQuestions.length} preguntas importadas`,
        description: `Preguntas cargadas desde documento externo`,
        icon: 'BookOpen',
        badge: 'Personalizado',
        languageQuestion: importedQuestions[0]?.prompt.includes('¿') ? 'es-ES' : 'en-US',
        languageAnswer: importedQuestions[0]?.languageToListen || 'es-ES',
        totalLessons: Math.max(importedQuestions.length, 5),
        completedLessons: 0,
        consecutiveErrors: 0,
        isGatekeepingActive: false,
        gatekeepingStreakRequired: 2,
        gatekeepingCurrentStreak: 0,
        isCustom: true,
      };
      const updated = [...modules, newModule];
      setModules(updated);
      storageService.saveModules(updated);
      setActiveModuleId(finalModuleId);
    }

    // Persist imported questions into localStorage and Gemini runtime
    storageService.addCustomQuestions(finalModuleId, importedQuestions);
    geminiService.addCustomQuestions(finalModuleId, importedQuestions);

    if (importedQuestions.length > 0) {
      setForcedQuestion(importedQuestions[0]);
    }

    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddTopic = (newModule: CourseModule, initialQuestions: QuestionItem[]) => {
    const updated = [...modules, newModule];
    setModules(updated);
    storageService.saveModules(updated);
    setActiveModuleId(newModule.id);

    if (initialQuestions.length > 0) {
      storageService.addCustomQuestions(newModule.id, initialQuestions);
      geminiService.addCustomQuestions(newModule.id, initialQuestions);
      setForcedQuestion(initialQuestions[0]);
    }

    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteTopic = (moduleId: string) => {
    if (modules.length <= 1) {
      alert('Debes mantener al menos un tema activo en la aplicación.');
      return;
    }
    const updated = modules.filter((m) => m.id !== moduleId);
    setModules(updated);
    storageService.saveModules(updated);

    if (activeModuleId === moduleId) {
      setActiveModuleId(updated[0].id);
      setForcedQuestion(null);
    }
  };

  const handleOpenEditTopic = (mod: CourseModule) => {
    setEditingModuleId(mod.id);
    setIsEditTopicOpen(true);
  };

  const handleTopicUpdated = (updatedModule: CourseModule, updatedQuestions: QuestionItem[]) => {
    const updatedModules = modules.map((m) =>
      m.id === updatedModule.id ? updatedModule : m
    );
    setModules(updatedModules);
    storageService.saveModules(updatedModules);

    // If active module is the one updated, update the questions immediately
    if (activeModuleId === updatedModule.id && updatedQuestions.length > 0) {
      setForcedQuestion(updatedQuestions[0]);
    }
  };

  const unpracticedCount = errorLog.filter((e) => !e.practiced).length;

  return (
    <div className={`app-layout bg-aurora ${theme === 'light' ? 'theme-light text-slate-900' : 'text-slate-100'}`}>
      {/* Top Navigation */}
      <HeaderStats
        stats={stats}
        personality={settings.personality}
        settings={settings}
        unpracticedErrorsCount={unpracticedCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenErrorLog={() => setIsErrorLogOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCustomTopic={() => setIsCustomTopicOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-8 py-4 pb-8 space-y-5">

        {/* Browser Compatibility Alert */}
        {!isSpeechSupported && (
          <div className="p-3.5 rounded-2xl flex items-start gap-3"
            style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
              <p className="font-bold">Aviso de compatibilidad:</p>
              <p className="mt-0.5 opacity-90">
                Para la mejor experiencia, abre esta app en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Free API Key Banner */}
        {!settings.apiKey && (
          <div
            className="p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card"
            style={{
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Modo Semántico Local Activo</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Conecta tu API Key gratuita de <strong>Google Gemini</strong> o <strong>Groq</strong> para activar IA profunda.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', boxShadow: '0 6px 20px var(--accent-glow)' }}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Conectar API Gratis</span>
            </button>
          </div>
        )}

        {/* Voice Evaluator (main quiz area) centered with scroll anchor */}
        <section
          ref={quizRef}
          id="quiz-stage"
          className="scroll-mt-20 transition-all duration-300"
          aria-label="Área de quiz interactivo"
        >
          <VoiceEvaluator
            activeModule={activeModule}
            settings={settings}
            stats={stats}
            recentErrors={errorLog}
            onStatsUpdate={handleStatsUpdate}
            onModuleUpdate={handleModuleUpdate}
            onErrorLogged={handleErrorLogged}
            onOpenSettings={() => setIsSettingsOpen(true)}
            forcedQuestion={forcedQuestion}
            onClearForcedQuestion={() => setForcedQuestion(null)}
            onSelectModule={handleSelectModule}
            availableModules={modules}
          />
        </section>

        {/* Lesson Map */}
        <section id="lesson-map-section" aria-label="Rutas y módulos de estudio">
          <LessonMap
            modules={modules}
            activeModuleId={activeModuleId || ''}
            onSelectModule={handleSelectModule}
            onOpenCustomTopic={() => setIsCustomTopicOpen(true)}
            onOpenAddTopic={() => setIsAddTopicOpen(true)}
            onEditModule={handleOpenEditTopic}
            onDeleteModule={handleDeleteTopic}
            scrollTargetRef={quizRef}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-[11px] text-slate-600"
        style={{ borderTop: '1px solid rgba(30,45,74,0.4)' }}>
        <p>MigoLab • Tutor Interactivo con IA Sarcástica • 100% Gratuito</p>
      </footer>

      {/* Cuaderno de Meteduras de Pata (Error Log Drawer) */}
      <ErrorLogDrawer
        isOpen={isErrorLogOpen}
        errors={errorLog}
        onClose={() => setIsErrorLogOpen(false)}
        onClearErrors={handleClearErrorLog}
        onPracticeError={handlePracticeError}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Custom Topic Modal */}
      <CustomTopicModal
        isOpen={isCustomTopicOpen}
        currentText={
          modules.find((m) => m.id === 'tema_libre')?.customTopicText || ''
        }
        onClose={() => setIsCustomTopicOpen(false)}
        onSave={handleSaveCustomTopic}
      />

      {/* Import Questions Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        modules={modules}
        activeModuleId={activeModuleId || modules[0]?.id || ''}
        onClose={() => setIsImportModalOpen(false)}
        onQuestionsImported={handleQuestionsImported}
      />

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
        onAddTopic={handleAddTopic}
      />

      {/* Edit Topic Modal */}
      <EditTopicModal
        isOpen={isEditTopicOpen}
        modules={modules}
        initialModuleId={editingModuleId}
        onClose={() => setIsEditTopicOpen(false)}
        onTopicUpdated={handleTopicUpdated}
        apiKey={settings.apiKey}
        provider={settings.provider}
        model={settings.model}
      />
    </div>
  );
};

export default App;
