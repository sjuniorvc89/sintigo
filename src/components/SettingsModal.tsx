import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Cpu,
  Smile,
  Volume2,
  ShieldCheck,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Database,
  Cloud,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { AIProvider, AppSettings, PersonalityMode } from '../types';
import { speechService } from '../services/speechService';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';

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
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCloudKey, setShowCloudKey] = useState(false);

  // Cloud sync state
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<{ success: boolean; message: string } | null>(null);

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
    const currentProvider = formData.provider;
    const updated = { ...formData };
    if (currentProvider === 'gemini') updated.geminiApiKey = formData.apiKey;
    if (currentProvider === 'groq') updated.groqApiKey = formData.apiKey;
    if (currentProvider === 'openrouter') updated.openRouterApiKey = formData.apiKey;

    let nextKey = '';
    let defaultModel = 'gemini-2.0-flash';
    if (newProvider === 'gemini') {
      nextKey = updated.geminiApiKey || (currentProvider === 'gemini' ? formData.apiKey : '');
      defaultModel = updated.model && updated.model.startsWith('gemini') ? updated.model : 'gemini-2.0-flash';
    } else if (newProvider === 'groq') {
      nextKey = updated.groqApiKey || '';
      defaultModel = 'llama-3.3-70b-versatile';
    } else if (newProvider === 'openrouter') {
      nextKey = updated.openRouterApiKey || '';
      defaultModel = 'google/gemini-2.0-flash-lite-001';
    }

    setFormData({
      ...updated,
      provider: newProvider,
      apiKey: nextKey,
      model: defaultModel,
    });
    setTestResult(null);
  };

  const handleSave = () => {
    const updated = { ...formData };
    if (formData.provider === 'gemini') updated.geminiApiKey = formData.apiKey;
    if (formData.provider === 'groq') updated.groqApiKey = formData.apiKey;
    if (formData.provider === 'openrouter') updated.openRouterApiKey = formData.apiKey;

    onSave(updated);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleSyncCloud = async () => {
    if (!formData.cloudDbUrl || !formData.cloudDbUrl.trim()) {
      setCloudSyncResult({
        success: false,
        message: 'Ingresa la URL del endpoint de tu base de datos en AWS / Nube.',
      });
      return;
    }

    setIsSyncingCloud(true);
    setCloudSyncResult(null);

    const res = await storageService.syncWithCloud(
      formData.cloudDbUrl,
      formData.cloudDbApiKey
    );

    setIsSyncingCloud(false);
    setCloudSyncResult(res);
  };

  const handleExportDatabase = () => {
    storageService.exportDatabaseBackup();
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const result = storageService.importDatabaseBackup(text);
      if (result.success) {
        alert(result.message);
        window.location.reload();
      } else {
        alert(result.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await geminiService.testConnection({
      provider: formData.provider,
      apiKey: formData.apiKey,
      model: formData.model,
    });

    if (result.success && result.suggestedModel && result.suggestedModel !== formData.model) {
      setFormData((prev) => ({ ...prev, model: result.suggestedModel! }));
    }

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

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => {
                    setFormData({ ...formData, apiKey: e.target.value });
                    setTestResult(null);
                  }}
                  placeholder={`Pega aquí tu clave de ${providerLinks[formData.provider].name}...`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  title={showApiKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

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
                <option value="gemini-2.0-flash">gemini-2.0-flash (Recomendado - Gratuito, ultra veloz)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Nueva generación - Razonamiento ágil)</option>
                <option value="gemini-1.5-flash-latest">gemini-1.5-flash-latest (1.5 Flash estable)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Versión clásica)</option>
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

          {/* Database & AWS Amplify Cloud Section */}
          {(() => {
            const dbSummary = storageService.getDatabaseSummary();
            return (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Base de Datos & Nube (AWS Amplify)</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Persistencia de temas, preguntas modificadas, claves de API y estadísticas
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      formData.cloudDbUrl && formData.cloudDbUrl.trim()
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {formData.cloudDbUrl && formData.cloudDbUrl.trim() ? (
                      <>
                        <Cloud className="w-3 h-3" />
                        <span>Nube AWS</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span>Local ($0 Costo)</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Database Metrics Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-400 font-semibold">Temas</span>
                    <span className="text-sm font-black text-slate-100 font-mono">
                      {dbSummary.totalModules}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-400 font-semibold">Preguntas</span>
                    <span className="text-sm font-black text-slate-100 font-mono">
                      {dbSummary.totalQuestions}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="block text-[10px] text-slate-400 font-semibold">Errores</span>
                    <span className="text-sm font-black text-slate-100 font-mono">
                      {dbSummary.totalErrors}
                    </span>
                  </div>
                </div>

                {/* Cloud DB Endpoint URL */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>URL Endpoint de Base de Datos en AWS Amplify:</span>
                    <span className="text-[10px] text-slate-500 font-normal">API Gateway / AppSync / REST</span>
                  </label>
                  <input
                    type="url"
                    value={formData.cloudDbUrl || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, cloudDbUrl: e.target.value });
                      setCloudSyncResult(null);
                    }}
                    placeholder="https://xxxxxx.appsync-api.us-east-1.amazonaws.com/graphql o REST URL..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Cloud DB API Key / Auth Token */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Clave / Token de Autorización de la Base de Datos:
                  </label>
                  <div className="relative">
                    <input
                      type={showCloudKey ? 'text' : 'password'}
                      value={formData.cloudDbApiKey || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, cloudDbApiKey: e.target.value });
                        setCloudSyncResult(null);
                      }}
                      placeholder="AWS API Key / Bearer Token (opcional)..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCloudKey(!showCloudKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showCloudKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Sync Action & Feedback */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncCloud}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSyncingCloud ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Sincronizar con AWS Nube</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportDatabase}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                      title="Descargar copia de seguridad completa en formato JSON"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Exportar JSON</span>
                    </button>

                    <label
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-initial"
                      title="Restaurar base de datos desde un archivo JSON"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Restaurar JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportDatabase}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Cloud Sync Status Banner */}
                {cloudSyncResult && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                      cloudSyncResult.success
                        ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-700/50 text-rose-200'
                    }`}
                  >
                    {cloudSyncResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{cloudSyncResult.message}</span>
                  </div>
                )}

                {/* AWS Amplify Backend notice */}
                <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  ⚡ <strong>AWS Amplify Backend Gen 2:</strong> Los esquemas de DynamoDB para <em>CourseModule</em>, <em>QuestionItem</em>, <em>UserProfile</em> y <em>ErrorLog</em> ya están listos en la carpeta <code>amplify/</code> para desplegar con <code>npx ampx sandbox</code> o mediante la consola de AWS.
                </p>
              </div>
            );
          })()}
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
