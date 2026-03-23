interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function Logo({ size = 24, showText = true, className = '' }: LogoProps) {
  const s = size
  const corner = Math.round(s * 0.25)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Face-scan bracket SVG */}
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Top-left bracket */}
        <path
          d={`M2 ${corner} L2 2 L${corner} 2`}
          stroke="#60a5fa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Top-right bracket */}
        <path
          d={`M${24 - corner} 2 L22 2 L22 ${corner}`}
          stroke="#60a5fa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom-left bracket */}
        <path
          d={`M2 ${24 - corner} L2 22 L${corner} 22`}
          stroke="#60a5fa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom-right bracket */}
        <path
          d={`M${24 - corner} 22 L22 22 L22 ${24 - corner}`}
          stroke="#60a5fa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Eyes */}
        <circle cx="9" cy="10" r="1.2" fill="#60a5fa" />
        <circle cx="15" cy="10" r="1.2" fill="#60a5fa" />
        {/* Subtle smile arc */}
        <path
          d="M9.5 14.5 Q12 16.5 14.5 14.5"
          stroke="#60a5fa"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showText && (
        <span
          className="font-semibold text-text-primary leading-none"
          style={{ fontSize: Math.round(s * 0.6) }}
        >
          FacePulse
        </span>
      )}
    </div>
  )
}
