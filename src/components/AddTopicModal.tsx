import React, { useState } from 'react';
import { X, Plus, BookOpen, Trash2, Check } from 'lucide-react';
import { CourseModule, QuestionItem } from '../types';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTopic: (module: CourseModule, initialQuestions: QuestionItem[]) => void;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isOpen,
  onClose,
  onAddTopic,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [badge, setBadge] = useState('Nuevo');
  const [languageQuestion, setLanguageQuestion] = useState<'es-ES' | 'en-US'>('es-ES');
  const [languageAnswer, setLanguageAnswer] = useState<'es-ES' | 'en-US'>('es-ES');

  // Quick initial questions builder
  const [questions, setQuestions] = useState<
    Array<{
      prompt: string;
      optA: string;
      optB: string;
      optC: string;
      optD: string;
      correctOpt: 'A' | 'B' | 'C' | 'D';
      explanation: string;
    }>
  >([
    {
      prompt: '',
      optA: '',
      optB: '',
      optC: '',
      optD: '',
      correctOpt: 'A',
      explanation: '',
    },
  ]);

  if (!isOpen) return null;

  const handleAddQuestionRow = () => {
    setQuestions([
      ...questions,
      {
        prompt: '',
        optA: '',
        optB: '',
        optC: '',
        optD: '',
        correctOpt: 'A',
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestionRow = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, val: string) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = val;
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newModuleId = 'mod_' + Date.now();

    // Map rows to QuestionItem[]
    const validQuestions: QuestionItem[] = questions
      .filter((q) => q.prompt.trim())
      .map((q, idx) => {
        const optA = q.optA.trim() || 'Opción A';
        const optB = q.optB.trim() || 'Opción B';
        const optC = q.optC.trim() || 'Opción C';
        const optD = q.optD.trim() || 'Opción D';

        return {
          id: `q_${newModuleId}_${idx + 1}`,
          moduleId: newModuleId,
          prompt: q.prompt.trim(),
          languageToListen: languageAnswer,
          difficulty: 'medio',
          expectedConcept: q.correctOpt === 'A' ? optA : q.correctOpt === 'B' ? optB : q.correctOpt === 'C' ? optC : optD,
          options: [
            { id: 'A', text: optA, isCorrect: q.correctOpt === 'A', explanationWhy: q.correctOpt === 'A' ? q.explanation || 'Respuesta correcta.' : undefined },
            { id: 'B', text: optB, isCorrect: q.correctOpt === 'B', explanationWhy: q.correctOpt === 'B' ? q.explanation || 'Respuesta correcta.' : undefined },
            { id: 'C', text: optC, isCorrect: q.correctOpt === 'C', explanationWhy: q.correctOpt === 'C' ? q.explanation || 'Respuesta correcta.' : undefined },
            { id: 'D', text: optD, isCorrect: q.correctOpt === 'D', explanationWhy: q.correctOpt === 'D' ? q.explanation || 'Respuesta correcta.' : undefined },
          ],
        };
      });

    const newModule: CourseModule = {
      id: newModuleId,
      title: title.trim(),
      subtitle: subtitle.trim() || `Ruta personalizada de ${title.trim()}`,
      description: description.trim() || `Preguntas y desafíos sobre ${title.trim()}`,
      icon: icon || 'BookOpen',
      badge: badge.trim() || 'Personalizado',
      languageQuestion,
      languageAnswer,
      totalLessons: Math.max(validQuestions.length, 5),
      completedLessons: 0,
      consecutiveErrors: 0,
      isGatekeepingActive: false,
      gatekeepingStreakRequired: 2,
      gatekeepingCurrentStreak: 0,
      isCustom: true,
    };

    onAddTopic(newModule, validQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#131B2E] border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Crear Nuevo Tema / Módulo</h2>
              <p className="text-xs text-slate-400">
                Añade una nueva materia de preguntas para que Migo te desafíe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Title, Badge & Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Título del Tema *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Historia de Roma, Programación Python, Finanzas..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Ícono
              </label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="BookOpen">📖 Libro / General</option>
                <option value="MessageCircle">💬 Conversación</option>
                <option value="Briefcase">💼 Negocios</option>
                <option value="Binary">💻 Tecnología</option>
                <option value="Sparkles">✨ Especial</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Etiqueta / Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ej: Épico, Desafío, Nuevo"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Subtitle & Description */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Subtítulo Corto
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: Domina los conceptos clave en minutos"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción de lo que se evalúa en este módulo..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Idioma de la Pregunta
              </label>
              <select
                value={languageQuestion}
                onChange={(e) => setLanguageQuestion(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="es-ES">Español (Migo habla en español)</option>
                <option value="en-US">English (Migo habla en inglés)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Idioma de las Opciones
              </label>
              <select
                value={languageAnswer}
                onChange={(e) => setLanguageAnswer(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="es-ES">Español</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          {/* Questions Section */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preguntas del Tema (Opcional, también puedes importarlas luego):</span>
              </span>
              <button
                type="button"
                onClick={handleAddQuestionRow}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3 h-3" />
                <span>Agregar Pregunta</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      Pregunta #{idx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionRow(idx)}
                        className="text-slate-500 hover:text-rose-400 transition p-1"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.prompt}
                    onChange={(e) => handleQuestionChange(idx, 'prompt', e.target.value)}
                    placeholder="Escribe la pregunta o situación..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  {/* 4 Choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                      const fieldName = `opt${optKey}`;
                      const isCorrect = q.correctOpt === optKey;
                      return (
                        <div key={optKey} className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuestionChange(idx, 'correctOpt', optKey)}
                            className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border transition ${
                              isCorrect
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            title="Haz clic para marcar esta opción como la CORRECTA"
                          >
                            {optKey}
                          </button>
                          <input
                            type="text"
                            value={(q as any)[fieldName]}
                            onChange={(e) => handleQuestionChange(idx, fieldName, e.target.value)}
                            placeholder={`Opción ${optKey}...`}
                            className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none ${
                              isCorrect ? 'border-emerald-500/80 bg-emerald-950/20' : 'border-slate-800'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                    placeholder="Explicación pedagógica del porqué de la respuesta correcta..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 italic"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar y Comenzar Tema</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
