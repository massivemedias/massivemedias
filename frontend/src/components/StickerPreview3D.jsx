import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ---------------------------------------------------------------------------
// StickerPreview3D
// Realistic sticker stack preview using actual finish texture photos as
// overlays (mix-blend-mode) on top of the customer's uploaded design.
// Mouse-move parallax on desktop, gentle idle animation on mobile.
// ---------------------------------------------------------------------------

// -- Finish texture image paths ----------------------------------------------
const FINISH_TEXTURES = {
  matte: null, // no overlay for matte
  glossy: '/images/stickers/finish-glossy.webp',
  holographic: '/images/stickers/finish-holographic.webp',
  'broken-glass': '/images/stickers/finish-broken-glass.webp',
  stars: '/images/stickers/finish-stars.webp',
  dots: '/images/stickers/finish-dots.webp',
};

// Blend mode per finish - tuned for best visual result
const FINISH_BLEND = {
  glossy: 'soft-light',
  holographic: 'overlay',
  'broken-glass': 'screen',
  stars: 'screen',
  dots: 'overlay',
};

// How much the overlay shifts relative to mouse (higher = more holographic shift)
const FINISH_SHIFT_INTENSITY = {
  glossy: 15,
  holographic: 40,
  'broken-glass': 35,
  stars: 25,
  dots: 20,
};

// Overlay opacity per finish
const FINISH_OPACITY = {
  glossy: 0.6,
  holographic: 0.75,
  'broken-glass': 0.7,
  stars: 0.7,
  dots: 0.65,
};

// -- Shape clip-paths & styles -----------------------------------------------
const SHAPE_STYLES = {
  round: {
    borderRadius: '50%',
    aspectRatio: '1 / 1',
  },
  square: {
    borderRadius: '8%',
    aspectRatio: '1 / 1',
  },
  rectangle: {
    borderRadius: '6%',
    aspectRatio: '3 / 2',
  },
  diecut: {
    borderRadius: '4px',
    aspectRatio: '1 / 1',
  },
};

// -- Stack layout for background stickers ------------------------------------
const STACK_CARDS = [
  { rotate: -7, x: -14, y: 10, scale: 0.91, zIndex: 1, curlCorner: 'bottom-right' },
  { rotate: 5, x: 12, y: 7, scale: 0.93, zIndex: 2, curlCorner: 'bottom-left' },
];

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
    const url = URL.createObjectURL(image);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  return src;
}

// -- Placeholder when no image -----------------------------------------------
function Placeholder() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, var(--color-accent, #6366f1) 0%, var(--color-accent-muted, #a855f7) 50%, var(--color-accent, #6366f1) 100%)',
      }}
    >
      <span className="text-white/80 text-xs md:text-sm font-medium text-center px-4 drop-shadow-sm select-none">
        Votre design ici
      </span>
    </div>
  );
}

// -- Finish texture overlay using real photos --------------------------------
function FinishTextureOverlay({ finish, mouseX, mouseY }) {
  const textureSrc = FINISH_TEXTURES[finish];
  if (!textureSrc) return null;

  const shiftIntensity = FINISH_SHIFT_INTENSITY[finish] || 20;
  const blendMode = FINISH_BLEND[finish] || 'overlay';
  const opacity = FINISH_OPACITY[finish] || 0.7;

  // Shift the overlay position based on mouse to simulate holographic tilt
  const translateX = useTransform(mouseX, [0, 1], [-shiftIntensity, shiftIntensity]);
  const translateY = useTransform(mouseY, [0, 1], [-shiftIntensity * 0.6, shiftIntensity * 0.6]);
  const springX = useSpring(translateX, { stiffness: 120, damping: 25 });
  const springY = useSpring(translateY, { stiffness: 120, damping: 25 });

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        // Oversize the overlay so shifts don't reveal edges
        inset: `-${shiftIntensity + 10}px`,
        x: springX,
        y: springY,
        mixBlendMode: blendMode,
        opacity,
      }}
    >
      <img
        src={textureSrc}
        alt=""
        draggable={false}
        className="w-full h-full object-cover"
        style={{ display: 'block' }}
      />
    </motion.div>
  );
}

// -- Glossy highlight curve (top-left specular reflection) --------------------
function GlossyHighlight({ mouseX, mouseY, finish }) {
  // Only show on finishes that have shine
  if (finish === 'matte') return null;

  const highlightX = useTransform(mouseX, [0, 1], [15, 55]);
  const highlightY = useTransform(mouseY, [0, 1], [10, 40]);
  const springHX = useSpring(highlightX, { stiffness: 100, damping: 20 });
  const springHY = useSpring(highlightY, { stiffness: 100, damping: 20 });

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: useTransform(
          [springHX, springHY],
          ([hx, hy]) =>
            `radial-gradient(ellipse 60% 50% at ${hx}% ${hy}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 30%, transparent 70%)`
        ),
        mixBlendMode: 'overlay',
      }}
    />
  );
}

