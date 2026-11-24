import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Check,
  Sparkles,
  BookOpen,
  MessageCircle,
  Briefcase,
  Binary,
  Globe,
  Brain,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CourseModule, MultipleChoiceOption, QuestionItem } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';

interface EditTopicModalProps {
  isOpen: boolean;
  modules: CourseModule[];
  initialModuleId?: string | null;
  onClose: () => void;
  onTopicUpdated: (module: CourseModule, updatedQuestions: QuestionItem[]) => void;
  apiKey?: string;
  provider?: string;
  model?: string;
}

interface EditableQuestionState {
  id: string;
  prompt: string;
  expectedConcept: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correctOpt: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  isExpanded: boolean;
}

export const EditTopicModal: React.FC<EditTopicModalProps> = ({
  isOpen,
  modules,
  initialModuleId,
  onClose,
  onTopicUpdated,
  apiKey,
  provider,
  model,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    initialModuleId || modules[0]?.id || ''
  );

  // Active module form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [languageQuestion, setLanguageQuestion] = useState<'es-ES' | 'en-US'>('es-ES');
  const [languageAnswer, setLanguageAnswer] = useState<'es-ES' | 'en-US'>('es-ES');
  const [totalLessons, setTotalLessons] = useState(8);
  const [customTopicText, setCustomTopicText] = useState('');

  // Questions editor state
  const [questions, setQuestions] = useState<EditableQuestionState[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('questions');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever selectedModuleId changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    const targetId = initialModuleId || selectedModuleId || modules[0]?.id;
    if (!targetId) return;

    setSelectedModuleId(targetId);
    const mod = modules.find((m) => m.id === targetId);
    if (!mod) return;

    setTitle(mod.title);
    setSubtitle(mod.subtitle);
    setDescription(mod.description);
    setBadge(mod.badge);
    setIcon(mod.icon || 'BookOpen');
    setLanguageQuestion(mod.languageQuestion);
    setLanguageAnswer(mod.languageAnswer);
    setTotalLessons(mod.totalLessons || 8);
    setCustomTopicText(mod.customTopicText || '');

    // Load questions for this module
    const currentQuestions = storageService.getQuestionsForModule(mod.id);
    const mapped: EditableQuestionState[] = currentQuestions.map((q, idx) => {
      const opts = geminiService.getOrGenerateOptions(q);
      const optA = opts.find((o) => o.id === 'A') || { text: '', isCorrect: true };
      const optB = opts.find((o) => o.id === 'B') || { text: '', isCorrect: false };
      const optC = opts.find((o) => o.id === 'C') || { text: '', isCorrect: false };
      const optD = opts.find((o) => o.id === 'D') || { text: '', isCorrect: false };

      const correct = opts.find((o) => o.isCorrect)?.id as 'A' | 'B' | 'C' | 'D' || 'A';
      const expl = opts.find((o) => o.isCorrect)?.explanationWhy || '';

      return {
        id: q.id || `q_${mod.id}_${idx + 1}`,
        prompt: q.prompt,
        expectedConcept: q.expectedConcept || '',
        difficulty: q.difficulty || 'medio',
        optA: optA.text,
        optB: optB.text,
        optC: optC.text,
        optD: optD.text,
        correctOpt: correct,
        explanation: expl,
        isExpanded: idx === 0, // expand first by default
      };
    });

    if (mapped.length === 0) {
      mapped.push({
        id: `q_${mod.id}_1`,
        prompt: '',
        expectedConcept: '',
        difficulty: 'medio',
        optA: '',
        optB: '',
        optC: '',
        optD: '',
        correctOpt: 'A',
        explanation: '',
        isExpanded: true,
      });
    }

    setQuestions(mapped);
  }, [isOpen, initialModuleId, selectedModuleId, modules]);

  if (!isOpen) return null;

  const currentMod = modules.find((m) => m.id === selectedModuleId);

  const handleModuleSelect = (newModId: string) => {
    setSelectedModuleId(newModId);
    setSaveSuccess(false);
  };

  const handleAddQuestion = () => {
    const newQ: EditableQuestionState = {
      id: `q_${selectedModuleId}_${Date.now()}`,
      prompt: '',
      expectedConcept: '',
      difficulty: 'medio',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correctOpt: 'A',
      explanation: '',
      isExpanded: true,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Un tema debe tener al menos una pregunta para poder evaluarse.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionFieldChange = (
    idx: number,
    field: keyof EditableQuestionState,
    val: any
  ) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = val;
    setQuestions(updated);
  };

  const toggleExpand = (idx: number) => {
    const updated = [...questions];
    updated[idx].isExpanded = !updated[idx].isExpanded;
    setQuestions(updated);
  };

  const handleGenerateQuestionWithAi = async () => {
    if (!apiKey || !apiKey.trim()) {
      alert('Ingresa primero tu API Key en Configuración para generar preguntas con IA.');
      return;
    }
    if (!currentMod) return;

    setIsGeneratingAi(true);
    try {
      const generated = await geminiService.generateQuestion({
        provider: (provider as any) || 'gemini',
        apiKey: apiKey.trim(),
        model: model || 'gemini-2.0-flash',
        module: {
          ...currentMod,
          title,
          subtitle,
          description,
          languageQuestion,
          languageAnswer,
          customTopicText,
        },
        recentErrors: [],
        isReviewMode: false,
      });

      const opts = geminiService.getOrGenerateOptions(generated);
      const optA = opts.find((o) => o.id === 'A') || { text: 'Opción A', isCorrect: true };
      const optB = opts.find((o) => o.id === 'B') || { text: 'Opción B', isCorrect: false };
      const optC = opts.find((o) => o.id === 'C') || { text: 'Opción C', isCorrect: false };
      const optD = opts.find((o) => o.id === 'D') || { text: 'Opción D', isCorrect: false };

      const correct = opts.find((o) => o.isCorrect)?.id as 'A' | 'B' | 'C' | 'D' || 'A';
      const expl = opts.find((o) => o.isCorrect)?.explanationWhy || 'Respuesta correcta.';

      const newQ: EditableQuestionState = {
        id: `q_ai_${Date.now()}`,
        prompt: generated.prompt,
        expectedConcept: generated.expectedConcept,
        difficulty: generated.difficulty || 'medio',
        optA: optA.text,
        optB: optB.text,
        optC: optC.text,
        optD: optD.text,
        correctOpt: correct,
        explanation: expl,
        isExpanded: true,
      };

      setQuestions((prev) => [...prev, newQ]);
      setActiveTab('questions');
    } catch (err: any) {
      alert(`No se pudo generar la pregunta: ${err.message || 'Error en la API'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMod) return;
    if (!title.trim()) {
      alert('El tema debe tener un título.');
      return;
    }

    // Build updated QuestionItem[]
    const updatedQuestions: QuestionItem[] = questions
      .filter((q) => q.prompt.trim())
      .map((q, idx) => {
        const textA = q.optA.trim() || 'Opción A';
        const textB = q.optB.trim() || 'Opción B';
        const textC = q.optC.trim() || 'Opción C';
        const textD = q.optD.trim() || 'Opción D';

        const options: MultipleChoiceOption[] = [
          {
            id: 'A',
            text: textA,
            isCorrect: q.correctOpt === 'A',
            explanationWhy: q.correctOpt === 'A' ? q.explanation || 'Respuesta correcta.' : undefined,
          },
          {
            id: 'B',
            text: textB,
            isCorrect: q.correctOpt === 'B',
            explanationWhy: q.correctOpt === 'B' ? q.explanation || 'Respuesta correcta.' : undefined,
          },
          {
            id: 'C',
            text: textC,
            isCorrect: q.correctOpt === 'C',
            explanationWhy: q.correctOpt === 'C' ? q.explanation || 'Respuesta correcta.' : undefined,
          },
          {
            id: 'D',
            text: textD,
            isCorrect: q.correctOpt === 'D',
            explanationWhy: q.correctOpt === 'D' ? q.explanation || 'Respuesta correcta.' : undefined,
          },
        ];

        const expected =
          q.correctOpt === 'A'
            ? textA
            : q.correctOpt === 'B'
            ? textB
            : q.correctOpt === 'C'
            ? textC
            : textD;

        return {
          id: q.id || `q_${currentMod.id}_${idx + 1}`,
          moduleId: currentMod.id,
          prompt: q.prompt.trim(),
          languageToListen: languageAnswer,
          difficulty: q.difficulty,
          expectedConcept: q.expectedConcept.trim() || expected,
          options,
        };
      });

    const updatedModule: CourseModule = {
      ...currentMod,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      badge: badge.trim() || 'Actualizado',
      icon,
      languageQuestion,
      languageAnswer,
      totalLessons: Math.max(totalLessons, updatedQuestions.length, 1),
      customTopicText: currentMod.isCustom ? customTopicText : currentMod.customTopicText,
    };

    // Save in storageService
    storageService.updateModule(updatedModule);
    storageService.saveQuestionsForModule(updatedModule.id, updatedQuestions);

    // Notify parent App
    onTopicUpdated(updatedModule, updatedQuestions);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden text-left flex flex-col max-h-[90vh]"
        style={{
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3.5 mb-3 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                Modificar y Guardar Tema
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Edita los detalles del módulo, sus preguntas interactivas y guárdalos en la base de datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl transition"
            style={{
              background: 'var(--bg-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-soft)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Picker & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          {/* Module dropdown selector */}
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-bold shrink-0" style={{ color: 'var(--text-muted)' }}>
              Tema a editar:
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => handleModuleSelect(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex-1"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({storageService.getQuestionsForModule(m.id).length} preguntas)
                </option>
              ))}
            </select>
          </div>

          {/* Tab Selector */}
          <div
            className="flex p-1 rounded-xl shrink-0"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)' }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'questions' ? 'shadow-sm' : ''
              }`}
              style={{
                background: activeTab === 'questions' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'questions' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Preguntas ({questions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'info' ? 'shadow-sm' : ''
              }`}
              style={{
                background: activeTab === 'info' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'info' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Detalles del Tema</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSaveAll} className="overflow-y-auto pr-1 flex-1 space-y-4">
          {activeTab === 'info' ? (
            /* TAB 1: Module Information */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Título del Tema
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Inglés Conversacional para Negocios"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Subtítulo o Consigna
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ej: Aprende a cerrar tratos y debatir en inglés"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Descripción Pedagógica
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explica qué aprenderá el usuario y qué desafíos enfrentará..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Badge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Badge / Etiqueta
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Popular, Avanzado, Examen..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Total Lessons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Total de Lecciones
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={totalLessons}
                    onChange={(e) => setTotalLessons(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-mono"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Icon Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Icono Representativo
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { id: 'BookOpen', icon: <BookOpen className="w-4 h-4" /> },
                      { id: 'MessageCircle', icon: <MessageCircle className="w-4 h-4" /> },
                      { id: 'Briefcase', icon: <Briefcase className="w-4 h-4" /> },
                      { id: 'Binary', icon: <Binary className="w-4 h-4" /> },
                      { id: 'Globe', icon: <Globe className="w-4 h-4" /> },
                      { id: 'Brain', icon: <Brain className="w-4 h-4" /> },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`p-2 rounded-xl flex items-center justify-center transition border ${
                          icon === item.id
                            ? 'ring-2 ring-indigo-500'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          background: icon === item.id ? 'var(--accent)' : 'var(--bg-input)',
                          color: icon === item.id ? '#fff' : 'var(--text-secondary)',
                          borderColor: 'var(--border-strong)',
                        }}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Pair */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Idiomas (Pregunta / Respuesta)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={languageQuestion}
                      onChange={(e) => setLanguageQuestion(e.target.value as any)}
                      className="px-2.5 py-2 rounded-xl text-xs font-bold"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="es-ES">Pregunta en ES</option>
                      <option value="en-US">Pregunta en EN</option>
                    </select>

                    <select
                      value={languageAnswer}
                      onChange={(e) => setLanguageAnswer(e.target.value as any)}
                      className="px-2.5 py-2 rounded-xl text-xs font-bold"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="es-ES">Responde en ES</option>
                      <option value="en-US">Responde en EN</option>
                    </select>
                  </div>
                </div>

                {/* Custom Topic Text (if custom module) */}
                {currentMod?.isCustom && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Apuntes del Tema Libre
                    </label>
                    <textarea
                      rows={3}
                      value={customTopicText}
                      onChange={(e) => setCustomTopicText(e.target.value)}
                      placeholder="Pega aquí el temario o apuntes específicos para que Migo genere preguntas sobre ellos..."
                      className="w-full px-3.5 py-2 rounded-xl text-xs"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: Questions Editor */
            <div className="space-y-3">
              {/* Question list toolbar */}
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Total de preguntas registradas: {questions.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateQuestionWithAi}
                    disabled={isGeneratingAi}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                    style={{
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAi ? 'Generando...' : 'Generar con IA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Pregunta</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-2xl border transition-all"
                    style={{
                      background: 'var(--bg-raised)',
                      borderColor: q.isExpanded ? 'var(--accent)' : 'var(--border-soft)',
                    }}
                  >
                    {/* Question Header Accordion */}
                    <div
                      className="flex items-center justify-between gap-2 cursor-pointer select-none"
                      onClick={() => toggleExpand(idx)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                        >
                          {idx + 1}
                        </span>
                        <p
                          className="text-xs font-bold truncate max-w-sm sm:max-w-md"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {q.prompt.trim() || '(Pregunta sin texto aún)'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-soft)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Opción {q.correctOpt} correcta
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveQuestion(idx);
                          }}
                          className="p-1.5 rounded-lg hover:text-red-400 transition"
                          style={{ color: 'var(--text-muted)' }}
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          className="p-1 rounded-lg"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {q.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Question Expanded Body */}
                    {q.isExpanded && (
                      <div
                        className="mt-3 pt-3 border-t space-y-3 animate-in fade-in duration-150"
                        style={{ borderColor: 'var(--border-soft)' }}
                      >
                        {/* Prompt Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                            Pregunta o instrucción de Migo:
                          </label>
                          <input
                            type="text"
                            value={q.prompt}
                            onChange={(e) => handleQuestionFieldChange(idx, 'prompt', e.target.value)}
                            placeholder="Ej: ¿Cuál es la diferencia entre let y const en JavaScript?"
                            className="w-full px-3 py-2 rounded-xl text-xs font-semibold"
                            style={{
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-strong)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                            Opciones de Selección Múltiple (marca la opción correcta):
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                              const isCorrect = q.correctOpt === letter;
                              const fieldName = `opt${letter}` as keyof EditableQuestionState;
                              return (
                                <div
                                  key={letter}
                                  className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                                    isCorrect ? 'ring-1 ring-emerald-500' : ''
                                  }`}
                                  style={{
                                    background: isCorrect ? 'var(--success-soft)' : 'var(--bg-input)',
                                    borderColor: isCorrect ? 'var(--success)' : 'var(--border-soft)',
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleQuestionFieldChange(idx, 'correctOpt', letter)}
                                    className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 transition ${
                                      isCorrect
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'hover:bg-slate-700 text-slate-300'
                                    }`}
                                    style={{
                                      background: isCorrect ? 'var(--success)' : 'var(--bg-raised)',
                                      color: isCorrect ? '#fff' : 'var(--text-secondary)',
                                    }}
                                    title="Marcar como respuesta correcta"
                                  >
                                    {letter}
                                  </button>

                                  <input
                                    type="text"
                                    value={q[fieldName] as string}
                                    onChange={(e) =>
                                      handleQuestionFieldChange(idx, fieldName, e.target.value)
                                    }
                                    placeholder={`Texto de opción ${letter}...`}
                                    className="flex-1 bg-transparent text-xs font-medium outline-none"
                                    style={{ color: 'var(--text-primary)' }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation for the correct option */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                            Explicación pedagógica (por qué es la respuesta correcta):
                          </label>
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) =>
                              handleQuestionFieldChange(idx, 'explanation', e.target.value)
                            }
                            placeholder="Migo usará esta explicación si el alumno se equivoca..."
                            className="w-full px-3 py-1.5 rounded-xl text-xs"
                            style={{
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-strong)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div
            className="flex items-center justify-between pt-3 border-t mt-4"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span
                  className="text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in"
                  style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Tema y preguntas guardados con éxito!</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold transition"
                style={{
                  background: 'var(--bg-raised)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-soft)',
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                  boxShadow: '0 4px 15px var(--accent-glow)',
                }}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
