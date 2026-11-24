import React from 'react';
import { Flame, Zap, Target, Settings, Upload, BookOpen, TrendingUp, Sun, Moon } from 'lucide-react';
import { AppSettings, AppTheme, PersonalityMode, UserStats } from '../types';

interface HeaderStatsProps {
  stats: UserStats;
  personality: PersonalityMode;
  settings: AppSettings;
  unpracticedErrorsCount: number;
  theme: AppTheme;
  onToggleTheme: () => void;
  onOpenErrorLog: () => void;
  onOpenSettings: () => void;
  onOpenCustomTopic: () => void;
  onOpenImportModal: () => void;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  stats,
  personality,
  unpracticedErrorsCount,
  theme,
  onToggleTheme,
  onOpenErrorLog,
  onOpenSettings,
  onOpenCustomTopic,
  onOpenImportModal,
}) => {
  const accuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
      : 100;

  const personalityConfig: Record<PersonalityMode, { emoji: string; label: string }> = {
    ironico_suave:    { emoji: '😏', label: 'Irónico' },
    sarcastico_brutal:{ emoji: '🗡️', label: 'Brutal' },
    sargento_estricto:{ emoji: '🎖️', label: 'Sargento' },
    humillacion_epica:{ emoji: '🔥', label: 'Roast' },
  };

  const pc = personalityConfig[personality];
  const isDark = theme === 'dark';

  return (
    <header
      className="sticky top-0 z-30 px-4 lg:px-8 py-3 transition-all duration-300"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

        {/* ── LOGO ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                boxShadow: '0 0 16px var(--accent-glow)',
              }}
            >
              <span className="text-lg">🦉</span>
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
            >
              {pc.emoji}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                MigoLab
              </h1>
              <span
                className="px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--accent)',
                }}
              >
                {pc.label}
              </span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Tutor IA sarcástico
            </p>
          </div>
        </div>

        {/* ── STATS + ACTIONS ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Streak */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'var(--warning-soft)', border: '1px solid rgba(245,158,11,0.25)' }}
            title="Racha de aciertos"
          >
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" style={{ color: 'var(--warning)' }} />
            <span className="text-sm font-black" style={{ color: 'var(--warning)' }}>{stats.streak}</span>
          </div>

          {/* XP */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-strong)' }}
            title="Puntos XP"
          >
            <Zap className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-black" style={{ color: 'var(--accent)' }}>{stats.xp}</span>
          </div>

          {/* Accuracy */}
          <div
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'var(--success-soft)', border: '1px solid rgba(16,185,129,0.25)' }}
            title="Precisión"
          >
            <Target className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
            <span className="text-sm font-black" style={{ color: 'var(--success)' }}>{accuracy}%</span>
          </div>

          {/* Error Log */}
          <button
            onClick={onOpenErrorLog}
            className="relative p-2 rounded-xl transition-all hover:scale-110"
            style={{
              background: unpracticedErrorsCount > 0 ? 'var(--error-soft)' : 'var(--bg-raised)',
              border: `1px solid ${unpracticedErrorsCount > 0 ? 'var(--error)' : 'var(--border-soft)'}`,
            }}
            title={`${unpracticedErrorsCount} errores sin practicar`}
          >
            <TrendingUp className="w-4 h-4" style={{ color: unpracticedErrorsCount > 0 ? 'var(--error)' : 'var(--text-muted)' }} />
            {unpracticedErrorsCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                style={{ background: 'var(--error)' }}
              >
                {unpracticedErrorsCount > 9 ? '9+' : unpracticedErrorsCount}
              </span>
            )}
          </button>

          {/* Import */}
          <button
            onClick={onOpenImportModal}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
            title="Importar preguntas"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Custom Topic */}
          <button
            onClick={onOpenCustomTopic}
            className="hidden sm:flex p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
            title="Tema libre"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* ── THEME TOGGLE ── */}
          <button
            onClick={onToggleTheme}
            className="theme-toggle flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: isDark
                ? 'rgba(30,45,74,0.8)'
                : 'rgba(224,231,255,0.8)',
              borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(79,70,229,0.3)',
            }}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            ) : (
              <Sun className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl transition-all hover:scale-110 hover:rotate-45 duration-300"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
