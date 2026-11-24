// speechService.ts: Web Speech API & Neural Voice Providers (ElevenLabs, OpenAI TTS, Web Speech API)

import { TTSProvider } from '../types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechTone = 'neutral' | 'sarcastic' | 'impressed' | 'question';

export interface SpeakOptions {
  language?: 'es-ES' | 'en-US';
  tone?: SpeechTone;
  basePitch?: number;
  baseRate?: number;
  preferredVoiceURI?: string;
  ttsProvider?: TTSProvider;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  openAITtsApiKey?: string;
  openAITtsVoice?: string;
  enableInterjections?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class SpeechService {
  private recognition: any | null = null;
  private isListeningActive = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voiceListeners: Array<() => void> = [];
  private currentSessionId = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
        this.voiceListeners.forEach((cb) => cb());
      };
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  public onVoicesChanged(callback: () => void): () => void {
    this.voiceListeners.push(callback);
    if (this.cachedVoices.length > 0) {
      callback();
    }
    return () => {
      this.voiceListeners = this.voiceListeners.filter((cb) => cb !== callback);
    };
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0) {
      this.loadVoices();
    }
    return this.cachedVoices;
  }

  public isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public startListening(options: {
    language: 'en-US' | 'es-ES';
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onEnd: () => void;
  }): boolean {
    if (!this.isRecognitionSupported()) {
      options.onError('Tu navegador no soporta SpeechRecognition. Usa Google Chrome o Microsoft Edge.');
      return false;
    }

    this.stopListening();
    this.stopSpeaking();

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = options.language;
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.isListeningActive = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (finalTranscript.trim().length > 0) {
          options.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim().length > 0) {
          options.onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        this.isListeningActive = false;
        let message = `Error de micrófono: ${event.error}`;
        if (event.error === 'not-allowed') {
          message = 'Permiso de micrófono denegado. Permite el acceso al micrófono en la barra de tu navegador.';
        } else if (event.error === 'no-speech') {
          message = 'No se detectó voz. Vuelve a intentarlo pulsando el micrófono o la barra espaciadora.';
        } else if (event.error === 'network') {
          message = 'Error de red en el reconocimiento de voz nativo.';
        }
        options.onError(message);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        options.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      options.onError(`No se pudo iniciar el micrófono: ${err.message}`);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isListeningActive = false;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  /**
   * Finds the best voice, actively avoiding Windows legacy desktop voices (Helena/Sabina Desktop)
   */
  public getBestVoice(language: 'es-ES' | 'en-US', preferredVoiceURI?: string): SpeechSynthesisVoice | null {
    if (!this.isSynthesisSupported()) return null;
    if (this.cachedVoices.length === 0) {
      this.loadVoices();
    }

    if (preferredVoiceURI) {
      const explicitVoice = this.cachedVoices.find(
        (v) => v.voiceURI === preferredVoiceURI || v.name === preferredVoiceURI
      );
      if (explicitVoice) return explicitVoice;
    }

    const langPrefix = language.split('-')[0].toLowerCase();
    const candidateVoices = this.cachedVoices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith(langPrefix) ||
        v.lang.toLowerCase().replace('_', '-').startsWith(language.toLowerCase())
    );

    if (candidateVoices.length === 0) {
      return this.cachedVoices[0] || null;
    }

    // 1. Filter out legacy SAPI5 robotic Desktop voices whenever modern online/neural voices exist
    const nonDesktopVoices = candidateVoices.filter((v) => !v.name.toLowerCase().includes('desktop'));
    const pool = nonDesktopVoices.length > 0 ? nonDesktopVoices : candidateVoices;

    // 2. Separate into Modern Neural/Natural vs Standard
    const naturalVoices = pool.filter((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes('natural') ||
        name.includes('online') ||
        name.includes('neural') ||
        name.includes('google')
      );
    });

    const priorityPool = naturalVoices.length > 0 ? naturalVoices : pool;

    // 3. Priority tier for expressive, charismatic voices
    const preferredNames = [
      'natural',
      'online',
      'jorge',
      'alvaro',
      'dalia',
      'monica',
      'alonso',
      'guy',
      'jenny',
      'google español',
      'google us english',
      'google uk english male',
      'google'
    ];

    for (const pref of preferredNames) {
      const match = priorityPool.find((v) => v.name.toLowerCase().includes(pref));
      if (match) return match;
    }

    return priorityPool[0] || candidateVoices[0];
  }

  /**
   * Injects human conversational vocalizations and micro-pauses
   */
  public humanizeText(text: string, tone: SpeechTone, enableInterjections: boolean = true): string {
    let result = text.trim();

    if (enableInterjections) {
      const clean = result.replace(/^["'¡¿]+/, '');
      const alreadyHasExclamation = /^(pff|madre mía|a ver|oof|por favor|vaya|caramba|milagro|bravo)/i.test(clean);

      if (!alreadyHasExclamation) {
        if (tone === 'sarcastic') {
          const sarcasticInterjections = [
            '¡Pff!... ',
            'A ver, a ver... ',
            '¡Madre mía!... ',
            '¡Oof!... ',
            '¡Por favor!... ',
            'Vaya, vaya... ',
            'En fin... '
          ];
          const chosen = sarcasticInterjections[Math.floor(Math.random() * sarcasticInterjections.length)];
          result = chosen + result;
        } else if (tone === 'impressed') {
          const impressedInterjections = [
            '¡Vaya!... ',
            '¡Caramba!... ',
            '¡Milagro!... ',
            '¡Bravo!... ',
            '¡Ojo al dato!... '
          ];
          const chosen = impressedInterjections[Math.floor(Math.random() * impressedInterjections.length)];
          result = chosen + result;
        }
      }
    }

    // Add brief rhetorical micro-pauses after punctuation
    return result
      .replace(/([!?.])\s+/g, '$1 ... ')
      .replace(/(¿|\?)/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Main Speak dispatcher: routes to ElevenLabs, OpenAI TTS, or Web Speech API
   */
  public async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    this.stopSpeaking();
    const sessionId = ++this.currentSessionId;

    const {
      language = 'es-ES',
      tone = 'neutral',
      basePitch = 1.15,
      baseRate = 1.05,
      preferredVoiceURI,
      ttsProvider = 'browser',
      elevenLabsApiKey,
      elevenLabsVoiceId = 'pNInz6obpgDQGcFmaJgB', // Adam / default charismatic
      openAITtsApiKey,
      openAITtsVoice = 'onyx',
      enableInterjections = true,
      onStart,
      onEnd,
      onError,
    } = options;

    const processedText = this.humanizeText(text, tone, enableInterjections);

    // 1. Try ElevenLabs Ultra-Human AI Voice
    if (ttsProvider === 'elevenlabs' && elevenLabsApiKey && elevenLabsApiKey.trim()) {
      try {
        if (this.currentSessionId !== sessionId) return;
        if (onStart) onStart();
        const success = await this.playElevenLabsTTS(processedText, elevenLabsApiKey.trim(), elevenLabsVoiceId, onEnd, onError);
        if (success) return;
      } catch (err) {
        console.warn('ElevenLabs TTS failed, falling back to Web Speech:', err);
      }
    }

    // 2. Try OpenAI TTS HD Voice
    if (ttsProvider === 'openai' && openAITtsApiKey && openAITtsApiKey.trim()) {
      try {
        if (this.currentSessionId !== sessionId) return;
        if (onStart) onStart();
        const success = await this.playOpenAITTS(processedText, openAITtsApiKey.trim(), openAITtsVoice, onEnd, onError);
        if (success) return;
      } catch (err) {
        console.warn('OpenAI TTS failed, falling back to Web Speech:', err);
      }
    }

    // 3. High-Quality Web Speech API Fallback
    if (!this.isSynthesisSupported()) {
      if (onEnd) onEnd();
      return;
    }

    if (this.currentSessionId !== sessionId) return;

    const utterance = new SpeechSynthesisUtterance(processedText);
    this.currentUtterance = utterance;

    const voice = this.getBestVoice(language, preferredVoiceURI);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = language;

    if (tone === 'sarcastic') {
      utterance.pitch = Math.min(2.0, Math.max(0.6, basePitch * 1.08));
      utterance.rate = Math.min(1.8, Math.max(0.7, baseRate * 1.02));
    } else if (tone === 'impressed') {
      utterance.pitch = Math.min(2.0, Math.max(0.6, basePitch * 1.05));
      utterance.rate = Math.min(1.8, Math.max(0.7, baseRate * 1.06));
    } else if (tone === 'question') {
      utterance.pitch = Math.min(2.0, Math.max(0.6, basePitch));
      utterance.rate = Math.min(1.8, Math.max(0.7, baseRate * 0.98));
    } else {
      utterance.pitch = basePitch;
      utterance.rate = baseRate;
    }

    utterance.onstart = () => {
      if (this.currentSessionId === sessionId && onStart) onStart();
    };

    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      console.warn('SpeechSynthesis error:', e);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    try {
      if (this.currentSessionId === sessionId) {
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error('Failed to trigger speech synthesis:', e);
      if (onEnd) onEnd();
    }
  }

  /**
   * Play ElevenLabs Ultra-Realistic Voice
   */
  private async playElevenLabsTTS(
    text: string,
    apiKey: string,
    voiceId: string,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<boolean> {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || `Error ElevenLabs (${res.status})`);
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    return this.playAudioElement(audioUrl, onEnd, onError);
  }

  /**
   * Play OpenAI TTS HD Voice
   */
  private async playOpenAITTS(
    text: string,
    apiKey: string,
    voice: string,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<boolean> {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error OpenAI TTS (${res.status})`);
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    return this.playAudioElement(audioUrl, onEnd, onError);
  }

  /**
   * Helper to play audio blob via HTMLAudioElement
   */
  private playAudioElement(
    audioUrl: string,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      this.activeAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.activeAudio = null;
        if (onEnd) onEnd();
        resolve(true);
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        this.activeAudio = null;
        if (onError) onError(e);
        if (onEnd) onEnd();
        resolve(false);
      };

      audio.play().catch((err) => {
        console.warn('Audio play error:', err);
        URL.revokeObjectURL(audioUrl);
        this.activeAudio = null;
        if (onEnd) onEnd();
        resolve(false);
      });
    });
  }

  public stopSpeaking(): void {
    this.currentSessionId++;
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.src = '';
      } catch {
        // Ignore
      }
      this.activeAudio = null;
    }

    if (this.isSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return this.currentUtterance !== null || (this.activeAudio !== null && !this.activeAudio.paused);
  }
}

export const speechService = new SpeechService();
