import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// StickerPreview3D
// Shows a fanned-out stack of 3-4 stickers with the customer's uploaded
// design (or a placeholder gradient). The top sticker is the "hero" and
// finish effects (holographic, glossy, etc.) are applied as CSS overlays.
// Mouse-move parallax on desktop, gentle idle animation on mobile.
// ---------------------------------------------------------------------------

// -- Shape clip-paths & styles -----------------------------------------------
const SHAPE_STYLES = {
  round: {
    clipPath: 'circle(50% at 50% 50%)',
    borderRadius: '50%',
    aspectRatio: '1 / 1',
  },
  square: {
    clipPath: 'none',
    borderRadius: '8%',
    aspectRatio: '1 / 1',
  },
  rectangle: {
    clipPath: 'none',
    borderRadius: '6%',
    aspectRatio: '3 / 2',
  },
  diecut: {
    clipPath: 'none',
    borderRadius: '4px',
    aspectRatio: '1 / 1',
    border: '2px dashed rgba(255,255,255,0.25)',
  },
};

// -- Stack layout for background stickers ------------------------------------
const STACK_CARDS = [
  { rotate: -6, x: -12, y: 8, scale: 0.92, zIndex: 1 },
  { rotate: 4.5, x: 10, y: 6, scale: 0.94, zIndex: 2 },
  { rotate: -2, x: -4, y: 3, scale: 0.97, zIndex: 3 },
];

// -- Finish overlay components -----------------------------------------------

function MatteOverlay() {
  // Matte: very subtle desaturation, no shine
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, transparent 100%)',
        mixBlendMode: 'multiply',
      }}
    />
  );
}

function GlossyOverlay({ mouseX }) {
  // Glossy: a white shine sweep that follows mouse X
  const sweepX = useTransform(mouseX, [0, 1], [-80, 180]);
  const sweepPct = useSpring(sweepX, { stiffness: 200, damping: 30 });

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: useTransform(
          sweepPct,
          (v) =>
            `linear-gradient(${105}deg, transparent ${v - 40}%, rgba(255,255,255,0.35) ${v}%, rgba(255,255,255,0.08) ${v + 20}%, transparent ${v + 50}%)`
        ),
        mixBlendMode: 'overlay',
      }}
    />
  );
}

function HolographicOverlay({ mouseX, mouseY }) {
  // Animated rainbow gradient that shifts with mouse
  const hueShift = useTransform(mouseX, [0, 1], [0, 360]);
  const angle = useTransform(mouseY, [0, 1], [120, 240]);
  const springHue = useSpring(hueShift, { stiffness: 120, damping: 25 });
  const springAngle = useSpring(angle, { stiffness: 120, damping: 25 });

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: useTransform(
          [springHue, springAngle],
          ([h, a]) =>
            `linear-gradient(${a}deg,
              hsla(${h}, 100%, 70%, 0.35),
              hsla(${(h + 60) % 360}, 100%, 65%, 0.3),
              hsla(${(h + 120) % 360}, 100%, 70%, 0.35),
              hsla(${(h + 180) % 360}, 100%, 65%, 0.3),
              hsla(${(h + 240) % 360}, 100%, 70%, 0.35),
              hsla(${(h + 300) % 360}, 100%, 65%, 0.3))`
        ),
        mixBlendMode: 'color-dodge',
        opacity: 0.7,
      }}
    />
  );
}

