import React from 'react';
import { X, BookOpen, RotateCcw, Trash2, CheckCircle } from 'lucide-react';
import { ErrorLogItem, QuestionItem } from '../types';

interface ErrorLogDrawerProps {
  isOpen: boolean;
  errors: ErrorLogItem[];
  onClose: () => void;
  onClearErrors: () => void;
  onPracticeError: (errorItem: ErrorLogItem, generatedQuestion: QuestionItem) => void;
}

export const ErrorLogDrawer: React.FC<ErrorLogDrawerProps> = ({
  isOpen,
  errors,
  onClose,
  onClearErrors,
  onPracticeError,
}) => {
  if (!isOpen) return null;

  const handlePractice = (err: ErrorLogItem) => {
    // Generate a targeted challenge from this error
    const remediationQuestion: QuestionItem = {
      id: 'remed_' + err.id,
      moduleId: err.moduleId,
      prompt: `[REPASO DE ERROR] Anteriormente fallaste en esto: "${err.question}". Repitamos el reto: responde correctamente ahora.`,
      context: `Error previo: ${err.categoriaError} | Respuesta ideal: ${err.respuestaCorrectaModelo}`,
      languageToListen: err.moduleId.includes('conversacional') || err.moduleId.includes('supervivencia') ? 'en-US' : 'es-ES',
      difficulty: 'medio',
      expectedConcept: err.respuestaCorrectaModelo,
    };

    onPracticeError(err, remediationQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl h-full bg-[#0E1526] border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                <span>Cuaderno de Meteduras de Pata</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                  {errors.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Historial de fallos y explicaciones pedagógicas de Migo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <button
                onClick={onClearErrors}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                title="Limpiar cuaderno"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of past errors */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errors.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-3">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="font-bold text-slate-200">¡Cuaderno impecable!</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                No tienes errores acumulados. O eres un genio absoluto o Migo aún no te ha examinado lo suficiente.
              </p>
            </div>
          ) : (
            errors.map((err) => (
              <div
                key={err.id}
                className={`p-4 rounded-2xl border transition ${
                  err.practiced
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                    : 'bg-slate-900 border-rose-500/30 shadow-lg shadow-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {err.moduleTitle}
                  </span>
                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {err.categoriaError}
                  </span>
                </div>

                {/* Question */}
                <p className="text-sm font-semibold text-slate-100 mb-1.5">
                  "{err.question}"
                </p>

                {/* What user said */}
                <div className="text-xs text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-500/20 mb-2 font-mono">
                  <span className="text-rose-400 font-bold mr-1">Dijiste:</span>
                  <span>"{err.userAnswer}"</span>
                </div>

                {/* Sarcastic retort */}
                <p className="text-xs italic text-indigo-300 mb-2">
                  🦉 "{err.replicaSarcastica}"
                </p>

                {/* Pedagogical Why */}
                <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mb-2">
                  <span className="font-bold text-amber-400 block mb-0.5">El porqué:</span>
                  <span>{err.explicacionPorQue}</span>
                </div>

                {/* Model answer */}
                <div className="text-xs font-mono text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20 mb-3">
                  <span className="font-bold text-emerald-400 mr-1">Respuesta modelo:</span>
                  <span>"{err.respuestaCorrectaModelo}"</span>
                </div>

                {/* Action button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500">
                    {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    onClick={() => handlePractice(err)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Practicar este error ahora</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
