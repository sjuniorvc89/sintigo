import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Check } from 'lucide-react';

interface CustomTopicModalProps {
  isOpen: boolean;
  currentText: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

export const CustomTopicModal: React.FC<CustomTopicModalProps> = ({
  isOpen,
  currentText,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState<string>(currentText);

  if (!isOpen) return null;

  const handleSave = () => {
    if (text.trim().length > 0) {
      onSave(text.trim());
      onClose();
    }
  };

  const sampleTopics = [
    'Principios de Arquitectura de Software Limpia (SOLID, DRY, KISS, patrones de diseño).',
    'Historia Universal Contemporánea: La Guerra Fría y la caída del Muro de Berlín.',
    'Biología Celular: Mitosis, Meiosis, ADN y síntesis de proteínas.',
    'Vocabulario médico y de enfermería para atención a pacientes internacionales en urgencias.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0E1526] border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">
                Tema Libre / Apuntes Personalizados
              </h3>
              <p className="text-xs text-slate-400">
                Pega cualquier tema y Migo creará un examen oral a medida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Tus Apuntes o Tema de Estudio:
            </label>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pega aquí párrafos de un libro, un temario de examen, conceptos clave o la materia que necesitas dominar..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition resize-none leading-relaxed"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              O elige un tema sugerido:
            </span>
            <div className="space-y-1.5">
              {sampleTopics.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(sample)}
                  className="w-full text-left p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{sample}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Generar Ruta con Migo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