function BrokenGlassOverlay({ mouseX, mouseY }) {
  // Prismatic refraction - sharp angled gradients
  const shift = useTransform(mouseX, [0, 1], [0, 100]);
  const springShift = useSpring(shift, { stiffness: 150, damping: 25 });

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        background: useTransform(
          springShift,
          (s) =>
            `conic-gradient(from ${s * 3.6}deg at 30% 40%,
              rgba(0,255,255,0.3) 0deg, transparent 30deg,
              rgba(255,0,255,0.25) 60deg, transparent 90deg,
              rgba(255,255,0,0.3) 120deg, transparent 150deg,
              rgba(0,255,128,0.25) 180deg, transparent 210deg,
              rgba(128,0,255,0.3) 240deg, transparent 270deg,
              rgba(255,128,0,0.25) 300deg, transparent 330deg,
              rgba(0,255,255,0.3) 360deg),
            conic-gradient(from ${180 + s * 3.6}deg at 70% 60%,
              rgba(255,0,128,0.2) 0deg, transparent 45deg,
              rgba(0,128,255,0.2) 90deg, transparent 135deg,
              rgba(255,255,0,0.2) 180deg, transparent 225deg,
              rgba(0,255,255,0.2) 270deg, transparent 315deg,
              rgba(255,0,128,0.2) 360deg)`
        ),
        mixBlendMode: 'screen',
        opacity: 0.8,
      }}
    />
  );
}

function StarsOverlay() {
  // Animated gold sparkle overlay
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 6,
        delay: Math.random() * 2,
        duration: 1.2 + Math.random() * 1.5,
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: [0, 180],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* 4-point star shape */}
          <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z"
              fill="rgba(255,215,0,0.8)"
            />
          </svg>
        </motion.div>
      ))}
      {/* Golden sheen base */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 40% 30%, rgba(255,215,0,0.15), transparent 70%)',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}

function DotsOverlay({ mouseX }) {
  // Animated polka-dot shimmer
  const offset = useTransform(mouseX, [0, 1], [0, 20]);
  const springOffset = useSpring(offset, { stiffness: 100, damping: 20 });

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: useTransform(
          springOffset,
          (o) =>
            `radial-gradient(circle 4px at ${10 + o}px ${10 + o}px, rgba(255,255,255,0.35) 2px, transparent 2px)`
        ),
        backgroundSize: '18px 18px',
        mixBlendMode: 'overlay',
        opacity: 0.7,
      }}
    >
      {/* Second layer offset for richer pattern */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: useTransform(
            springOffset,
            (o) =>
              `radial-gradient(circle 3px at ${19 - o * 0.5}px ${19 - o * 0.5}px, rgba(255,180,220,0.3) 1.5px, transparent 1.5px)`
          ),
          backgroundSize: '18px 18px',
          mixBlendMode: 'screen',
        }}
      />
    </motion.div>
  );
}

// -- Finish overlay router ---------------------------------------------------
function FinishOverlay({ finish, mouseX, mouseY }) {
  switch (finish) {
    case 'glossy':
    case 'lustre':
      return <GlossyOverlay mouseX={mouseX} />;
    case 'holographic':
      return <HolographicOverlay mouseX={mouseX} mouseY={mouseY} />;
    case 'broken-glass':
      return <BrokenGlassOverlay mouseX={mouseX} mouseY={mouseY} />;
    case 'stars':
      return <StarsOverlay />;
    case 'dots':
      return <DotsOverlay mouseX={mouseX} />;
    case 'matte':
    default:
      return <MatteOverlay />;
  }
}

// -- Image source helper (File/Blob or URL) ----------------------------------
function useImageSrc(image) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!image) {
      setSrc(null);
      return;
    }
    if (typeof image === 'string') {
      setSrc(image);
      return;
    }
    // File or Blob
    const url = URL.createObjectURL(image);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  return src;
}

// -- Placeholder when no image -----------------------------------------------
function Placeholder({ shapeStyle }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, var(--color-accent, #6366f1) 0%, var(--color-accent-muted, #a855f7) 50%, var(--color-accent, #6366f1) 100%)',
        ...shapeStyle,
      }}
    >
      <span className="text-white/80 text-xs md:text-sm font-medium text-center px-4 drop-shadow-sm select-none">
        Votre design ici
      </span>
    </div>
  );
}

