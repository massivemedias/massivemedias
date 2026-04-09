/**
 * ScrollToTopButton - Bouton fleche pour remonter en haut de page
 * Apparait quand on scroll vers le bas (> 400px)
 */
import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-accent/80 text-white flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-accent transition-all hover:scale-110"
      aria-label="Remonter en haut"
    >
      <ArrowUp size={18} />
    </button>
  );
}

export default ScrollToTopButton;
