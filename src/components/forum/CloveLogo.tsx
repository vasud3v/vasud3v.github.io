interface CloveLogoProps {
  size?: number;
  className?: string;
}

export default function CloveLogo({ size = 32, className = '' }: CloveLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="clove-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FF2D92', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ff6bb7', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="clove-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background */}
      <rect width="32" height="32" rx="6" fill="#0d0d12" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="5.5"
        stroke="url(#clove-gradient)"
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
      {/* Subtle glow ring */}
      <circle
        cx="16"
        cy="15"
        r="9"
        fill="none"
        stroke="url(#clove-gradient)"
        strokeOpacity="0.15"
        strokeWidth="4"
      />
      {/* Center petal */}
      <path
        d="M16 6 C18.5 9, 19.5 12, 19 15.5 C18.6 18, 16 19, 16 19 C16 19, 13.4 18, 13 15.5 C12.5 12, 13.5 9, 16 6Z"
        fill="url(#clove-gradient)"
        filter="url(#clove-glow)"
      />
      {/* Left petal */}
      <path
        d="M9.5 18.5 C11 15.5, 13 14, 15.5 14 C16.5 14, 16.5 15, 16 15.8 C15 17.5, 12.5 19.5, 9.5 18.5Z"
        fill="url(#clove-gradient)"
        fillOpacity="0.85"
      />
      {/* Right petal */}
      <path
        d="M22.5 18.5 C21 15.5, 19 14, 16.5 14 C15.5 14, 15.5 15, 16 15.8 C17 17.5, 19.5 19.5, 22.5 18.5Z"
        fill="url(#clove-gradient)"
        fillOpacity="0.85"
      />
      {/* Stem lines */}
      <path
        d="M16 19 C16 19, 15.5 22, 14.5 24.5"
        stroke="url(#clove-gradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
      <path
        d="M16 19 C16 19, 16.8 21.5, 18 23.5"
        stroke="url(#clove-gradient)"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      {/* Inner highlight */}
      <ellipse cx="16" cy="13" rx="1.8" ry="3" fill="white" fillOpacity="0.2" />
      {/* Core dot */}
      <circle cx="16" cy="14.5" r="1.2" fill="white" fillOpacity="0.9" />
      <circle cx="16" cy="14.5" r="0.6" fill="url(#clove-gradient)" />
    </svg>
  );
}
