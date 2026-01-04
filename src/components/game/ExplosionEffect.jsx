import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ExplosionEffect({ duration = 2000, onComplete, intensity = 1 }) {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onComplete]);
  
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 2, 3] }}
      transition={{ duration: duration / 1000, times: [0, 0.2, 0.5, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className="relative">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: duration / 1000,
            repeat: Infinity,
            ease: "linear"
          }}
          className="text-9xl"
        >
          💥
        </motion.div>
        
        {intensity > 1 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 4] }}
              transition={{ duration: duration / 1000 }}
              className="absolute inset-0 bg-orange-500 rounded-full blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: duration / 1000 }}
              className="absolute inset-0 bg-red-500 rounded-full blur-2xl"
            />
          </>
        )}
      </div>
    </motion.div>
  );
}