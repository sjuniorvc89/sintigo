import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  Zap,
  Flame,
  Star,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AppSettings,
  CourseModule,
  ErrorLogItem,
  EvaluationResult,
  MascotMood,
  MultipleChoiceOption,
  QuestionItem,
  UserStats,
} from '../types';
import { MascotAvatar } from './MascotAvatar';
import { speechService } from '../services/speechService';
import { geminiService } from '../services/geminiService';
import { soundEffectsService } from '../services/soundEffectsService';

interface VoiceEvaluatorProps {
  activeModule: CourseModule | null;
  settings: AppSettings;
  stats: UserStats;
  recentErrors: ErrorLogItem[];
  onStatsUpdate: (stats: UserStats) => void;
  onModuleUpdate: (module: CourseModule) => void;
  onErrorLogged: (error: Omit<ErrorLogItem, 'id' | 'timestamp' | 'practiced'>) => void;
  onOpenSettings: () => void;
  forcedQuestion?: QuestionItem | null;
  onClearForcedQuestion?: () => void;
  onSelectModule?: (module: CourseModule) => void;
  availableModules?: CourseModule[];
}

/** Floating score particle */
const ScorePop: React.FC<{ value: number; correct: boolean }> = ({ value, correct }) => (
  <div
    className="score-pop absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50 font-black text-2xl"
    style={{ color: correct ? '#10B981' : '#F43F5E' }}
  >
    {correct ? `+${value} XP` : `-0`}
  </div>
);

