import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function Counter({ end, suffix = '', label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    const duration = 2000; // 2 seconds

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Parse end value if it's a string like "500+"
      const endValue = typeof end === 'string' ? parseInt(end) : end;
      setCount(Math.floor(progress * endValue));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isInView, end]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center p-6"
    >
      <div className="text-5xl md:text-6xl font-heading font-bold text-gradient mb-2">
        {count}{suffix}
      </div>
      <div className="text-grey-light text-lg">
        {label}
      </div>
    </motion.div>
  );
}

export default Counter;
