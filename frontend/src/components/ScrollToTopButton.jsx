/**
 * ScrollToTopButton - Bouton fleche pour remonter en haut de page.
 * Apparait quand on scroll vers le bas (> 400px).
 *
 * STICKY-STACK (30 avril 2026) : positionnement retire (etait
 * `fixed bottom-20 right-4 z-40`). Le composant est maintenant
 * destine a etre rendu DANS un flex-col stack (cf. MainLayout)
 * qui controle position + alignement de tous les boutons sticky
 * (WhatsApp, Back-to-top, etc) sur le meme axe vertical droit.
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
      className="w-10 h-10 rounded-full bg-accent/80 text-white flex items-center justify-center shadow-md hover:shadow-lg shadow-accent/30 hover:bg-accent transition-all duration-300 hover:scale-110"
      aria-label="Remonter en haut"
    >
      <ArrowUp size={18} />
    </button>
  );
}

export default ScrollToTopButton;