// -- Corner curl effect (CSS gradient simulation) ----------------------------
function CornerCurl({ corner = 'bottom-right', shape }) {
  if (shape === 'round') return null;

  const positions = {
    'bottom-right': { bottom: 0, right: 0, transform: 'none' },
    'bottom-left': { bottom: 0, left: 0, transform: 'scaleX(-1)' },
    'top-right': { top: 0, right: 0, transform: 'scaleY(-1)' },
  };

  const pos = positions[corner] || positions['bottom-right'];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: '18%',
        height: '18%',
        ...pos,
        background: `linear-gradient(225deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 30%, transparent 50%)`,
        borderRadius: 'inherit',
        zIndex: 3,
      }}
    />
  );
}

// -- Single sticker card (used for hero and stack) ---------------------------
function StickerCard({
  imageSrc,
  finish,
  shape,
  isHero,
  mouseX,
  mouseY,
  curlCorner = 'bottom-right',
  style,
  className = '',
}) {
  const shapeStyle = SHAPE_STYLES[shape] || SHAPE_STYLES.round;
  const filterStyle = finish === 'matte'
    ? { filter: 'saturate(0.92) brightness(0.97)' }
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
      {/* Vinyl sticker body with thickness */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          ...shapeStyle,
          // Vinyl border - slightly lighter edge for thickness illusion
          boxShadow: isHero
            ? `
              0 0 0 2.5px rgba(220,220,220,0.25),
              0 0 0 3.5px rgba(180,180,180,0.12),
              0 1px 1px 3px rgba(0,0,0,0.15),
              0 6px 20px rgba(0,0,0,0.25),
              0 12px 40px rgba(0,0,0,0.18)
            `
            : `
              0 0 0 2px rgba(220,220,220,0.18),
              0 0 0 3px rgba(180,180,180,0.08),
              0 3px 12px rgba(0,0,0,0.2),
              0 6px 24px rgba(0,0,0,0.12)
            `,
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
          <Placeholder />
        )}

        {/* Real finish texture overlay (hero only) */}
        {isHero && (
          <FinishTextureOverlay finish={finish} mouseX={mouseX} mouseY={mouseY} />
        )}

        {/* Glossy specular highlight (hero only) */}
        {isHero && (
          <GlossyHighlight mouseX={mouseX} mouseY={mouseY} finish={finish} />
        )}

        {/* Vinyl inner edge highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: shapeStyle.borderRadius,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 -1px 0 rgba(0,0,0,0.08),
              inset 1px 0 0 rgba(255,255,255,0.06),
              inset -1px 0 0 rgba(255,255,255,0.06)
            `,
          }}
        />

        {/* Corner curl */}
        {!isHero && <CornerCurl corner={curlCorner} shape={shape} />}
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

  useEffect(() => {
    isMobile.current = window.matchMedia('(max-width: 768px)').matches;
  }, []);

  // Mouse position as 0-1 values
  const rawMouseX = useMotionValue(0.5);
  const rawMouseY = useMotionValue(0.5);
  const mouseX = useSpring(rawMouseX, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(rawMouseY, { stiffness: 150, damping: 20 });

  // 3D tilt rotation from mouse
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
  const containerAspect = shape === 'rectangle' ? 'aspect-[3/2]' : 'aspect-square';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[250px] md:max-w-[380px] mx-auto select-none"
    >
      {/* Surface/table shadow beneath the stack */}
      <div
        className="absolute inset-x-4 bottom-0 h-6 md:h-8 z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(0,0,0,0.3) 0%, transparent 70%)',
          filter: 'blur(8px)',
          transform: 'translateY(50%)',
        }}
      />

      {/* 3D perspective wrapper */}
      <motion.div
        className={`relative ${containerAspect} w-full`}
        style={{
          perspective: '800px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Idle float + mouse tilt */}
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
              }}
              initial={{ opacity: 0, scale: 0.85, rotate: 0, x: 0, y: 0 }}
              animate={{
                opacity: 0.65,
                scale: card.scale,
                rotate: card.rotate,
                x: card.x,
                y: card.y,
              }}
              transition={{ delay: 0.12 * (i + 1), duration: 0.5, ease: 'easeOut' }}
            >
              <StickerCard
                imageSrc={imageSrc}
                finish={finish}
                shape={shape}
                isHero={false}
                mouseX={mouseX}
                mouseY={mouseY}
                curlCorner={card.curlCorner}
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
