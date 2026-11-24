import React, { useRef } from 'react';
import { MascotMood } from '../types';

interface MascotAvatarProps {
  mood: MascotMood;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animationKey?: number; // bump to trigger re-animation
}

export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  mood,
  isSpeaking = false,
  size = 'lg',
  className = '',
  animationKey = 0,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const sizeMap = {
    sm: 'w-28 h-28',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
    xl: 'w-72 h-72',
  };

  const isListening = mood === 'escuchando';
  const isMocking = mood === 'burlesco';
  const isImpressed = mood === 'impresionado';
  const isThinking = mood === 'pensando';

  // Animation class based on mood + speaking
  const getBodyAnim = () => {
    if (isImpressed) return 'animate-celebrate';
    if (isMocking) return 'animate-shame';
    if (isThinking) return 'animate-thinking';
    if (isSpeaking) return 'animate-float';
    return 'animate-float';
  };

  // Halo color
  const haloColor = isImpressed
    ? 'rgba(16, 185, 129, 0.35)'
    : isMocking
    ? 'rgba(244, 63, 94, 0.35)'
    : isThinking
    ? 'rgba(245, 158, 11, 0.3)'
    : isListening
    ? 'rgba(6, 182, 212, 0.4)'
    : 'rgba(99, 102, 241, 0.25)';

  const wrapClass = isImpressed
    ? 'mascot-wrap mood-success'
    : isMocking
    ? 'mascot-wrap mood-error'
    : isThinking
    ? 'mascot-wrap mood-thinking'
    : 'mascot-wrap';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>

      {/* Pulsing ring when speaking */}
      {isSpeaking && (
        <>
          <div
            className="absolute rounded-full ring-pulse border-2"
            style={{
              width: '110%',
              height: '110%',
              borderColor: 'rgba(99,102,241,0.5)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
            }}
          />
          <div
            className="absolute rounded-full ring-pulse border"
            style={{
              width: '130%',
              height: '130%',
              borderColor: 'rgba(99,102,241,0.25)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              animationDelay: '0.4s',
            }}
          />
        </>
      )}

      {/* Aurora halo behind mascot */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          width: '90%',
          height: '90%',
          background: haloColor,
          top: '10%',
          left: '5%',
        }}
      />

      {/* Animated SVG Mascot */}
      <svg
        key={animationKey}
        ref={svgRef}
        viewBox="0 0 240 240"
        className={`${sizeMap[size]} ${wrapClass} ${getBodyAnim()} relative z-10`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`owlBody_${animationKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isImpressed ? '#10B981' : isMocking ? '#be123c' : '#5B21B6'} />
            <stop offset="45%" stopColor={isImpressed ? '#059669' : isMocking ? '#9f1239' : '#4338CA'} />
            <stop offset="100%" stopColor={isImpressed ? '#065F46' : isMocking ? '#881337' : '#1E1B4B'} />
          </linearGradient>
          <linearGradient id={`belly_${animationKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isImpressed ? '#D1FAE5' : isMocking ? '#FFE4E6' : '#E0E7FF'} />
            <stop offset="100%" stopColor={isImpressed ? '#A7F3D0' : isMocking ? '#FECDD3' : '#C7D2FE'} />
          </linearGradient>
          <linearGradient id={`goldCap_${animationKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id={`glassesGlass_${animationKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
          </linearGradient>
          <filter id={`glow_${animationKey}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stars around mascot when impressed */}
        {isImpressed && (
          <g>
            <text x="20" y="60" fontSize="18" className="animate-bounce" style={{animationDelay:'0ms'}}>⭐</text>
            <text x="195" y="55" fontSize="14" className="animate-bounce" style={{animationDelay:'200ms'}}>✨</text>
            <text x="12" y="140" fontSize="14" className="animate-bounce" style={{animationDelay:'400ms'}}>🌟</text>
            <text x="205" y="145" fontSize="16" className="animate-bounce" style={{animationDelay:'100ms'}}>⭐</text>
          </g>
        )}

        {/* Angry marks when mocking */}
        {isMocking && (
          <g>
            <text x="175" y="80" fontSize="22" className="animate-bounce">💢</text>
            <text x="12" y="90" fontSize="14" className="animate-pulse">😤</text>
          </g>
        )}

        {/* Thinking bubbles */}
        {isThinking && (
          <g className="animate-pulse">
            <circle cx="195" cy="40" r="6" fill="rgba(245,158,11,0.6)" />
            <circle cx="210" cy="25" r="9" fill="rgba(245,158,11,0.5)" />
            <circle cx="225" cy="10" r="12" fill="rgba(245,158,11,0.4)" />
            <text x="216" y="15" fontSize="10" textAnchor="middle" dominantBaseline="middle">?</text>
          </g>
        )}

        {/* Wings — position changes with mood */}
        <g>
          {/* Left Wing */}
          <path
            d={
              isMocking
                ? 'M 42 128 C 18 138 10 170 44 186 C 54 162 56 142 42 128 Z'
                : isImpressed
                ? 'M 46 108 C 14 96 8 68 36 58 C 52 84 56 100 46 108 Z'
                : isThinking
                ? 'M 44 132 C 24 148 26 178 50 190 C 60 170 60 150 44 132 Z'
                : 'M 45 130 C 25 150 25 180 50 190 C 60 170 60 150 45 130 Z'
            }
            fill={isImpressed ? '#065F46' : isMocking ? '#881337' : '#312E81'}
            className="transition-all duration-500"
          />
          {/* Right Wing */}
          <path
            d={
              isMocking
                ? 'M 198 128 C 222 138 230 170 196 186 C 186 162 184 142 198 128 Z'
                : isImpressed
                ? 'M 194 108 C 226 96 232 68 204 58 C 188 84 184 100 194 108 Z'
                : isThinking
                ? 'M 196 132 C 216 148 214 178 190 190 C 180 170 180 150 196 132 Z'
                : 'M 195 130 C 215 150 215 180 190 190 C 180 170 180 150 195 130 Z'
            }
            fill={isImpressed ? '#065F46' : isMocking ? '#881337' : '#312E81'}
            className="transition-all duration-500"
          />
        </g>

        {/* Main Body */}
        <ellipse cx="120" cy="140" rx="72" ry="76" fill={`url(#owlBody_${animationKey})`} />

        {/* Feather Ear Tufts */}
        <polygon points="65,80 50,43 86,65" fill={isImpressed ? '#065F46' : isMocking ? '#881337' : '#312E81'} />
        <polygon points="175,80 190,43 154,65" fill={isImpressed ? '#065F46' : isMocking ? '#881337' : '#312E81'} />

        {/* Belly */}
        <ellipse cx="120" cy="155" rx="44" ry="48" fill={`url(#belly_${animationKey})`} />

        {/* Belly academic stripes */}
        <path d="M 105 143 C 112 148 128 148 135 143" stroke="rgba(148,163,184,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 102 163 C 112 168 128 168 138 163" stroke="rgba(148,163,184,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 107 183 C 114 188 126 188 133 183" stroke="rgba(148,163,184,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Feet */}
        <path d="M 95 210 Q 100 224 105 210 Q 110 224 115 210" stroke={isImpressed ? '#10B981' : '#F59E0B'} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M 125 210 Q 130 224 135 210 Q 140 224 145 210" stroke={isImpressed ? '#10B981' : '#F59E0B'} strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Eyes & Eyebrows based on mood */}
        <g>
          <circle cx="88" cy="118" r="26" fill="#FFFFFF" />
          <circle cx="152" cy="118" r="26" fill="#FFFFFF" />

          {isMocking ? (
            <>
              <path d="M 66 93 Q 88 78 108 90" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M 132 92 Q 152 106 174 95" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" fill="none" />
              <circle cx="98" cy="116" r="11" fill="#0F172A" />
              <circle cx="95" cy="112" r="3.5" fill="#fff" />
              <circle cx="162" cy="116" r="11" fill="#0F172A" />
              <circle cx="159" cy="112" r="3.5" fill="#fff" />
              {/* Rolling eyes 😒 */}
              <path d="M 188 90 Q 194 82 198 90 Q 194 102 188 90 Z" fill="#38BDF8" opacity="0.9" />
            </>
          ) : isImpressed ? (
            <>
              <path d="M 68 85 Q 88 76 108 85" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M 132 85 Q 152 76 172 85" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
              {/* Star eyes */}
              <circle cx="88" cy="118" r="16" fill="#0F172A" />
              <text x="88" y="122" fontSize="18" textAnchor="middle" dominantBaseline="middle">★</text>
              <circle cx="84" cy="111" r="4.5" fill="#FDE68A" />
              <circle cx="152" cy="118" r="16" fill="#0F172A" />
              <text x="152" y="122" fontSize="18" textAnchor="middle" dominantBaseline="middle">★</text>
              <circle cx="148" cy="111" r="4.5" fill="#FDE68A" />
            </>
          ) : isListening ? (
            <>
              <path d="M 70 90 Q 88 87 106 90" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 134 90 Q 152 87 170 90" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="88" cy="118" r="14" fill="#0284C7" />
              <circle cx="88" cy="118" r="8" fill="#0F172A" />
              <circle cx="84" cy="113" r="3.5" fill="#fff" />
              <circle cx="152" cy="118" r="14" fill="#0284C7" />
              <circle cx="152" cy="118" r="8" fill="#0F172A" />
              <circle cx="148" cy="113" r="3.5" fill="#fff" />
            </>
          ) : isThinking ? (
            <>
              <path d="M 72 90 Q 90 84 106 92" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M 134 92 Q 150 84 168 90" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
              <circle cx="88" cy="110" r="12" fill="#0F172A" />
              <circle cx="86" cy="107" r="3" fill="#fff" />
              <circle cx="152" cy="110" r="12" fill="#0F172A" />
              <circle cx="150" cy="107" r="3" fill="#fff" />
            </>
          ) : (
            <>
              <path d="M 70 92 Q 88 90 106 92" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M 134 92 Q 152 90 170 92" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
              <circle cx="88" cy="118" r="13" fill="#0F172A" />
              <circle cx="84" cy="114" r="4" fill="#fff" />
              <circle cx="152" cy="118" r="13" fill="#0F172A" />
              <circle cx="148" cy="114" r="4" fill="#fff" />
            </>
          )}
        </g>

        {/* Glasses */}
        <g>
          <path d="M 108 118 Q 120 112 132 118" stroke={isImpressed ? '#10B981' : isMocking ? '#F43F5E' : '#F59E0B'} strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <circle cx="88" cy="118" r="28" fill={`url(#glassesGlass_${animationKey})`} stroke={isImpressed ? '#10B981' : isMocking ? '#F43F5E' : '#F59E0B'} strokeWidth="4" />
          <circle cx="152" cy="118" r="28" fill={`url(#glassesGlass_${animationKey})`} stroke={isImpressed ? '#10B981' : isMocking ? '#F43F5E' : '#F59E0B'} strokeWidth="4" />
          <line x1="72" y1="102" x2="84" y2="108" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <line x1="136" y1="102" x2="148" y2="108" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* Beak */}
        <g>
          {isSpeaking ? (
            <polygon points="112,130 128,130 120,150" fill={isImpressed ? '#10B981' : '#F59E0B'} className="animate-pulse" />
          ) : isMocking ? (
            <path d="M 112 132 Q 124 128 130 136 L 120 148 Z" fill="#F43F5E" />
          ) : isImpressed ? (
            <path d="M 110 130 Q 120 142 130 130 L 120 148 Z" fill="#10B981" />
          ) : (
            <polygon points="113,130 127,130 120,145" fill={isThinking ? '#F59E0B' : '#F59E0B'} />
          )}
        </g>

        {/* Bowtie */}
        <g transform="translate(120, 158)">
          <polygon points="-16,-6 -16,6 0,0" fill={isImpressed ? '#10B981' : isMocking ? '#F43F5E' : '#EF4444'} />
          <polygon points="16,-6 16,6 0,0" fill={isImpressed ? '#10B981' : isMocking ? '#F43F5E' : '#EF4444'} />
          <circle cx="0" cy="0" r="4.5" fill={isImpressed ? '#065F46' : isMocking ? '#881337' : '#B91C1C'} />
        </g>

        {/* Graduation Cap */}
        <g className={`transition-transform duration-300 ${isImpressed ? 'translate-y-[-4px]' : ''}`}>
          <polygon points="120,25 185,42 120,58 55,42"
            fill={isImpressed ? '#065F46' : isMocking ? '#881337' : '#1E1B4B'}
            stroke="#0F172A" strokeWidth="2" />
          <path d="M 85 49 L 85 64 Q 120 74 155 64 L 155 49 Z" fill={isImpressed ? '#047857' : '#0F172A'} />
          <circle cx="120" cy="42" r="3.5" fill={`url(#goldCap_${animationKey})`} />
          <path d="M 120 42 C 145 45 160 55 165 72" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="162" y="70" width="6" height="12" rx="2" fill={`url(#goldCap_${animationKey})`} />
        </g>

        {/* Sound bars when speaking */}
        {isSpeaking && (
          <g fill={isImpressed ? '#10B981' : '#818CF8'} opacity="0.8">
            <rect x="22" y="112" width="5" height="16" rx="2.5" className="animate-wave" style={{ animationDelay: '0ms' }} />
            <rect x="12" y="107" width="5" height="26" rx="2.5" className="animate-wave" style={{ animationDelay: '150ms' }} />
            <rect x="2" y="117" width="5" height="10" rx="2.5" className="animate-wave" style={{ animationDelay: '300ms' }} />
            <rect x="213" y="112" width="5" height="16" rx="2.5" className="animate-wave" style={{ animationDelay: '200ms' }} />
            <rect x="223" y="107" width="5" height="26" rx="2.5" className="animate-wave" style={{ animationDelay: '350ms' }} />
            <rect x="233" y="117" width="5" height="10" rx="2.5" className="animate-wave" style={{ animationDelay: '100ms' }} />
          </g>
        )}
      </svg>

      {/* Mood label */}
      <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all duration-500 ${
        isMocking
          ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          : isImpressed
          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
          : isThinking
          ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
          : isListening
          ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
          : 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-300'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          isMocking ? 'bg-rose-400 animate-pulse'
          : isImpressed ? 'bg-emerald-400'
          : isThinking ? 'bg-amber-400 animate-ping'
          : isListening ? 'bg-cyan-400 animate-ping'
          : 'bg-indigo-400 animate-pulse'
        }`} />
        {isMocking ? 'Migo está decepcionado...'
          : isImpressed ? '¡Migo está impresionado!'
          : isThinking ? 'Migo está evaluando...'
          : isListening ? 'Migo escucha...'
          : 'Migo espera tu respuesta'}
      </div>
    </div>
  );
};
