import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MANIDialog({ messages, onComplete, showProgress = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < messages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border-4 border-cyan-500 rounded-lg shadow-2xl"
        style={{
          width: 'min(420px, 90vw)',
          maxHeight: '70vh',
          padding: '32px'
        }}
      >
        <div className="mb-6">
          <div className="text-cyan-400 font-bold text-xl mb-2 glow-cyan">M.A.N.I.</div>
          <div className="text-xs text-cyan-400/60">Monetary Administrative Neutralizer Interface</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-8"
          >
            <p className="text-cyan-100 text-base leading-relaxed whitespace-pre-line">
              {messages[currentIndex]}
            </p>
          </motion.div>
        </AnimatePresence>

        {showProgress && (
          <div className="mb-4 text-xs text-cyan-400/60 text-center">
            {currentIndex + 1} / {messages.length}
          </div>
        )}

        <button
          onClick={handleNext}
          className="w-full bg-cyan-600 hover:bg-cyan-700 border-2 border-cyan-500 rounded-lg py-3 text-white font-bold text-sm transition-colors"
        >
          {currentIndex < messages.length - 1 ? 'NEXT' : 'CONTINUE'}
        </button>
      </motion.div>
    </div>
  );
}