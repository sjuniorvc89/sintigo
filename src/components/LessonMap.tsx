import React from 'react';
import {
  MessageCircle,
  Briefcase,
  Binary,
  Sparkles,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Plus,
  Trash2,
  BookOpen,
  Globe,
  Pencil,
} from 'lucide-react';
import { CourseModule } from '../types';

interface LessonMapProps {
  modules: CourseModule[];
  activeModuleId: string;
  onSelectModule: (module: CourseModule) => void;
  onOpenCustomTopic: () => void;
  onOpenAddTopic: () => void;
  onEditModule: (module: CourseModule) => void;
  onDeleteModule: (moduleId: string) => void;
  scrollTargetRef?: React.RefObject<HTMLDivElement | null>;
}

export const LessonMap: React.FC<LessonMapProps> = ({
  modules,
  activeModuleId,
  onSelectModule,
  onOpenCustomTopic,
  onOpenAddTopic,
  onEditModule,
  onDeleteModule,
  scrollTargetRef,
}) => {
  const getIcon = (iconName: string, active: boolean) => {
    const cls = `w-5 h-5 ${active ? 'text-white' : ''}`;
    switch (iconName) {
      case 'MessageCircle': return <MessageCircle className={cls} />;
      case 'Briefcase':     return <Briefcase className={cls} />;
      case 'Binary':        return <Binary className={cls} />;
      case 'Sparkles':      return <Sparkles className={cls} />;
      case 'BookOpen':      return <BookOpen className={cls} />;
      case 'Globe':         return <Globe className={cls} />;
      default:              return <MessageCircle className={cls} />;
    }
  };

  const handleSelect = (mod: CourseModule) => {
    onSelectModule(mod);
    // Scroll to quiz area instantly
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>Rutas de Estudio</span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-strong)',
                color: 'var(--accent)',
              }}
            >
              {modules.length}
            </span>
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Selecciona un tema — Migo cargará el desafío automáticamente
          </p>
        </div>

        <button
          onClick={onOpenAddTopic}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white shrink-0 transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            boxShadow: '0 6px 20px var(--accent-glow)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Tema
        </button>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {modules.map((mod, index) => {
          const isActive  = mod.id === activeModuleId;
          const isBlocked = mod.isGatekeepingActive;
          const progress  = Math.min(100, Math.round((mod.completedLessons / mod.totalLessons) * 100));

          return (
            <div
              key={mod.id}
              onClick={() => handleSelect(mod)}
              className={`module-card p-4 flex flex-col gap-3 ${isActive ? 'active' : ''} ${isBlocked ? 'blocked' : ''}`}
            >
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: isBlocked
                        ? 'var(--error-soft)'
                        : isActive
                        ? 'linear-gradient(135deg, var(--accent), #8b5cf6)'
                        : 'var(--bg-raised)',
                      border: isBlocked
                        ? '1px solid var(--error)'
                        : isActive
                        ? 'none'
                        : '1px solid var(--border-soft)',
                      boxShadow: isActive ? '0 4px 16px var(--accent-glow)' : 'none',
                      color: isBlocked
                        ? 'var(--error)'
                        : isActive
                        ? '#fff'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {isBlocked
                      ? <ShieldAlert className="w-5 h-5 animate-pulse" style={{ color: 'var(--error)' }} />
                      : getIcon(mod.icon, isActive)
                    }
                  </div>

                  {/* Title block */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        MÓDULO {index + 1}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          background: isBlocked
                            ? 'var(--error-soft)'
                            : isActive
                            ? 'var(--accent-soft)'
                            : 'var(--bg-raised)',
                          border: `1px solid ${isBlocked ? 'var(--error)' : isActive ? 'var(--accent)' : 'var(--border-soft)'}`,
                          color: isBlocked
                            ? 'var(--error)'
                            : isActive
                            ? 'var(--accent)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {mod.badge}
                      </span>
                    </div>
                    <h3
                      className="font-black text-sm leading-tight truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {mod.title}
                    </h3>
                  </div>
                </div>

                {/* Right side: edit + delete + status */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditModule(mod);
                    }}
                    className="p-1.5 rounded-lg transition-all hover:scale-110"
                    style={{ color: 'var(--text-muted)' }}
                    title="Editar tema y preguntas"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Eliminar el tema "${mod.title}"?`)) onDeleteModule(mod.id);
                      }}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      style={{ color: 'var(--text-muted)' }}
                      title="Eliminar tema"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isBlocked ? (
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{
                        background: 'var(--error-soft)',
                        border: '1px solid var(--error)',
                        color: 'var(--error)',
                      }}
                    >
                      <Lock className="w-3 h-3" />
                      <span className="hidden sm:inline">Repaso</span>
                    </div>
                  ) : isActive ? (
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black"
                      style={{
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-ping"
                        style={{ background: 'var(--accent)' }}
                      />
                      Activo
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-xs font-medium line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {mod.subtitle}
              </p>

              {/* Gatekeeping alert */}
              {isBlocked && (
                <div
                  className="p-2.5 rounded-xl flex items-start gap-2"
                  style={{
                    background: 'var(--error-soft)',
                    border: '1px solid var(--error)',
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--error)' }}>
                    Avance bloqueado — {mod.gatekeepingCurrentStreak}/{mod.gatekeepingStreakRequired} aciertos para desbloquear
                  </p>
                </div>
              )}

              {/* Footer: language + progress */}
              <div
                className="flex items-center justify-between gap-2 pt-2.5"
                style={{ borderTop: '1px solid var(--border-soft)' }}
              >
                <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                  <span
                    className="px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)' }}
                  >
                    {mod.languageAnswer === 'en-US' ? '🇺🇸 EN' : '🇪🇸 ES'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="mod-progress-track flex-1 max-w-[80px]">
                    <div
                      className={`mod-progress-fill ${isBlocked ? 'blocked' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                    {mod.completedLessons}/{mod.totalLessons}
                  </span>
                  {progress >= 100 && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditModule(mod);
                  }}
                  className="font-bold flex items-center gap-1 transition-all hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  <Pencil className="w-3 h-3" />
                  <span>Modificar tema y preguntas</span>
                </button>

                {mod.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenCustomTopic(); }}
                    className="font-semibold flex items-center gap-1 transition-all hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Editar apuntes
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