export const VoiceEvaluator: React.FC<VoiceEvaluatorProps> = ({
  activeModule,
  settings,
  stats,
  recentErrors,
  onStatsUpdate,
  onModuleUpdate,
  onErrorLogged,
  onOpenSettings,
  forcedQuestion,
  onClearForcedQuestion,
  onSelectModule,
  availableModules,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>('neutral');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRepetitionMode, setIsRepetitionMode] = useState<boolean>(false);
  const [mascotAnimKey, setMascotAnimKey] = useState(0);
  const [showScorePop, setShowScorePop] = useState(false);
  const [scorePop, setScorePop] = useState({ value: 0, correct: true });
  const [questionKey, setQuestionKey] = useState(0); // triggers question text re-animation

  const prevModuleIdRef = useRef<string | null>(null);
  const challengeReqId = useRef(0);

  const stateRef = useRef({
    currentQuestion,
    isSpeaking,
    isEvaluating,
    activeModule,
    settings,
    isRepetitionMode,
    evaluationResult,
  });

  useEffect(() => {
    stateRef.current = {
      currentQuestion,
      isSpeaking,
      isEvaluating,
      activeModule,
      settings,
      isRepetitionMode,
      evaluationResult,
    };
  });

  useEffect(() => {
    if (forcedQuestion) {
      stopAllAudio();
      setCurrentQuestion(forcedQuestion);
      setEvaluationResult(null);
      setSelectedOptionId(null);
      setErrorMessage(null);
      setMascotMood('neutral');
      setQuestionKey(k => k + 1);
      if (settings.autoSpeakQuestions && activeModule) {
        speakQuestion(forcedQuestion.prompt, activeModule.languageQuestion);
      }
    }
  }, [forcedQuestion]);

  const stopAllAudio = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };

  const speakQuestion = (text: string, lang: 'es-ES' | 'en-US') => {
    stopAllAudio();
    setIsSpeaking(true);
    setMascotMood('neutral');
    speechService.speak(text, {
      language: lang,
      tone: 'question',
      basePitch: settings.voicePitch,
      baseRate: settings.voiceRate,
      preferredVoiceURI: settings.selectedVoiceURI,
      ttsProvider: settings.ttsProvider,
      elevenLabsApiKey: settings.elevenLabsApiKey,
      elevenLabsVoiceId: settings.elevenLabsVoiceId,
      openAITtsApiKey: settings.openAITtsApiKey,
      openAITtsVoice: settings.openAITtsVoice,
      enableInterjections: false,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleStartChallenge = async (overrideModule?: CourseModule | null) => {
    const targetModule = overrideModule || activeModule;
    if (!targetModule) return;

    const reqId = ++challengeReqId.current;
    stopAllAudio();
    setErrorMessage(null);
    setEvaluationResult(null);
    setSelectedOptionId(null);
    setIsRepetitionMode(false);
    setIsEvaluating(true);
    setMascotMood('pensando');
    if (onClearForcedQuestion) onClearForcedQuestion();
    try {
      const q = await geminiService.generateQuestion({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        module: targetModule,
        recentErrors,
        isReviewMode: targetModule.isGatekeepingActive,
      });

      if (reqId !== challengeReqId.current) return;

      setCurrentQuestion(q);
      setIsEvaluating(false);
      setQuestionKey((k) => k + 1);
      if (settings.autoSpeakQuestions) {
        speakQuestion(q.prompt, targetModule.languageQuestion);
      }
    } catch (err: any) {
      if (reqId !== challengeReqId.current) return;
      setIsEvaluating(false);
      setMascotMood('neutral');
      setErrorMessage(err.message || 'No se pudo generar la pregunta.');
    }
  };

  // Automatically start question ONLY when a module is explicitly selected (never on null initial load)
  useEffect(() => {
    if (!activeModule) {
      prevModuleIdRef.current = null;
      stopAllAudio();
      setCurrentQuestion(null);
      setEvaluationResult(null);
      setSelectedOptionId(null);
      return;
    }

    if (prevModuleIdRef.current !== activeModule.id) {
      prevModuleIdRef.current = activeModule.id;
      stopAllAudio();
      if (!forcedQuestion) {
        handleStartChallenge(activeModule);
      }
    }

    return () => {
      stopAllAudio();
    };
  }, [activeModule?.id, forcedQuestion]);

  const generatePersonalityReplica = (isCorrect: boolean): string => {
    if (isCorrect) {
      if (settings.personality === 'humillacion_epica') {
        const r = [
          '¡Milagro!... Al fin conectaste dos neuronas. Ya empezaba a creer que eras un caso perdido.',
          'Hasta un reloj roto da la hora dos veces al día. No te creas un genio, fue pura suerte.',
          '¡Vaya!... Sobreviviste a una pregunta básica. Te daría una medalla, pero no tengo presupuesto para la mediocridad.',
          'Increíble. Marcaste la opción correcta. Debió ser un espasmo involuntario de tu dedo.',
          'Vaya, parece que hoy decidiste no avergonzar a toda tu especie. Sigue así.',
        ];
        return r[Math.floor(Math.random() * r.length)];
      } else if (settings.personality === 'sarcastico_brutal') {
        return '¡Por fin una neurona conectada! Ya empezaba a temer por el futuro de la humanidad.';
      } else if (settings.personality === 'sargento_estricto') {
        return '¡Correcto! Cumplió con el estándar exacto. No se relaje, soldado.';
      } else {
        return '¡Exacto! Veo que hoy has decidido prestar atención.';
      }
    } else {
      if (settings.personality === 'humillacion_epica') {
        const r = [
          '¿Tienes el cerebro de adorno o lo alquilas los fines de semana? ¡Hasta una tostadora desenchufada pensaría con más coherencia!',
          'Eres la razón por la que el shampoo viene con instrucciones. ¿De verdad marcaste semejante aberración?',
          'Me duelen los circuitos de ver lo que elegiste. Un mono tecleando a ciegas tendría más puntería.',
          '¿Fue un error honesto o decidiste voluntariamente humillar a tu linaje genético con esa respuesta?',
          'Impresionante. Cada día te superas en decepcionarme. Esa opción no tenía ni pies ni cabeza.',
          'Si la ignorancia fuera combustible, tú solo podrías propulsar un cohete a Marte.',
        ];
        return r[Math.floor(Math.random() * r.length)];
      } else if (settings.personality === 'sarcastico_brutal') {
        return 'Elegiste esa opción con una seguridad olímpica. Lástima que esté completamente mal.';
      } else if (settings.personality === 'sargento_estricto') {
        return '¡Negativo! Esa opción es un disparate táctico. Vuelva a la regla básica.';
      } else {
        return 'Casi... pero caíste derechito en la trampa más clásica de la lección.';
      }
    }
  };

  const handleSelectOption = (option: MultipleChoiceOption) => {
    if (isEvaluating || evaluationResult) return;
    stopAllAudio();
    setSelectedOptionId(option.id);
    const currentQ = stateRef.current.currentQuestion;
    if (!currentQ) return;

    const replica = generatePersonalityReplica(option.isCorrect);
    const evalResult: EvaluationResult = {
      es_correcta: option.isCorrect,
      puntaje_precision: option.isCorrect ? 100 : 25,
      replica_sarcastica: replica,
      explicacion_por_que:
        option.explanationWhy ||
        (option.isCorrect ? 'Elección conceptual impecable.' : `La respuesta esperada era: "${currentQ.expectedConcept}".`),
      respuesta_correcta_modelo: currentQ.expectedConcept,
      categoria_error: option.isCorrect ? 'Ninguno' : 'Opción incorrecta',
      siguiente_accion: option.isCorrect ? 'avanzar' : 'repetir_frase',
    };
    applyEvaluationResult(evalResult, option.text, currentQ);
  };

  const applyEvaluationResult = (
    evalRes: EvaluationResult,
    userAnswer: string,
    currentQ: QuestionItem
  ) => {
    if (!activeModule) return;

    setEvaluationResult(evalRes);
    setIsEvaluating(false);
    setMascotAnimKey(k => k + 1);

    const earnedXP = evalRes.es_correcta ? Math.round(evalRes.puntaje_precision / 5) : 2;

    // Score pop
    setScorePop({ value: earnedXP, correct: evalRes.es_correcta });
    setShowScorePop(true);
    setTimeout(() => setShowScorePop(false), 1000);

    if (evalRes.es_correcta) {
      if (settings.soundEffects !== false) soundEffectsService.playSuccessSound();
      setMascotMood('impresionado');
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#6366f1', '#10b981', '#f59e0b', '#c084fc'] });
      } catch {}
    } else {
      if (settings.soundEffects !== false) soundEffectsService.playSarcasticSound();
      setMascotMood('burlesco');
      onErrorLogged({
        moduleId: activeModule.id,
        moduleTitle: activeModule.title,
        question: currentQ.prompt,
        userAnswer,
        replicaSarcastica: evalRes.replica_sarcastica,
        explicacionPorQue: evalRes.explicacion_por_que,
        respuestaCorrectaModelo: evalRes.respuesta_correcta_modelo,
        categoriaError: evalRes.categoria_error,
      });
    }

    const combinedTutorSpeech = `${evalRes.replica_sarcastica} ${evalRes.explicacion_por_que}`;
    setIsSpeaking(true);
    speechService.speak(combinedTutorSpeech, {
      language: activeModule.languageQuestion,
      tone: evalRes.es_correcta ? 'impressed' : 'sarcastic',
      basePitch: settings.voicePitch,
      baseRate: settings.voiceRate,
      preferredVoiceURI: settings.selectedVoiceURI,
      ttsProvider: settings.ttsProvider,
      elevenLabsApiKey: settings.elevenLabsApiKey,
      elevenLabsVoiceId: settings.elevenLabsVoiceId,
      openAITtsApiKey: settings.openAITtsApiKey,
      openAITtsVoice: settings.openAITtsVoice,
      enableInterjections: settings.enableHumanInterjections ?? true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });

    const newTotalAnswered = stats.totalAnswered + 1;
    const newTotalCorrect = stats.totalCorrect + (evalRes.es_correcta ? 1 : 0);
    onStatsUpdate({
      ...stats,
      totalAnswered: newTotalAnswered,
      totalCorrect: newTotalCorrect,
      xp: stats.xp + earnedXP,
      streak: evalRes.es_correcta ? stats.streak + 1 : Math.max(1, stats.streak),
    });

    handleGatekeepingLogic(evalRes, currentQ, userAnswer);
    if (evalRes.siguiente_accion === 'repetir_frase') setIsRepetitionMode(true);
  };

  const replayEvaluationSpeech = () => {
    if (!evaluationResult || !activeModule) return;
    stopAllAudio();
    setIsSpeaking(true);
    setMascotMood(evaluationResult.es_correcta ? 'impresionado' : 'burlesco');
    const combinedTutorSpeech = `${evaluationResult.replica_sarcastica} ${evaluationResult.explicacion_por_que}`;
    speechService.speak(combinedTutorSpeech, {
      language: activeModule.languageQuestion,
      tone: evaluationResult.es_correcta ? 'impressed' : 'sarcastic',
      basePitch: settings.voicePitch,
      baseRate: settings.voiceRate,
      preferredVoiceURI: settings.selectedVoiceURI,
      ttsProvider: settings.ttsProvider,
      elevenLabsApiKey: settings.elevenLabsApiKey,
      elevenLabsVoiceId: settings.elevenLabsVoiceId,
      openAITtsApiKey: settings.openAITtsApiKey,
      openAITtsVoice: settings.openAITtsVoice,
      enableInterjections: settings.enableHumanInterjections ?? true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleGatekeepingLogic = (
    evalRes: EvaluationResult,
    _question: QuestionItem,
    _userAnswer: string
  ) => {
    if (!activeModule) return;
    const updatedModule: CourseModule = { ...activeModule };
    if (evalRes.es_correcta) {
      if (updatedModule.isGatekeepingActive) {
        const nextStreak = updatedModule.gatekeepingCurrentStreak + 1;
        if (nextStreak >= updatedModule.gatekeepingStreakRequired) {
          updatedModule.isGatekeepingActive = false;
          updatedModule.gatekeepingCurrentStreak = 0;
          updatedModule.consecutiveErrors = 0;
        } else {
          updatedModule.gatekeepingCurrentStreak = nextStreak;
        }
      } else {
        updatedModule.consecutiveErrors = 0;
        updatedModule.completedLessons = Math.min(updatedModule.totalLessons, updatedModule.completedLessons + 1);
      }
    } else {
      if (updatedModule.isGatekeepingActive) {
        updatedModule.gatekeepingCurrentStreak = 0;
      } else {
        const nextErrors = updatedModule.consecutiveErrors + 1;
        updatedModule.consecutiveErrors = nextErrors;
        if (nextErrors >= 2) {
          updatedModule.isGatekeepingActive = true;
          updatedModule.gatekeepingCurrentStreak = 0;
        }
      }
    }
    onModuleUpdate(updatedModule);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (stateRef.current.currentQuestion && !stateRef.current.isEvaluating && !stateRef.current.evaluationResult) {
        const k = e.key.toLowerCase();
        let optIndex = -1;
        if (k === '1' || k === 'a') optIndex = 0;
        if (k === '2' || k === 'b') optIndex = 1;
        if (k === '3' || k === 'c') optIndex = 2;
        if (k === '4' || k === 'd') optIndex = 3;
        if (optIndex >= 0) {
          const opts = geminiService.getOrGenerateOptions(stateRef.current.currentQuestion);
          if (opts[optIndex]) { e.preventDefault(); handleSelectOption(opts[optIndex]); return; }
        }
      }
      if (e.code === 'Space' || e.key === 'Enter') {
        if (!stateRef.current.isEvaluating) {
          if (!stateRef.current.currentQuestion || stateRef.current.evaluationResult) {
            e.preventDefault(); handleStartChallenge();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── WELCOME SCREEN WHEN NO MODULE IS SELECTED YET ──
  if (!activeModule) {
    return (
      <div
        className="w-full min-h-[50vh] rounded-3xl relative overflow-hidden transition-all duration-700 bg-aurora flex flex-col items-center justify-center p-6 sm:p-10 text-center glass-card"
        style={{ border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-raised)' }}
      >
        <MascotAvatar
          mood="neutral"
          isSpeaking={false}
          size="lg"
          className="mb-3"
        />

        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-strong)', color: 'var(--accent)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>MigoLab • Tutor Interactivo</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Selecciona un <span className="text-shimmer">módulo</span> para comenzar
          </h2>

          <p className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Elige un tema de estudio abajo para que Migo te plantee preguntas y evalúe tus respuestas con su personalidad{' '}
            <span className={settings.personality === 'humillacion_epica' ? 'text-red-500 font-bold' : 'font-semibold'} style={{ color: settings.personality === 'humillacion_epica' ? undefined : 'var(--accent)' }}>
              {settings.personality === 'humillacion_epica' ? '🔥 roast despiadado' : 'sarcástica'}
            </span>.
          </p>

          {/* Quick Module Selection Chips */}
          {availableModules && availableModules.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {availableModules.slice(0, 4).map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule && onSelectModule(mod)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
                >
                  <span>{mod.title}</span>
                  <ChevronRight className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('lesson-map-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', boxShadow: '0 8px 24px var(--accent-glow)' }}
          >
            <span>Ver temas de estudio abajo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 100;
  const xpForNextLevel = 500;
  const xpProgress = Math.min(100, (stats.xp % xpForNextLevel) / xpForNextLevel * 100);
  const level = Math.floor(stats.xp / xpForNextLevel) + 1;
  const options = currentQuestion ? geminiService.getOrGenerateOptions(currentQuestion) : [];

  const bgClass = evaluationResult
    ? evaluationResult.es_correcta ? 'bg-aurora-success' : 'bg-aurora-error'
    : 'bg-aurora';

  return (
    <div className={`w-full min-h-[75vh] rounded-3xl relative overflow-hidden transition-all duration-700 ${bgClass}`}
      style={{ border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-raised)' }}>

      {/* Ambient blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: evaluationResult?.es_correcta ? 'var(--success-soft)' : evaluationResult ? 'var(--error-soft)' : 'var(--accent-soft)' }} />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: 'var(--aurora-2)' }} />

      {/* ─── TOP STATUS BAR ─── */}
      <div className="relative z-10 px-5 pt-5 pb-3 flex items-center justify-between gap-3">

        {/* Module pill */}
        <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold max-w-[160px] truncate" style={{ color: 'var(--text-primary)' }}>
            {activeModule.title}
          </span>
          {activeModule.isGatekeepingActive && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--error-soft)', border: '1px solid var(--error)', color: 'var(--error)' }}>
              <ShieldAlert className="w-3 h-3" />
              Repaso
            </span>
          )}
        </div>

        {/* Stats cluster */}
        <div className="flex items-center gap-2">
          {/* Streak */}
          <div className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 fill-current animate-pulse" style={{ color: 'var(--warning)' }} />
            <span className="text-sm font-black" style={{ color: 'var(--warning)' }}>{stats.streak}</span>
          </div>
          {/* XP */}
          <div className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl">
            <Zap className="w-4 h-4 fill-current" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-black" style={{ color: 'var(--accent)' }}>{stats.xp}</span>
          </div>
          {/* Accuracy */}
          <div className="glass-card flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl">
            <Star className="w-4 h-4 fill-current" style={{ color: 'var(--warning)' }} />
            <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{accuracy}%</span>
          </div>
        </div>
      </div>

      {/* XP Level bar */}
      <div className="relative z-10 px-5 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>NIV. {level}</span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{stats.xp % xpForNextLevel}/{xpForNextLevel} XP</span>
        </div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* ─── MAIN QUIZ STAGE ─── */}
      <div className="quiz-stage relative z-10 px-4 sm:px-6 pb-6 pt-2">

        {/* ── LEFT: MASCOT COLUMN ── */}
        <div className="flex flex-col items-center justify-center py-4 lg:py-8 relative">
          {showScorePop && (
            <ScorePop value={scorePop.value} correct={scorePop.correct} />
          )}

          <MascotAvatar
            mood={mascotMood}
            isSpeaking={isSpeaking}
            size="xl"
            animationKey={mascotAnimKey}
            className="w-full max-w-[280px] lg:max-w-none"
          />

          {/* Speech bubble — shows retort */}
          {evaluationResult && (
            <div
              className="relative mt-2 max-w-xs glass-card rounded-2xl px-4 py-3 text-xs leading-relaxed italic text-center animate-slide_up bubble-tail"
              style={{
                borderColor: evaluationResult.es_correcta ? 'var(--success)' : 'var(--error)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="text-[10px] font-bold not-italic block mb-1" style={{ color: 'var(--text-muted)' }}>🦉 Migo dice:</span>
              "{evaluationResult.replica_sarcastica}"
              <button
                onClick={replayEvaluationSpeech}
                disabled={isSpeaking}
                className="mt-2 flex items-center gap-1 mx-auto text-[10px] font-bold transition disabled:opacity-40"
                style={{ color: 'var(--accent)' }}
              >
                <Volume2 className="w-3 h-3" />
                {isSpeaking ? 'Hablando...' : 'Escuchar'}
              </button>
            </div>
          )}

          {/* Speaking indicator when no result yet */}
          {isSpeaking && !evaluationResult && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
              <div className="flex items-end gap-0.5 h-4">
                {[0, 150, 300, 150, 0].map((delay, i) => (
                  <div key={i} className="w-1 rounded-full animate-wave"
                    style={{ animationDelay: `${delay}ms`, height: '8px', background: 'var(--accent)' }} />
                ))}
              </div>
              Migo habla...
            </div>
          )}
        </div>

        {/* ── RIGHT: QUESTION + OPTIONS COLUMN ── */}
        <div className="flex flex-col gap-4 py-2">

          {/* ── LOADING SKELETON STATE (INSTANT FEEDBACK WHEN SELECTING MODULE) ── */}
          {!currentQuestion && isEvaluating && (
            <div className="flex flex-col gap-3 py-2 w-full animate-pulse">
              <div className="glass-card rounded-2xl px-5 py-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-24 h-4 rounded-full bg-indigo-500/20" />
                  <div className="w-12 h-4 rounded-full" style={{ background: 'var(--border-soft)' }} />
                </div>
                <div className="space-y-2.5">
                  <div className="w-full h-5 rounded-lg" style={{ background: 'var(--border-soft)' }} />
                  <div className="w-3/4 h-5 rounded-lg" style={{ background: 'var(--border-soft)', opacity: 0.7 }} />
                </div>
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border flex items-center gap-3"
                    style={{ background: 'var(--module-bg)', borderColor: 'var(--border-soft)' }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 shrink-0" />
                    <div className="w-2/3 h-4 rounded" style={{ background: 'var(--border-soft)' }} />
                  </div>
                ))}
              </div>
              <div className="text-center text-xs font-semibold py-2" style={{ color: 'var(--text-secondary)' }}>
                <span>Cargando preguntas de </span>
                <span className="font-bold text-indigo-500">{activeModule.title}</span>...
              </div>
            </div>
          )}

          {/* ── IDLE / NO QUESTION (FALLBACK ONLY) ── */}
          {!currentQuestion && !isEvaluating && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
                  style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-strong)' }}>
                  <Sparkles className="w-10 h-10" style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                  ¿Listo para el{' '}
                  <span className="text-shimmer">desafío?</span>
                </h2>
                <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Migo evaluará tus respuestas con{' '}
                  <span className={settings.personality === 'humillacion_epica' ? 'text-red-500 font-bold' : 'font-semibold'} style={{ color: settings.personality === 'humillacion_epica' ? undefined : 'var(--accent)' }}>
                    {settings.personality === 'humillacion_epica' ? '🔥 roast despiadado' :
                     settings.personality === 'sarcastico_brutal' ? 'sarcasmo brutal' :
                     settings.personality === 'sargento_estricto' ? 'disciplina de sargento' :
                     'ironía suave'}
                  </span>
                </p>
              </div>

              <button
                onClick={() => handleStartChallenge()}
                disabled={isEvaluating}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base text-white overflow-hidden transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                  boxShadow: '0 12px 32px var(--accent-glow)',
                }}
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Iniciar Desafío</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── ACTIVE QUESTION ── */}
          {currentQuestion && (
            <>
              {/* Question card */}
              <div
                key={questionKey}
                className="glass-card rounded-2xl px-5 py-4 relative animate-slide_up"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                      <Sparkles className="w-3 h-3" />
                      Pregunta de Migo
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
                    >
                      {currentQuestion.difficulty?.toUpperCase() || 'MEDIO'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => speakQuestion(currentQuestion.prompt, activeModule.languageQuestion)}
                      className="p-1.5 rounded-lg transition"
                      style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-strong)', color: 'var(--accent)' }}
                      title="Escuchar pregunta"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-base sm:text-lg font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  "{currentQuestion.prompt}"
                </p>

                {currentQuestion.context && (
                  <p className="text-xs mt-2 italic pt-2" style={{ borderTop: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                    💡 {currentQuestion.context}
                  </p>
                )}
              </div>

              {/* Repetition mode hint */}
              {isRepetitionMode && evaluationResult && (
                <div className="p-3 rounded-xl flex items-start gap-2 animate-slide_up"
                  style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
                  <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                  <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
                    <p className="font-bold">Respuesta correcta esperada:</p>
                    <p className="font-mono mt-1 px-2 py-1 rounded font-bold"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--warning)' }}>
                      "{evaluationResult.respuesta_correcta_modelo}"
                    </p>
                  </div>
                </div>
              )}

              {/* ── OPTIONS GRID ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Elige tu respuesta
                  </span>
                  <span className="text-[10px] font-mono hidden sm:block" style={{ color: 'var(--text-hint)' }}>
                    A–D / 1–4
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {options.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isEvaluated = Boolean(evaluationResult);
                    const isCorrect = opt.isCorrect;

                    let optClass = 'option-btn';
                    if (isEvaluated) {
                      if (isCorrect) optClass += ' correct';
                      else if (isSelected && !isCorrect) optClass += ' wrong';
                      else optClass += ' dimmed';
                    } else if (isSelected) {
                      optClass += ' selected';
                    }

                    const letterColors = ['text-indigo-500', 'text-purple-500', 'text-cyan-500', 'text-pink-500'];
                    const letterBg = ['var(--accent-soft)', 'rgba(139,92,246,0.12)', 'rgba(6,182,212,0.12)', 'rgba(236,72,153,0.12)'];

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isEvaluating || Boolean(evaluationResult)}
                        onClick={() => handleSelectOption(opt)}
                        className={`${optClass} p-4 flex items-start gap-3 group animate-option_pop`}
                        style={{ animationDelay: `${idx * 70}ms`, animationFillMode: 'both' }}
                      >
                        {/* Letter badge */}
                        <span
                          className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-all ${
                            isEvaluated
                              ? isCorrect ? 'bg-emerald-500/20 text-emerald-500'
                              : isSelected ? 'bg-rose-500/20 text-rose-500'
                              : 'opacity-40'
                            : `${letterColors[idx]}`
                          }`}
                          style={{
                            background: isEvaluated ? undefined : letterBg[idx],
                            border: `1px solid ${isEvaluated ? 'transparent' : 'var(--border-soft)'}`,
                          }}
                        >
                          {opt.id}
                        </span>

                        <div className="flex-1 text-left">
                          <p
                            className={`text-sm font-semibold leading-snug transition-colors ${
                              isEvaluated
                                ? isCorrect ? 'text-emerald-500 font-bold'
                                : isSelected ? 'text-rose-500 font-bold'
                                : 'opacity-40'
                              : 'group-hover:text-indigo-500'
                            }`}
                            style={{ color: isEvaluated ? undefined : 'var(--text-primary)' }}
                          >
                            {opt.text}
                          </p>

                          {isEvaluated && opt.explanationWhy && (
                            <p className={`text-[11px] mt-1.5 leading-relaxed ${
                              isCorrect ? 'text-emerald-500' : isSelected ? 'text-rose-500' : 'opacity-40'
                            }`}>
                              {opt.explanationWhy}
                            </p>
                          )}
                        </div>

                        {/* Result icon */}
                        {isEvaluated && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : isSelected ? (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            ) : null}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── RESULT DETAIL PANEL ── */}
              {evaluationResult && (
                <div
                  className="rounded-2xl px-5 py-4 animate-slide_up"
                  style={{
                    background: evaluationResult.es_correcta ? 'var(--success-soft)' : 'var(--error-soft)',
                    border: `1px solid ${evaluationResult.es_correcta ? 'var(--success)' : 'var(--error)'}`,
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {/* Score row */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <div className="flex items-center gap-2">
                      {evaluationResult.es_correcta ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                      <span className={`font-black text-sm ${evaluationResult.es_correcta ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {evaluationResult.es_correcta ? '¡Correcto!' : 'Incorrecto'}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-mono font-bold"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--text-primary)' }}
                      >
                        {evaluationResult.puntaje_precision} pts
                      </span>
                    </div>
                    <button
                      onClick={replayEvaluationSpeech}
                      disabled={isSpeaking}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition disabled:opacity-40"
                      style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-strong)', color: 'var(--accent)' }}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {isSpeaking ? 'Hablando...' : 'Repetir'}
                    </button>
                  </div>

                  {/* Explanation */}
                  <div className="p-3 rounded-xl mb-3 glass-card"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)' }}>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">
                      <HelpCircle className="w-3 h-3" />
                      El Porqué:
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {evaluationResult.explicacion_por_que}
                    </p>
                  </div>

                  {/* Correct answer */}
                  <div className="p-3 rounded-xl mb-4"
                    style={{ background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--success)' }}>
                      ✨ Respuesta correcta:
                    </span>
                    <p className="text-xs font-mono font-bold" style={{ color: 'var(--success)' }}>
                      "{evaluationResult.respuesta_correcta_modelo}"
                    </p>
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => handleStartChallenge()}
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                      boxShadow: '0 8px 24px var(--accent-glow)',
                    }}
                  >
                    <span>Siguiente Reto</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="mt-2 text-center text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    o presiona <kbd className="px-1 py-0.5 rounded font-bold" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)' }}>Space</kbd>
                  </div>
                </div>
              )}

              {/* Error message */}
              {errorMessage && (
                <div className="p-3 rounded-xl flex items-start gap-2 text-xs animate-slide_up"
                  style={{ background: 'var(--error-soft)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{errorMessage}</p>
                    {!settings.apiKey && errorMessage.includes('API') && (
                      <button onClick={onOpenSettings} className="mt-1 underline">
                        Abrir configuración de API Key
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

