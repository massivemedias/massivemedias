import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

function Counter({ end, suffix = '', label }) {
  // Valeur finale parsee une seule fois ("500+" -> 500, 2022 -> 2022).
  const endValue = typeof end === 'string' ? parseInt(end, 10) : end;

  // On initialise l'etat A LA VALEUR FINALE : le rendu, le snapshot de
  // prerender et le mode sans JS affichent tout de suite le vrai chiffre
  // (avant ce fix l'etat partait de 0 et restait a 0 sans scroll). Le
  // comptage anime de 0 vers la valeur reste un enrichissement progressif
  // declenche au scroll via isInView.
  const [count, setCount] = useState(endValue);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    const duration = 2000; // 2 seconds

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isInView, endValue]);

  // div simple (plus de motion.div avec opacity:0 initial) : le bloc est
  // visible par defaut, donc correct au prerender et sans interaction.
  return (
    <div ref={ref} className="text-center p-6">
      <div className="text-5xl md:text-6xl font-heading font-bold text-gradient mb-2">
        {count}{suffix}
      </div>
      <div className="text-grey-light text-lg">
        {label}
      </div>
    </div>
  );
}

export default Counter;
