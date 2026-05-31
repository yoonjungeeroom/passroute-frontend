interface AuthBrandingPanelProps {
  subtitle: string
  description?: string
}

export function AuthBrandingPanel({ subtitle, description }: AuthBrandingPanelProps) {
  return (
    <div className="hidden md:flex w-5/12 bg-linear-to-br from-[var(--color-primary)] to-[var(--color-accent)] p-10 flex-col justify-between relative overflow-hidden">
      {/* Logo */}
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-white tracking-tight">passroute</h2>
      </div>

      {/* Tagline */}
      <div className="relative z-10">
        <p className="text-white text-2xl font-bold leading-snug whitespace-pre-line mb-3">{subtitle}</p>
        {description && (
          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        )}
      </div>

      {/* Illustration */}
      <div className="relative z-10 mt-4">
        <svg viewBox="0 0 220 160" fill="none" className="w-48 opacity-90">
          {/* Document/folder stack */}
          <rect x="20" y="50" width="90" height="70" rx="8" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
          <rect x="30" y="42" width="80" height="70" rx="8" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
          {/* Document lines */}
          <rect x="42" y="58" width="45" height="4" rx="2" fill="white" fillOpacity="0.3" />
          <rect x="42" y="68" width="35" height="4" rx="2" fill="white" fillOpacity="0.2" />
          <rect x="42" y="78" width="50" height="4" rx="2" fill="white" fillOpacity="0.2" />
          <rect x="42" y="88" width="28" height="4" rx="2" fill="white" fillOpacity="0.15" />

          {/* Magnifying glass */}
          <circle cx="145" cy="95" r="22" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
          <circle cx="145" cy="95" r="14" fill="white" fillOpacity="0.08" />
          <line x1="162" y1="112" x2="178" y2="128" stroke="white" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />

          {/* Chat bubbles */}
          <rect x="120" y="20" width="55" height="24" rx="12" fill="white" fillOpacity="0.2" />
          <circle cx="137" cy="32" r="2" fill="white" fillOpacity="0.35" />
          <circle cx="145" cy="32" r="2" fill="white" fillOpacity="0.35" />
          <circle cx="153" cy="32" r="2" fill="white" fillOpacity="0.35" />

          {/* Person icon */}
          <circle cx="100" cy="20" r="10" fill="white" fillOpacity="0.18" />
          <path d="M86 42 Q86 32 100 32 Q114 32 114 42" fill="white" fillOpacity="0.12" />

          {/* Sparkle dots */}
          <circle cx="190" cy="60" r="3" fill="white" fillOpacity="0.25" />
          <circle cx="10" y="30" r="2" fill="white" fillOpacity="0.15" />
          <circle cx="200" cy="140" r="4" fill="white" fillOpacity="0.12" />
        </svg>
      </div>

      {/* Background decorative circles */}
      <div className="absolute -top-15 -right-15 w-60 h-60 rounded-full bg-white opacity-[0.06]" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white opacity-[0.06]" />
    </div>
  )
}
