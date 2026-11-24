import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Download, Copy, Sparkles, HelpCircle } from 'lucide-react';
import { CourseModule, QuestionItem } from '../types';
import { importService, SAMPLE_JSON_TEMPLATE, SAMPLE_CSV_TEMPLATE, SAMPLE_TXT_TEMPLATE } from '../services/importService';

interface ImportModalProps {
  isOpen: boolean;
  modules: CourseModule[];
  activeModuleId: string;
  onClose: () => void;
  onQuestionsImported: (questions: QuestionItem[], targetModuleId: string, customModuleName?: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  modules,
  activeModuleId,
  onClose,
  onQuestionsImported,
}) => {
  const [content, setContent] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [targetModuleId, setTargetModuleId] = useState<string>(activeModuleId);
  const [newModuleName, setNewModuleName] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Parsing preview state
  const [parseResult, setParseResult] = useState<{
    attempted: boolean;
    success: boolean;
    questions: QuestionItem[];
    errors: string[];
  }>({
    attempted: false,
    success: false,
    questions: [],
    errors: [],
  });

  if (!isOpen) return null;

  const handleFormatChange = (fmt: 'json' | 'csv' | 'txt') => {
    setSelectedFormat(fmt);
    if (!content.trim()) {
      if (fmt === 'json') setContent(SAMPLE_JSON_TEMPLATE);
      if (fmt === 'csv') setContent(SAMPLE_CSV_TEMPLATE);
      if (fmt === 'txt') setContent(SAMPLE_TXT_TEMPLATE);
    }
  };

  const handleLoadSample = () => {
    if (selectedFormat === 'json') setContent(SAMPLE_JSON_TEMPLATE);
    if (selectedFormat === 'csv') setContent(SAMPLE_CSV_TEMPLATE);
    if (selectedFormat === 'txt') setContent(SAMPLE_TXT_TEMPLATE);
    setParseResult({ attempted: false, success: false, questions: [], errors: [] });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        // Auto detect format from extension
        if (file.name.endsWith('.json')) setSelectedFormat('json');
        else if (file.name.endsWith('.csv')) setSelectedFormat('csv');
        else setSelectedFormat('txt');
      }
    };
    reader.readAsText(file);
  };

  const handleValidateAndPreview = () => {
    const res = importService.parseDocument(content, targetModuleId);
    setParseResult({
      attempted: true,
      success: res.success,
      questions: res.questions,
      errors: res.errors,
    });
  };

  const handleDownloadSample = () => {
    const data =
      selectedFormat === 'json'
        ? SAMPLE_JSON_TEMPLATE
        : selectedFormat === 'csv'
        ? SAMPLE_CSV_TEMPLATE
        : SAMPLE_TXT_TEMPLATE;
    const filename = `plantilla_migolab_preguntas.${selectedFormat}`;
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySample = () => {
    const data =
      selectedFormat === 'json'
        ? SAMPLE_JSON_TEMPLATE
        : selectedFormat === 'csv'
        ? SAMPLE_CSV_TEMPLATE
        : SAMPLE_TXT_TEMPLATE;
    navigator.clipboard.writeText(data);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleConfirmImport = () => {
    const res = importService.parseDocument(content, targetModuleId);
    if (res.success && res.questions.length > 0) {
      onQuestionsImported(res.questions, targetModuleId, newModuleName.trim() || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0E1526] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>Importar Preguntas y Respuestas</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  JSON / CSV / TXT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sube tu propio temario para jugar por voz o por selección múltiple
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Format Selector Tabs & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-1">Formato:</span>
              {(['json', 'csv', 'txt'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleFormatChange(fmt)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                    selectedFormat === fmt
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  .{fmt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                title="Cargar ejemplo en el editor"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar Ejemplo</span>
              </button>

              <button
                type="button"
                onClick={handleCopySample}
                className="text-[11px] text-slate-300 hover:text-white font-semibold flex items-center gap-1 transition"
                title="Copiar plantilla al portapapeles"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="text-[11px] text-slate-300 hover:text-white font-semibold flex items-center gap-1 transition"
                title="Descargar archivo de ejemplo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>

          {/* Target Module Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Destino de las preguntas:
              </label>
              <select
                value={targetModuleId}
                onChange={(e) => setTargetModuleId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
                <option value="new_module">+ Crear Nueva Ruta Temática</option>
              </select>
            </div>

            {targetModuleId === 'new_module' && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre del nuevo curso:
                </label>
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="Ej: Biología Celular para Examen..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          {/* File Upload Drop Area & Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pega el contenido o sube tu archivo:</span>
              </label>

              <label className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1.5 transition">
                <Upload className="w-3 h-3 text-cyan-400" />
                <span>Subir Archivo</span>
                <input
                  type="file"
                  accept=".json,.csv,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={9}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setParseResult({ attempted: false, success: false, questions: [], errors: [] });
              }}
              placeholder={`Pega aquí el contenido en formato .${selectedFormat}...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
            />
          </div>

          {/* Validation & Preview Panel */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleValidateAndPreview}
              disabled={!content.trim()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>Validar Documento</span>
            </button>

            {parseResult.attempted && (
              <div className="text-xs flex items-center gap-2">
                {parseResult.success ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>¡Válido! {parseResult.questions.length} preguntas detectadas</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{parseResult.errors[0] || 'Error de formato'}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Questions Preview List */}
          {parseResult.questions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Vista previa de preguntas importadas:
              </span>
              {parseResult.questions.map((q, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-200">
                      #{idx + 1}: "{q.prompt}"
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {q.languageToListen}
                    </span>
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-1 mt-1 pl-2">
                      {q.options.map((opt) => (
                        <div key={opt.id} className={opt.isCorrect ? 'text-emerald-300 font-bold' : ''}>
                          {opt.id}) {opt.text} {opt.isCorrect ? '✓' : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Format Specification Guide */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs text-slate-400">
            <p className="font-bold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>¿Cómo debe ser el documento?</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li><strong>JSON (.json):</strong> Lista con <code>prompt</code>, <code>options</code> (con <code>id</code>, <code>text</code>, <code>isCorrect</code>, <code>explanationWhy</code>) y <code>languageToListen</code> ('en-US' o 'es-ES').</li>
              <li><strong>CSV (.csv):</strong> Columnas: <code>pregunta,opcion_a,opcion_b,opcion_c,opcion_d,correcta,explicacion,idioma_respuesta</code></li>
              <li><strong>Texto / Markdown (.txt):</strong> Bloques separados por <code>---</code> con <code>PREGUNTA: ...</code>, opciones <code>A) ... [CORRECTA]</code>, <code>EXPLICACION: ...</code> e <code>IDIOMA: en-US</code>.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!content.trim()}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Importar a MigoLab</span>
          </button>
        </div>
      </div>
    </div>
  );
};