// -- Single sticker card (used for hero and stack) ---------------------------
function StickerCard({ imageSrc, finish, shape, isHero, mouseX, mouseY, style, className = '' }) {
  const shapeStyle = SHAPE_STYLES[shape] || SHAPE_STYLES.round;
  const filterStyle = finish === 'matte'
    ? { filter: 'saturate(0.9) brightness(0.97)' }
    : {};

  return (
    <div
      className={`absolute ${className}`}
      style={{
        ...style,
        width: '100%',
        height: '100%',
      }}
    >
      {/* Shadow layer */}
      <div
        className="absolute inset-0"
        style={{
          ...shapeStyle,
          clipPath: shapeStyle.clipPath !== 'none' ? shapeStyle.clipPath : undefined,
          boxShadow: isHero
            ? '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)'
            : '0 4px 16px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1)',
        }}
      />

      {/* Sticker body */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          ...shapeStyle,
          clipPath: shapeStyle.clipPath !== 'none' ? shapeStyle.clipPath : undefined,
        }}
      >
        {/* Image or placeholder */}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Sticker preview"
            className="w-full h-full object-cover"
            style={filterStyle}
            draggable={false}
          />
        ) : (
          <Placeholder shapeStyle={{}} />
        )}

        {/* Finish effect overlay */}
        {isHero && <FinishOverlay finish={finish} mouseX={mouseX} mouseY={mouseY} />}

        {/* Subtle white border for vinyl sticker look */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            ...shapeStyle,
            clipPath: shapeStyle.clipPath !== 'none' ? shapeStyle.clipPath : undefined,
            boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.15)',
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function StickerPreview3D({
  image = null,
  finish = 'matte',
  shape = 'round',
  size = '2.5in',
}) {
  const containerRef = useRef(null);
  const isMobile = useRef(false);

  // Check mobile on mount
  useEffect(() => {
    isMobile.current = window.matchMedia('(max-width: 768px)').matches;
  }, []);

  // Mouse position as 0-1 values relative to the container
  const rawMouseX = useMotionValue(0.5);
  const rawMouseY = useMotionValue(0.5);
  const mouseX = useSpring(rawMouseX, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(rawMouseY, { stiffness: 150, damping: 20 });

  // 3D rotation from mouse (desktop only)
  const rotateX = useTransform(mouseY, [0, 1], [8, -8]);
  const rotateY = useTransform(mouseX, [0, 1], [-8, 8]);

  const handleMouseMove = useCallback((e) => {
    if (isMobile.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawMouseX.set((e.clientX - rect.left) / rect.width);
    rawMouseY.set((e.clientY - rect.top) / rect.height);
  }, [rawMouseX, rawMouseY]);

  const handleMouseLeave = useCallback(() => {
    rawMouseX.set(0.5);
    rawMouseY.set(0.5);
  }, [rawMouseX, rawMouseY]);

  const imageSrc = useImageSrc(image);

  // Determine aspect ratio class based on shape
  const containerAspect = shape === 'rectangle' ? 'aspect-[3/2]' : 'aspect-square';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[250px] md:max-w-[380px] mx-auto select-none"
    >
      {/* 3D perspective wrapper */}
      <motion.div
        className={`relative ${containerAspect} w-full`}
        style={{
          perspective: '800px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Idle float animation (works on mobile too) */}
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            rotateX,
            rotateY,
          }}
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Background stack cards */}
          {STACK_CARDS.map((card, i) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              style={{
                zIndex: card.zIndex,
                transform: `rotate(${card.rotate}deg) translateX(${card.x}px) translateY(${card.y}px) scale(${card.scale})`,
              }}
              initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
              animate={{ opacity: 0.7, scale: card.scale, rotate: card.rotate }}
              transition={{ delay: 0.1 * (i + 1), duration: 0.5, ease: 'easeOut' }}
            >
              <StickerCard
                imageSrc={imageSrc}
                finish={finish}
                shape={shape}
                isHero={false}
                mouseX={mouseX}
                mouseY={mouseY}
                style={{}}
              />
            </motion.div>
          ))}

          {/* Hero sticker - on top */}
          <motion.div
            className="absolute inset-0"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <StickerCard
              imageSrc={imageSrc}
              finish={finish}
              shape={shape}
              isHero={true}
              mouseX={mouseX}
              mouseY={mouseY}
              style={{}}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Size label badge */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <span className="inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold text-heading bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
          {size}
        </span>
      </motion.div>
    </div>
  );
}
