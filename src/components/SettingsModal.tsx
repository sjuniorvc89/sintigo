import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Smile, Volume2, ShieldCheck, ExternalLink, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { AIProvider, AppSettings, PersonalityMode } from '../types';
import { speechService } from '../services/speechService';
import { geminiService } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Available browser voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      const v = speechService.getAvailableVoices();
      setVoices(v);
    };
    updateVoices();
    const cleanup = speechService.onVoicesChanged(updateVoices);
    return cleanup;
  }, []);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: AIProvider) => {
    let defaultModel = 'gemini-1.5-flash';
    if (newProvider === 'groq') defaultModel = 'llama-3.3-70b-versatile';
    if (newProvider === 'openrouter') defaultModel = 'google/gemini-2.0-flash-lite-001';

    setFormData({
      ...formData,
      provider: newProvider,
      model: defaultModel,
    });
    setTestResult(null);
  };

  const handleSave = () => {
    onSave(formData);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await geminiService.testConnection({
      provider: formData.provider,
      apiKey: formData.apiKey,
      model: formData.model,
    });

    setIsTesting(false);
    setTestResult(result);
  };

  const handleApplyPreset = (preset: 'teatral' | 'esceptico' | 'mordaz') => {
    if (preset === 'teatral') {
      setFormData((prev) => ({
        ...prev,
        sarcasmPreset: 'teatral',
        voicePitch: 1.25,
        voiceRate: 1.05,
      }));
    } else if (preset === 'esceptico') {
      setFormData((prev) => ({
        ...prev,
        sarcasmPreset: 'esceptico',
        voicePitch: 0.90,
        voiceRate: 0.95,
      }));
    } else if (preset === 'mordaz') {
      setFormData((prev) => ({
        ...prev,
        sarcasmPreset: 'mordaz',
        voicePitch: 1.15,
        voiceRate: 1.18,
      }));
    }
  };

  const handleTestVoice = () => {
    const testPhrases: Record<PersonalityMode, string> = {
      ironico_suave: 'Vaya... parece que hoy tus neuronas decidieron tomarse un café antes de hablar.',
      sarcastico_brutal: '¿En serio?... ¡Brillante! Si el objetivo era inventar un idioma alienígena, te aplaudo de pie.',
      sargento_estricto: '¡Atención recluta! ¡En esta academia la mediocridad gramatical se paga con flexiones!',
      humillacion_epica: '¿Pero tú tienes el cerebro de adorno o lo alquilas los fines de semana? ¡Hasta una tostadora desenchufada pensaría con más coherencia!',
    };

    speechService.speak(testPhrases[formData.personality], {
      language: 'es-ES',
      tone: 'sarcastic',
      basePitch: formData.voicePitch,
      baseRate: formData.voiceRate,
      preferredVoiceURI: formData.selectedVoiceURI,
      ttsProvider: formData.ttsProvider || 'browser',
      elevenLabsApiKey: formData.elevenLabsApiKey,
      elevenLabsVoiceId: formData.elevenLabsVoiceId,
      openAITtsApiKey: formData.openAITtsApiKey,
      openAITtsVoice: formData.openAITtsVoice,
      enableInterjections: formData.enableHumanInterjections ?? true,
    });
  };

  const providerLinks: Record<AIProvider, { url: string; label: string; name: string }> = {
    gemini: {
      url: 'https://aistudio.google.com/app/apikey',
      label: 'Obtener clave gratis en Google AI Studio',
      name: 'Google Gemini',
    },
    groq: {
      url: 'https://console.groq.com/keys',
      label: 'Obtener clave gratis en Groq Cloud (Ultra rápida)',
      name: 'Groq Cloud',
    },
    openrouter: {
      url: 'https://openrouter.ai/keys',
      label: 'Obtener clave en OpenRouter',
      name: 'OpenRouter',
    },
  };

  // Filter voices for language relevance
  const spanishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const otherVoices = voices.filter((v) => !v.lang.toLowerCase().startsWith('es') && !v.lang.toLowerCase().startsWith('en'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0E1526] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <span>Motor de Inteligencia & Voz de Migo</span>
            </h3>
            <p className="text-xs text-slate-400">
              Personaliza el razonamiento IA y ajusta la voz para que suene humana y sarcástica
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {/* Provider Selection Tabs */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Proveedor de Inteligencia Artificial (100% Gratuito)</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gemini', name: 'Google Gemini', desc: 'Oficial Google AI Studio' },
                { id: 'groq', name: 'Groq Cloud', desc: '14,400 req/día (< 250ms)' },
                { id: 'openrouter', name: 'OpenRouter', desc: 'Modelos free' },
              ].map((prov) => {
                const isSelected = formData.provider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleProviderChange(prov.id as AIProvider)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-100">{prov.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{prov.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* API Key Input */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  API Key de {providerLinks[formData.provider].name}:
                </span>
                <a
                  href={providerLinks[formData.provider].url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>{providerLinks[formData.provider].label}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => {
                  setFormData({ ...formData, apiKey: e.target.value });
                  setTestResult(null);
                }}
                placeholder={`Pega aquí tu clave de ${providerLinks[formData.provider].name}...`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Guardada únicamente en tu navegador (`localStorage`).</span>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !formData.apiKey.trim()}
                  className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-bold border border-indigo-500/40 transition flex items-center gap-1 disabled:opacity-40"
                >
                  {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Probar Conexión con IA</span>
                </button>
              </div>

              {/* Test result feedback banner */}
              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Model Selector */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modelo de Inteligencia Artificial</span>
            </label>

            {formData.provider === 'gemini' && (
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="gemini-1.5-flash">gemini-1.5-flash (Predeterminado - Gratuito, ultra veloz)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Próxima generación - Razonamiento ágil)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (Máxima profundidad pedagógica)</option>
              </select>
            )}

            {formData.provider === 'groq' && (
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recomendado - Sarcasmo agudo)</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra veloz, menos de 200ms)</option>
              </select>
            )}

            {formData.provider === 'openrouter' && (
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="google/gemini-2.0-flash-lite-001">google/gemini-2.0-flash-lite-001 (Gratis)</option>
                <option value="meta-llama/llama-3.3-70b-instruct:free">meta-llama/llama-3.3-70b-instruct:free (Gratis)</option>
                <option value="deepseek/deepseek-r1:free">deepseek/deepseek-r1:free (Razonamiento profundo)</option>
              </select>
            )}
          </div>

          {/* Personality Mode Selector */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-rose-400" />
              <span>Personalidad de Migo</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  id: 'ironico_suave',
                  title: 'Irónico Suave',
                  desc: 'Elegante y sutil, humor británico refinado.',
                  border: 'hover:border-blue-500/50',
                },
                {
                  id: 'sarcastico_brutal',
                  title: 'Sarcástico Brutal',
                  desc: 'Burlas mordaces y directas por fallos obvios.',
                  border: 'hover:border-rose-500/50',
                },
                {
                  id: 'sargento_estricto',
                  title: 'Sargento Estricto',
                  desc: 'Disciplina militar inflexible, cero excusas.',
                  border: 'hover:border-amber-500/50',
                },
                {
                  id: 'humillacion_epica',
                  title: '🔥 Roast / Insultos',
                  desc: 'Humillación cómica sin piedad ni filtros.',
                  border: 'hover:border-red-500/60',
                },
              ].map((p) => {
                const isSelected = formData.personality === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        personality: p.id as PersonalityMode,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                        : `bg-slate-950 border-slate-800 ${p.border}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-100">{p.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Tuning & Sarcastic Presets (TTS) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Motor de Voz (TTS) y Expresiones Humanas</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Elige entre voces nativas $0 del navegador o voces IA hiper-realistas
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestVoice}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                title="Escuchar frase sarcástica de prueba"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Probar Voz</span>
              </button>
            </div>

            {/* Voice Provider Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ttsProvider: 'browser' })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  (!formData.ttsProvider || formData.ttsProvider === 'browser')
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Navegador ($0)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, ttsProvider: 'elevenlabs' })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  formData.ttsProvider === 'elevenlabs'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>ElevenLabs (Ultra Humana)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, ttsProvider: 'openai' })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  formData.ttsProvider === 'openai'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>OpenAI TTS (HD)</span>
              </button>
            </div>

            {/* ElevenLabs Configuration */}
            {formData.ttsProvider === 'elevenlabs' && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">ElevenLabs API (Voces con suspiros, risas y emoción humana)</span>
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Crear cuenta gratis</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ElevenLabs API Key:</label>
                    <input
                      type="password"
                      value={formData.elevenLabsApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, elevenLabsApiKey: e.target.value })}
                      placeholder="sk_..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Voice ID (Opcional):</label>
                    <input
                      type="text"
                      value={formData.elevenLabsVoiceId || ''}
                      onChange={(e) => setFormData({ ...formData, elevenLabsVoiceId: e.target.value })}
                      placeholder="pNInz6obpgDQGcFmaJgB (Adam / Por defecto)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OpenAI TTS Configuration */}
            {formData.ttsProvider === 'openai' && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
                <span className="text-xs font-bold text-emerald-300 block">OpenAI Text-to-Speech (Modelo tts-1 calidad estudio)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">OpenAI API Key:</label>
                    <input
                      type="password"
                      value={formData.openAITtsApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, openAITtsApiKey: e.target.value })}
                      placeholder="sk-proj-..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Voz de Actor:</label>
                    <select
                      value={formData.openAITtsVoice || 'onyx'}
                      onChange={(e) => setFormData({ ...formData, openAITtsVoice: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="onyx">Onyx (Grave, profunda, sarcasmo cínico)</option>
                      <option value="fable">Fable (Expresiva, teatral y dinámica)</option>
                      <option value="alloy">Alloy (Equilibrada y neutral)</option>
                      <option value="echo">Echo (Cálida y clara)</option>
                      <option value="nova">Nova (Femenina expresiva)</option>
                      <option value="shimmer">Shimmer (Clara y precisa)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Browser Voice Configuration */}
            {(!formData.ttsProvider || formData.ttsProvider === 'browser') && (
              <>
                {/* Presets for Sarcasm Inflection */}
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Estilo de Entonación Sarcástica (Presets):</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'teatral',
                        name: '🎭 Teatral y Expresivo',
                        desc: 'Tono agudo y ondulante (Tono: 1.25, Vel: 1.05x).',
                      },
                      {
                        id: 'esceptico',
                        name: '🧐 Cínico y Decepcionado',
                        desc: 'Tono grave y pausado (Tono: 0.90, Vel: 0.95x).',
                      },
                      {
                        id: 'mordaz',
                        name: '⚡ Rápido y Mordaz',
                        desc: 'Tono punzante y veloz (Tono: 1.15, Vel: 1.18x).',
                      },
                    ].map((preset) => {
                      const isSelected = formData.sarcasmPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isSelected
                              ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">{preset.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Browser Voice Selector Dropdown */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Voz del Sistema / Navegador:</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {voices.length} voces detectadas
                    </span>
                  </label>

                  <select
                    value={formData.selectedVoiceURI || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, selectedVoiceURI: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">✨ Selección Automática Inteligente (Filtra voces robotizadas)</option>
                    {spanishVoices.length > 0 && (
                      <optgroup label="🇪🇸 Voces en Español (Recomendadas)">
                        {spanishVoices.map((v) => {
                          const isNatural =
                            v.name.includes('Natural') ||
                            v.name.includes('Online') ||
                            v.name.includes('Neural') ||
                            v.name.includes('Google');
                          return (
                            <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                              {v.name} {isNatural ? '⭐ [Natural / Expresiva]' : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {englishVoices.length > 0 && (
                      <optgroup label="🇺🇸 Voces en Inglés">
                        {englishVoices.map((v) => {
                          const isNatural =
                            v.name.includes('Natural') ||
                            v.name.includes('Online') ||
                            v.name.includes('Neural') ||
                            v.name.includes('Google');
                          return (
                            <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                              {v.name} {isNatural ? '⭐ [Natural / Expresiva]' : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {otherVoices.length > 0 && (
                      <optgroup label="Otras Voces">
                        {otherVoices.map((v) => (
                          <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <p className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    💡 <strong>Consejo anti-robot:</strong> Las voces marcadas como <em>"Online (Natural)"</em> en <strong>Microsoft Edge</strong> o <em>"Google español"</em> en <strong>Chrome</strong> tienen inflexión humana real, superando por completo a las voces antiguas tipo GPS de Windows.
                  </p>
                </div>

                {/* Fine Tuning Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Tono Manual (Pitch)</span>
                      <span className="font-mono text-slate-200">{formData.voicePitch.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.05"
                      value={formData.voicePitch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          voicePitch: parseFloat(e.target.value),
                          sarcasmPreset: 'personalizado',
                        })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      &gt; 1.1 = Tono irónico/burlón | &lt; 1.0 = Tono grave/cínico
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Velocidad Manual (Rate)</span>
                      <span className="font-mono text-slate-200">{formData.voiceRate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.4"
                      step="0.05"
                      value={formData.voiceRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          voiceRate: parseFloat(e.target.value),
                          sarcasmPreset: 'personalizado',
                        })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      1.05x - 1.15x da mayor soltura y velocidad humana
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Human Expressions & Sound Effects Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Expresiones Humanas Conversacionales</span>
                  <span className="text-[10px] text-slate-400">Prefija suspiros y quejas humanas ("¡Pff!...", "A ver, a ver...", "¡Madre mía!...")</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableHumanInterjections ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, enableHumanInterjections: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Efectos de Sonido Sarcásticos</span>
                  <span className="text-[10px] text-slate-400">Chimes triunfales en aciertos y "wah-wah" cómico en equivocaciones</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.soundEffects !== false}
                  onChange={(e) =>
                    setFormData({ ...formData, soundEffects: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300">Leer preguntas automáticamente en voz alta</span>
                <input
                  type="checkbox"
                  checked={formData.autoSpeakQuestions}
                  onChange={(e) =>
                    setFormData({ ...formData, autoSpeakQuestions: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
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
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            {isSavedNotice ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{isSavedNotice ? '¡Guardado!' : 'Guardar y Aplicar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
