/**
 * Realistic SVG T-shirt component with dynamic fill color.
 * Flat-lay style similar to a Gildan 5000 blank tee.
 */
function TshirtSVG({ color = '#1A1A1A', className = '' }) {
  const darken = (hex, amt = 0.15) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.round(((n >> 16) & 0xFF) * (1 - amt)));
    const g = Math.max(0, Math.round(((n >> 8) & 0xFF) * (1 - amt)));
    const b = Math.max(0, Math.round((n & 0xFF) * (1 - amt)));
    return `rgb(${r},${g},${b})`;
  };

  const lighten = (hex, amt = 0.1) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 0xFF) * (1 + amt)));
    const g = Math.min(255, Math.round(((n >> 8) & 0xFF) * (1 + amt)));
    const b = Math.min(255, Math.round((n & 0xFF) * (1 + amt)));
    return `rgb(${r},${g},${b})`;
  };

  const s1 = darken(color, 0.08);
  const s2 = darken(color, 0.15);
  const s3 = darken(color, 0.25);
  const h1 = lighten(color, 0.06);

  return (
    <svg
      viewBox="0 0 500 560"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        {/* Subtle fabric texture gradient */}
        <radialGradient id="bodyGrad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={h1} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={s1} />
        </radialGradient>
        {/* Shadow gradient for sleeves */}
        <linearGradient id="sleeveL" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor={s2} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id="sleeveR" x1="1" y1="0" x2="0" y2="0.5">
          <stop offset="0%" stopColor={s2} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      {/* ── Main body ── */}
      <path
        d={`
          M155,72
          C145,78 130,88 120,100
          L28,145
          C18,150 12,160 15,170
          L48,210
          C52,216 60,218 66,215
          L95,198
          L95,500
          C95,510 103,518 113,518
          L387,518
          C397,518 405,510 405,500
          L405,198
          L434,215
          C440,218 448,216 452,210
          L485,170
          C488,160 482,150 472,145
          L380,100
          C370,88 355,78 345,72
          C330,95 290,118 250,118
          C210,118 170,95 155,72
          Z
        `}
        fill="url(#bodyGrad)"
      />

      {/* ── Left sleeve ── */}
      <path
        d={`
          M155,72
          C145,78 130,88 120,100
          L28,145
          C18,150 12,160 15,170
          L48,210
          C52,216 60,218 66,215
          L95,198
          L95,155
          C95,130 110,108 130,92
          Z
        `}
        fill="url(#sleeveL)"
        opacity="0.45"
      />

      {/* ── Right sleeve ── */}
      <path
        d={`
          M345,72
          C355,78 370,88 380,100
          L472,145
          C482,150 488,160 485,170
          L452,210
          C448,216 440,218 434,215
          L405,198
          L405,155
          C405,130 390,108 370,92
          Z
        `}
        fill="url(#sleeveR)"
        opacity="0.45"
      />

      {/* ── Collar shadow area ── */}
      <path
        d={`
          M155,72
          C170,95 210,118 250,118
          C290,118 330,95 345,72
          C325,56 290,44 250,44
          C210,44 175,56 155,72
          Z
        `}
        fill={s2}
        opacity="0.35"
      />

      {/* ── Ribbed collar ── */}
      <path
        d={`
          M170,68
          C180,88 210,105 250,105
          C290,105 320,88 330,68
          C315,55 285,46 250,46
          C215,46 185,55 170,68
          Z
        `}
        fill={s3}
        opacity="0.5"
      />
      <path
        d={`
          M175,66
          C185,84 212,100 250,100
          C288,100 315,84 325,66
          C312,54 284,47 250,47
          C216,47 188,54 175,66
          Z
        `}
        fill="none"
        stroke={s3}
        strokeWidth="2.5"
      />
      {/* Inner collar line */}
      <path
        d={`
          M182,64
          C192,78 215,92 250,92
          C285,92 308,78 318,64
        `}
        fill="none"
        stroke={s3}
        strokeWidth="1"
        opacity="0.4"
      />

      {/* ── Collar tag ── */}
      <rect x="244" y="48" width="12" height="8" rx="1" fill={lighten(color, 0.3)} opacity="0.5" />

      {/* ── Fabric wrinkle lines ── */}
      {/* Center fold */}
      <path d="M250,118 L250,512" fill="none" stroke={s1} strokeWidth="0.8" opacity="0.15" />

      {/* Left side subtle wrinkles */}
      <path d="M140,200 C160,210 155,240 145,260" fill="none" stroke={s2} strokeWidth="0.7" opacity="0.12" />
      <path d="M130,300 C150,310 148,340 135,360" fill="none" stroke={s2} strokeWidth="0.6" opacity="0.1" />

      {/* Right side subtle wrinkles */}
      <path d="M360,200 C340,210 345,240 355,260" fill="none" stroke={s2} strokeWidth="0.7" opacity="0.12" />
      <path d="M370,300 C350,310 352,340 365,360" fill="none" stroke={s2} strokeWidth="0.6" opacity="0.1" />

      {/* Chest area subtle highlight */}
      <ellipse cx="250" cy="220" rx="80" ry="60" fill={h1} opacity="0.08" />

      {/* ── Side seams ── */}
      <path d="M95,198 L95,500 C95,510 103,518 113,518" fill="none" stroke={s2} strokeWidth="1" opacity="0.15" />
      <path d="M405,198 L405,500 C405,510 397,518 387,518" fill="none" stroke={s2} strokeWidth="1" opacity="0.15" />

      {/* ── Bottom hem ── */}
      <path
        d="M113,514 L387,514"
        fill="none"
        stroke={s2}
        strokeWidth="2"
        opacity="0.2"
      />
      <path
        d="M113,517 L387,517"
        fill="none"
        stroke={s3}
        strokeWidth="1"
        opacity="0.1"
      />

      {/* ── Sleeve hems ── */}
      <path d="M48,208 L66,215 L95,198" fill="none" stroke={s2} strokeWidth="1.5" opacity="0.2" />
      <path d="M452,208 L434,215 L405,198" fill="none" stroke={s2} strokeWidth="1.5" opacity="0.2" />

      {/* ── Shoulder seams ── */}
      <path d="M155,72 C145,78 130,88 120,100" fill="none" stroke={s2} strokeWidth="1.2" opacity="0.2" />
      <path d="M345,72 C355,78 370,88 380,100" fill="none" stroke={s2} strokeWidth="1.2" opacity="0.2" />
    </svg>
  );
}

export default TshirtSVG;
